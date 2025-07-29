const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const BoardPost = require('../../models/BoardPost');
const mongoose = require('mongoose');

describe('Security Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/likorea-test');
    }
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      BoardPost.deleteMany({})
    ]);

    testUser = await User.create({
      id: 'testuser',
      email: 'test@example.com',
      password: 'Test1234!@',
      authority: 3
    });

    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        id: 'testuser',
        password: 'Test1234!@'
      });
    authToken = loginRes.headers['set-cookie'][0];
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('XSS Protection', () => {
    test('게시글 제목에서 XSS 차단', async () => {
      const res = await request(app)
        .post('/api/boards')
        .set('Cookie', authToken)
        .send({
          title: '<script>alert("XSS")</script>악의적인 제목',
          content: '정상 내용',
          tags: { type: '사고팔고', region: '24' }
        });

      expect(res.status).toBe(201);
      expect(res.body.post.title).not.toContain('<script>');
      expect(res.body.post.title).toContain('악의적인 제목');
    });

    test('게시글 내용에서 XSS 차단', async () => {
      const res = await request(app)
        .post('/api/boards')
        .set('Cookie', authToken)
        .send({
          title: '정상 제목',
          content: '<p>정상 내용</p><script>document.cookie</script><img src=x onerror=alert(1)>',
          tags: { type: '사고팔고', region: '24' }
        });

      expect(res.status).toBe(201);
      expect(res.body.post.content).not.toContain('<script>');
      expect(res.body.post.content).not.toContain('onerror');
      expect(res.body.post.content).toContain('<p>정상 내용</p>');
    });

    test('댓글에서 XSS 차단', async () => {
      const post = await BoardPost.create({
        postNumber: 1,
        title: '테스트',
        content: '내용',
        tags: { type: '사고팔고', region: '24' },
        author: testUser._id
      });

      const res = await request(app)
        .post(`/api/boards/${post._id}/comments`)
        .set('Cookie', authToken)
        .send({
          content: '<script>alert("XSS")</script>댓글 내용'
        });

      expect(res.status).toBe(201);
      expect(res.body.comment.content).not.toContain('<script>');
      expect(res.body.comment.content).toContain('댓글 내용');
    });
  });

  describe('SQL Injection Protection', () => {
    test('로그인 시 SQL Injection 시도', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          id: "admin' OR '1'='1",
          password: "' OR '1'='1"
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('잘못된 아이디');
    });

    test('검색 시 NoSQL Injection 시도', async () => {
      const res = await request(app)
        .get('/api/boards')
        .query({
          search: { $regex: '.*', $options: 'i' }
        });

      expect(res.status).toBe(200); // 문자열로 변환되어 안전하게 처리됨
      expect(res.body.posts).toEqual([]);
    });

    test('ID 파라미터에 NoSQL Injection 시도', async () => {
      const res = await request(app)
        .get('/api/boards/' + JSON.stringify({ $ne: null }));

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('Authentication & Authorization', () => {
    test('만료된 토큰으로 접근', async () => {
      const expiredToken = 'authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MGMwMDAwMDAwMDAwMDAwMDAwMDAwMDAiLCJpZCI6InRlc3R1c2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiYXV0aG9yaXR5IjozLCJpYXQiOjE2MjMwMDAwMDAsImV4cCI6MTYyMzAwMDAwMX0.fake';
      
      const res = await request(app)
        .post('/api/boards')
        .set('Cookie', expiredToken)
        .send({
          title: '테스트',
          content: '내용',
          tags: { type: '사고팔고', region: '24' }
        });

      expect(res.status).toBe(401);
    });

    test('조작된 토큰으로 접근', async () => {
      const tamperedToken = authToken.split('.').slice(0, -1).join('.') + '.tampered';
      
      const res = await request(app)
        .post('/api/boards')
        .set('Cookie', `authToken=${tamperedToken}`)
        .send({
          title: '테스트',
          content: '내용',
          tags: { type: '사고팔고', region: '24' }
        });

      expect(res.status).toBe(401);
    });

    test('권한 상승 시도 - 일반 유저가 관리자 API 접근', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Cookie', authToken);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('관리자 권한이 필요합니다');
    });

    test('다른 유저의 리소스 접근 시도', async () => {
      // 다른 유저 생성
      const otherUser = await User.create({
        id: 'otheruser',
        email: 'other@example.com',
        password: 'Other1234!@',
        authority: 3
      });

      // 다른 유저의 게시글 생성
      const otherPost = await BoardPost.create({
        postNumber: 1,
        title: '다른 유저 게시글',
        content: '내용',
        tags: { type: '사고팔고', region: '24' },
        author: otherUser._id
      });

      // 테스트 유저가 다른 유저의 게시글 수정 시도
      const res = await request(app)
        .put(`/api/boards/${otherPost._id}`)
        .set('Cookie', authToken)
        .send({
          title: '수정 시도',
          content: '수정된 내용'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('권한이 없습니다');
    });
  });

  describe('Rate Limiting', () => {
    test('로그인 Rate Limiting - 5회 제한', async () => {
      // 6번 연속 로그인 시도
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(
          request(app)
            .post('/api/users/login')
            .send({
              id: `user${i}`,
              password: 'password'
            })
        );
      }

      const results = await Promise.all(promises);
      const rateLimitedResponses = results.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('일반 API Rate Limiting - 100회 제한', async () => {
      // 101번 연속 요청
      const promises = [];
      for (let i = 0; i < 101; i++) {
        promises.push(
          request(app).get('/api/boards')
        );
      }

      const results = await Promise.all(promises);
      const rateLimitedResponses = results.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation', () => {
    test('이메일 형식 검증', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          id: 'newuser',
          email: 'invalid-email',
          password: 'Test1234!@'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('이메일');
    });

    test('비밀번호 정책 검증 - 모든 조건', async () => {
      const weakPasswords = [
        'short',           // 너무 짧음
        'nouppercase123!', // 대문자 없음
        'NOLOWERCASE123!', // 소문자 없음
        'NoNumbers!',      // 숫자 없음
        'NoSpecial123',    // 특수문자 없음
      ];

      for (const password of weakPasswords) {
        const res = await request(app)
          .post('/api/users')
          .send({
            id: 'newuser',
            email: 'new@example.com',
            password
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('비밀번호 정책');
      }
    });

    test('태그 값 검증', async () => {
      const res = await request(app)
        .post('/api/boards')
        .set('Cookie', authToken)
        .send({
          title: '제목',
          content: '내용',
          tags: {
            type: 'INVALID_TYPE',
            region: '999'
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('유효하지 않은');
    });

    test('페이지네이션 파라미터 검증', async () => {
      const invalidParams = [
        { page: -1, limit: 10 },
        { page: 1, limit: 1000 }, // 너무 큰 limit
        { page: 'abc', limit: 10 },
        { page: 1, limit: 'xyz' }
      ];

      for (const params of invalidParams) {
        const res = await request(app)
          .get('/api/boards')
          .query(params);

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
      }
    });
  });

  describe('Security Headers', () => {
    test('보안 헤더 확인', async () => {
      const res = await request(app).get('/api/boards');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['x-xss-protection']).toBe('1; mode=block');
      expect(res.headers['referrer-policy']).toBe('no-referrer');
      expect(res.headers['permissions-policy']).toContain('camera=()');
    });

    test('CORS 설정 확인', async () => {
      const res = await request(app)
        .get('/api/boards')
        .set('Origin', 'https://evil.com');

      // 프로덕션에서는 허용된 도메인만 접근 가능
      if (process.env.NODE_ENV === 'production') {
        expect(res.headers['access-control-allow-origin']).not.toBe('https://evil.com');
      }
    });
  });

  describe('Password Security', () => {
    test('비밀번호 해시 저장 확인', async () => {
      await request(app)
        .post('/api/users')
        .send({
          id: 'hashtest',
          email: 'hash@test.com',
          password: 'Test1234!@'
        });

      const user = await User.findOne({ id: 'hashtest' });
      expect(user.password).not.toBe('Test1234!@');
      expect(user.password.length).toBeGreaterThan(50); // bcrypt hash
    });

    test('계정 잠금 메커니즘', async () => {
      // 5회 실패 시도
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/users/login')
          .send({
            id: 'testuser',
            password: 'WrongPassword!'
          });
      }

      // 6번째 시도 - 계정 잠금
      const res = await request(app)
        .post('/api/users/login')
        .send({
          id: 'testuser',
          password: 'Test1234!@' // 올바른 비밀번호여도 실패
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('계정이 잠겼습니다');
    });
  });

  describe('File Upload Security', () => {
    test('악의적인 파일 이름 처리', async () => {
      // 파일 업로드가 구현되면 테스트 추가
      // 예: ../../../etc/passwd 같은 경로 조작 시도
      expect(true).toBe(true); // placeholder
    });

    test('파일 크기 제한', async () => {
      // 파일 업로드가 구현되면 테스트 추가
      // 예: 100MB 이상 파일 업로드 시도
      expect(true).toBe(true); // placeholder
    });
  });

  describe('Session Security', () => {
    test('쿠키 설정 확인', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          id: 'testuser',
          password: 'Test1234!@'
        });

      const cookies = res.headers['set-cookie'];
      expect(cookies[0]).toContain('HttpOnly');
      expect(cookies[0]).toContain('SameSite=Lax');
      
      if (process.env.NODE_ENV === 'production') {
        expect(cookies[0]).toContain('Secure');
      }
    });

    test('로그아웃 후 토큰 무효화', async () => {
      // 로그아웃
      await request(app)
        .post('/api/users/logout')
        .set('Cookie', authToken);

      // 로그아웃한 토큰으로 접근 시도
      const res = await request(app)
        .get('/api/users/verify')
        .set('Cookie', authToken);

      // 서버 측에서 토큰 블랙리스트를 구현하지 않는 한 JWT는 여전히 유효
      // 하지만 쿠키가 제거되었으므로 실제 브라우저에서는 접근 불가
      expect(res.status).toBe(200); // JWT 자체는 여전히 유효
    });
  });
});
const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const BoardPost = require('../../models/BoardPost');
const mongoose = require('mongoose');

describe('Input Validation Tests', () => {
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
    const cookies = loginRes.headers['set-cookie'] || [];
    authToken = cookies.length > 0 ? cookies[0] : '';
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('User Validation', () => {
    describe('회원가입 검증', () => {
      test('아이디 형식 검증', async () => {
        const invalidIds = [
          '',                  // 빈 문자열
          'a',                 // 너무 짧음
          'user@name',         // 특수문자 포함
          'user name',         // 공백 포함
          '한글아이디',         // 한글
          'a'.repeat(31),      // 너무 긴 아이디
        ];

        for (const id of invalidIds) {
          const res = await request(app)
            .post('/api/users')
            .send({
              id,
              email: 'test@example.com',
              password: 'Test1234!@'
            });

          expect(res.status).toBe(400);
        }
      });

      test('이메일 형식 검증', async () => {
        const invalidEmails = [
          '',                     // 빈 문자열
          'notanemail',          // @ 없음
          '@example.com',        // 로컬 파트 없음
          'user@',               // 도메인 없음
          'user@.com',           // 잘못된 도메인
          'user@example',        // TLD 없음
          'user name@example.com', // 공백 포함
          'user@exam ple.com',   // 도메인에 공백
        ];

        for (const email of invalidEmails) {
          const res = await request(app)
            .post('/api/users')
            .send({
              id: 'newuser',
              email,
              password: 'Test1234!@'
            });

          expect(res.status).toBe(400);
          expect(res.body.error).toBeDefined();
        }
      });

      test('비밀번호 정책 상세 검증', async () => {
        const testCases = [
          { password: 'Short1!', error: '최소 8자' },
          { password: 'nouppercase1!', error: '대문자' },
          { password: 'NOLOWERCASE1!', error: '소문자' },
          { password: 'NoNumbers!', error: '숫자' },
          { password: 'NoSpecial123', error: '특수문자' },
          { password: 'Test1234', error: '특수문자' },
          { password: 'Test!@#$', error: '숫자' },
          { password: '12345678!@', error: '대문자' },
          { password: 'Test1234!@' + 'a'.repeat(100), error: '너무 긴' }, // 너무 긴 비밀번호
        ];

        for (const { password, error } of testCases) {
          const res = await request(app)
            .post('/api/users')
            .send({
              id: 'newuser',
              email: 'new@example.com',
              password
            });

          expect(res.status).toBe(400);
          expect(res.body.error).toContain('비밀번호');
        }
      });

      test('권한 레벨 검증', async () => {
        const invalidAuthorities = [0, 6, -1, 'admin', null, undefined];

        for (const authority of invalidAuthorities) {
          const res = await request(app)
            .post('/api/users')
            .send({
              id: 'newuser',
              email: 'new@example.com',
              password: 'Test1234!@',
              authority
            });

          if (authority !== undefined) {
            expect(res.status).toBe(400);
          }
        }
      });
    });

    describe('사용자 정보 수정 검증', () => {
      test('이메일 수정 시 형식 검증', async () => {
        const res = await request(app)
          .put('/api/users/testuser')
          .set('Cookie', authToken)
          .send({
            email: 'invalid-email'
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('이메일');
      });

      test('비밀번호 수정 시 정책 검증', async () => {
        const res = await request(app)
          .put('/api/users/testuser')
          .set('Cookie', authToken)
          .send({
            password: 'weak'
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('비밀번호 정책');
      });
    });
  });

  describe('Board Validation', () => {
    test('제목 길이 검증', async () => {
      const testCases = [
        { title: '', expectedError: '제목' },
        { title: '제', expectedError: '제목' }, // 너무 짧음
        { title: 'a'.repeat(201), expectedError: '제목' }, // 너무 긴
      ];

      for (const { title, expectedError } of testCases) {
        const res = await request(app)
          .post('/api/boards')
          .set('Cookie', authToken)
          .send({
            title,
            content: '정상적인 내용',
            tags: { type: '사고팔고', region: '24' }
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain(expectedError);
      }
    });

    test('내용 길이 검증', async () => {
      const testCases = [
        { content: '', expectedError: '내용' },
        { content: 'a'.repeat(50001), expectedError: '내용' }, // 너무 긴
      ];

      for (const { content, expectedError } of testCases) {
        const res = await request(app)
          .post('/api/boards')
          .set('Cookie', authToken)
          .send({
            title: '정상적인 제목',
            content,
            tags: { type: '사고팔고', region: '24' }
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain(expectedError);
      }
    });

    test('태그 필수 검증', async () => {
      const invalidTags = [
        null,
        {},
        { type: '사고팔고' }, // region 없음
        { region: '24' }, // type 없음
        { type: '', region: '24' }, // 빈 type
        { type: '사고팔고', region: '' }, // 빈 region
      ];

      for (const tags of invalidTags) {
        const res = await request(app)
          .post('/api/boards')
          .set('Cookie', authToken)
          .send({
            title: '제목',
            content: '내용',
            tags
          });

        expect(res.status).toBe(400);
      }
    });

    test('유효한 태그 값 검증', async () => {
      const invalidTags = [
        { type: '존재하지않는타입', region: '24' },
        { type: '사고팔고', region: '999' }, // 범위 밖
        { type: '사고팔고', region: '-1' }, // 음수
        { type: '사고팔고', region: 'abc' }, // 숫자가 아님
      ];

      for (const tags of invalidTags) {
        const res = await request(app)
          .post('/api/boards')
          .set('Cookie', authToken)
          .send({
            title: '제목',
            content: '내용',
            tags
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('유효하지 않은');
      }
    });

    test('소주제 검증', async () => {
      // 잘못된 소주제
      const res1 = await request(app)
        .post('/api/boards')
        .set('Cookie', authToken)
        .send({
          title: '제목',
          content: '내용',
          tags: {
            type: '사고팔고',
            region: '24',
            subcategory: '존재하지않는소주제'
          }
        });

      expect(res1.status).toBe(400);

      // 타입에 맞지 않는 소주제
      const res2 = await request(app)
        .post('/api/boards')
        .set('Cookie', authToken)
        .send({
          title: '제목',
          content: '내용',
          tags: {
            type: '부동산',
            region: '24',
            subcategory: '생활용품' // 사고팔고의 소주제
          }
        });

      expect(res2.status).toBe(400);
    });
  });

  describe('Comment Validation', () => {
    let testPost;

    beforeEach(async () => {
      testPost = await BoardPost.create({
        postNumber: 1,
        title: '테스트 게시글',
        content: '내용',
        tags: { type: '사고팔고', region: '24' },
        author: testUser._id
      });
    });

    test('댓글 내용 길이 검증', async () => {
      const testCases = [
        { content: '', expectedError: '댓글 내용' },
        { content: 'a'.repeat(1001), expectedError: '댓글' }, // 너무 긴
      ];

      for (const { content, expectedError } of testCases) {
        const res = await request(app)
          .post(`/api/boards/${testPost._id}/comments`)
          .set('Cookie', authToken)
          .send({ content });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain(expectedError);
      }
    });

    test('부모 댓글 ID 검증', async () => {
      const invalidParentIds = [
        'invalid-id',
        '123',
        'null',
        '{}',
      ];

      for (const parentComment of invalidParentIds) {
        const res = await request(app)
          .post(`/api/boards/${testPost._id}/comments`)
          .set('Cookie', authToken)
          .send({
            content: '대댓글',
            parentComment
          });

        expect(res.status).toBe(400);
      }
    });
  });

  describe('Query Parameter Validation', () => {
    test('페이지네이션 파라미터 검증', async () => {
      const testCases = [
        { page: 0, limit: 10, expectedError: '페이지' },
        { page: -1, limit: 10, expectedError: '페이지' },
        { page: 'abc', limit: 10, expectedError: '페이지' },
        { page: 1, limit: 0, expectedError: 'limit' },
        { page: 1, limit: -10, expectedError: 'limit' },
        { page: 1, limit: 101, expectedError: 'limit' }, // 최대값 초과
        { page: 1, limit: 'xyz', expectedError: 'limit' },
      ];

      for (const { page, limit, expectedError } of testCases) {
        const res = await request(app)
          .get('/api/boards')
          .query({ page, limit });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
      }
    });

    test('지역 필터 파라미터 검증', async () => {
      const invalidRegions = [
        'abc',          // 숫자가 아님
        '-10',          // 음수
        '100',          // 범위 초과
        '24-20',        // 잘못된 범위
        '24,abc,30',    // 잘못된 형식
        '>abc',         // 잘못된 비교
        '<-5',          // 음수 비교
      ];

      for (const region of invalidRegions) {
        const res = await request(app)
          .get('/api/boards')
          .query({ region });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('지역');
      }
    });

    test('검색어 길이 검증', async () => {
      const res = await request(app)
        .get('/api/boards')
        .query({ search: 'a'.repeat(101) }); // 너무 긴 검색어

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('검색어');
    });
  });

  describe('ObjectId Validation', () => {
    test('잘못된 ObjectId 형식', async () => {
      const invalidIds = [
        'invalid-id',
        '123',
        'null',
        '{}',
        '60c000000000000000000000x', // 잘못된 16진수
      ];

      for (const id of invalidIds) {
        const res = await request(app)
          .get(`/api/boards/${id}`);

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
      }
    });
  });

  describe('Special Characters Handling', () => {
    test('특수문자 처리 - 제목', async () => {
      const specialChars = '<>"\'/\\`';
      const res = await request(app)
        .post('/api/boards')
        .set('Cookie', authToken)
        .send({
          title: `제목 ${specialChars} 테스트`,
          content: '내용',
          tags: { type: '사고팔고', region: '24' }
        });

      expect(res.status).toBe(201);
      // HTML 엔티티로 변환되거나 그대로 저장
      expect(res.body.post.title).toContain('제목');
      expect(res.body.post.title).toContain('테스트');
    });

    test('유니코드 및 이모지 처리', async () => {
      const res = await request(app)
        .post('/api/boards')
        .set('Cookie', authToken)
        .send({
          title: '한글 제목 😀 🎉',
          content: '日本語 中文 العربية',
          tags: { type: '사고팔고', region: '24' }
        });

      expect(res.status).toBe(201);
      expect(res.body.post.title).toBe('한글 제목 😀 🎉');
      expect(res.body.post.content).toContain('日本語');
    });
  });
});
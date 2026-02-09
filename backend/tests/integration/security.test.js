const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../models/User');
const BoardPost = require('../../models/BoardPost');
const Counter = require('../../models/Counter');
const { initializeEssentialData } = require('../setup/testDb');

describe('Security Tests', () => {
  let app;
  let server;
  let authToken;
  let testUser;

  beforeAll(async () => {
    await initializeEssentialData();
    app = require('../../server');
    server = app.listen(0);
  });

  afterAll(async () => {
    await BoardPost.deleteMany({});
    await User.deleteMany({});
    if (server) server.close();
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      BoardPost.deleteMany({}),
      Counter.findOneAndUpdate(
        { _id: 'board' },
        { seq: 0 },
        { upsert: true }
      )
    ]);

    testUser = await User.create({
      id: 'testuser',
      email: 'test@example.com',
      password: 'Test1234!@',
      authority: 3
    });

    const loginRes = await request(server)
      .post('/api/users/login')
      .send({ id: 'testuser', password: 'Test1234!@' });
    const cookies = loginRes.headers['set-cookie'] || [];
    authToken = cookies.length > 0 ? cookies[0] : '';
  });

  describe('XSS Protection', () => {
    test('게시글 제목에서 XSS 차단', async () => {
      const res = await request(server)
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
      const res = await request(server)
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
        title: '테스트',
        content: '내용',
        tags: { type: '사고팔고', region: '24' },
        author: testUser._id
      });

      const res = await request(server)
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

  describe('Injection Protection', () => {
    test('로그인 시 SQL Injection 시도', async () => {
      const res = await request(server)
        .post('/api/users/login')
        .send({
          id: "admin' OR '1'='1",
          password: "' OR '1'='1"
        });

      // Login validator checks length only (3-20); injection payload passes
      // but user doesn't exist → 401
      expect(res.status).toBe(401);
    });

    test('검색 시 NoSQL Injection 시도', async () => {
      const res = await request(server)
        .get('/api/boards')
        .query({
          search: '{ "$regex": ".*" }'
        });

      // String-serialized JSON is treated as a plain search string, not an operator
      expect(res.status).toBe(200);
    });

    test('ID 파라미터에 NoSQL Injection 시도', async () => {
      const res = await request(server)
        .get('/api/boards/' + JSON.stringify({ $ne: null }));

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('Authentication & Authorization', () => {
    test('만료된/잘못된 토큰으로 접근 - 401', async () => {
      const expiredToken = 'authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MGMwMDAwMDAwMDAwMDAwMDAwMDAwMDAiLCJpZCI6InRlc3R1c2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiYXV0aG9yaXR5IjozLCJpYXQiOjE2MjMwMDAwMDAsImV4cCI6MTYyMzAwMDAwMX0.fake';

      const res = await request(server)
        .post('/api/boards')
        .set('Cookie', expiredToken)
        .send({
          title: '테스트',
          content: '내용',
          tags: { type: '사고팔고', region: '24' }
        });

      expect(res.status).toBe(401);
    });

    test('권한 상승 시도 - 일반 유저가 관리자 API 접근', async () => {
      const res = await request(server)
        .get('/api/admin/stats')
        .set('Cookie', authToken);

      expect(res.status).toBe(403);
    });

    test('다른 유저의 리소스 수정 시도 - 403', async () => {
      const otherUser = await User.create({
        id: 'otheruser',
        email: 'other@example.com',
        password: 'Other1234!@',
        authority: 3
      });

      const otherPost = await BoardPost.create({
        title: '다른 유저 게시글',
        content: '내용',
        tags: { type: '사고팔고', region: '24' },
        author: otherUser._id
      });

      const res = await request(server)
        .put(`/api/boards/${otherPost._id}`)
        .set('Cookie', authToken)
        .send({
          title: '수정 시도',
          content: '수정된 내용'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Security Headers', () => {
    test('보안 헤더 확인', async () => {
      const res = await request(server).get('/api/boards');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['x-xss-protection']).toBe('1; mode=block');
      expect(res.headers['permissions-policy']).toContain('camera=()');
    });
  });

  describe('Password Security', () => {
    test('비밀번호 해시 저장 확인', async () => {
      const user = await User.findOne({ id: 'testuser' });
      expect(user.password).not.toBe('Test1234!@');
      expect(user.password.length).toBeGreaterThan(50);
    });

    test('계정 잠금 메커니즘', async () => {
      for (let i = 0; i < 5; i++) {
        await request(server)
          .post('/api/users/login')
          .send({
            id: 'testuser',
            password: 'WrongPassword!'
          });
      }

      const res = await request(server)
        .post('/api/users/login')
        .send({
          id: 'testuser',
          password: 'Test1234!@'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('계정이 잠겼습니다');
    });
  });

  describe('Session Security', () => {
    test('쿠키 설정 확인', async () => {
      const res = await request(server)
        .post('/api/users/login')
        .send({
          id: 'testuser',
          password: 'Test1234!@'
        });

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('HttpOnly');
      expect(cookies[0]).toContain('SameSite=Lax');
    });

    test('로그아웃 후 토큰 상태', async () => {
      await request(server)
        .post('/api/users/logout')
        .set('Cookie', authToken);

      // JWT is still valid after logout (no server-side blacklist)
      // but cookie is cleared in browser
      const res = await request(server)
        .get('/api/users/verify')
        .set('Cookie', authToken);

      expect(res.status).toBe(200);
    });
  });
});

const request = require('supertest');
const User = require('../../models/User');
const { initializeEssentialData } = require('../setup/testDb');

describe('User API Tests', () => {
  let app;
  let server;

  beforeAll(async () => {
    await initializeEssentialData();
    app = require('../../server');
    server = app.listen(0);
  });

  afterAll(async () => {
    await User.deleteMany({});
    if (server) server.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/users (회원가입)', () => {
    test('정상적인 회원가입', async () => {
      const res = await request(server)
        .post('/api/users')
        .send({
          id: 'newuser',
          email: 'new@example.com',
          password: 'Test1234!@'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('회원가입 성공');
      expect(res.body.user.id).toBe('newuser');
      expect(res.body.user.email).toBe('new@example.com');
      expect(res.body.user.authority).toBe(3);
    });

    test('중복 아이디 - 409', async () => {
      await User.create({
        id: 'existing',
        email: 'existing@example.com',
        password: 'Test1234!@',
        authority: 3
      });

      const res = await request(server)
        .post('/api/users')
        .send({
          id: 'existing',
          email: 'other@example.com',
          password: 'Test1234!@'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('이미 존재하는 아이디');
    });

    test('잘못된 입력 - 400', async () => {
      const res = await request(server)
        .post('/api/users')
        .send({
          id: '',
          email: 'test@example.com',
          password: 'Test1234!@'
        });

      expect(res.status).toBe(400);
    });

    test('권한 상승 차단 - authority 무시', async () => {
      const res = await request(server)
        .post('/api/users')
        .send({
          id: 'hacker',
          email: 'hacker@example.com',
          password: 'Test1234!@',
          authority: 5
        });

      expect(res.status).toBe(201);
      expect(res.body.user.authority).toBe(3);
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await User.create({
        id: 'testuser',
        email: 'test@example.com',
        password: 'Test1234!@',
        authority: 3
      });
    });

    test('정상 로그인', async () => {
      const res = await request(server)
        .post('/api/users/login')
        .send({ id: 'testuser', password: 'Test1234!@' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('로그인 성공');
      expect(res.body.user.id).toBe('testuser');
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toMatch(/authToken=/);
    });

    test('존재하지 않는 사용자 - 401', async () => {
      const res = await request(server)
        .post('/api/users/login')
        .send({ id: 'nonexistent', password: 'Test1234!@' });

      expect(res.status).toBe(401);
    });

    test('잘못된 비밀번호 - 401', async () => {
      const res = await request(server)
        .post('/api/users/login')
        .send({ id: 'testuser', password: 'WrongPassword1!@' });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('잘못된 비밀번호');
    });

    test('필수 필드 누락 - 400', async () => {
      const res = await request(server)
        .post('/api/users/login')
        .send({ id: 'testuser' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/users/:id', () => {
    beforeEach(async () => {
      await User.create({
        id: 'testuser',
        email: 'test@example.com',
        password: 'Test1234!@',
        authority: 3
      });
    });

    test('사용자 정보 조회', async () => {
      const res = await request(server)
        .get('/api/users/testuser');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('testuser');
      expect(res.body.email).toBe('test@example.com');
      expect(res.body.password).toBeUndefined();
    });

    test('존재하지 않는 사용자 - 404', async () => {
      const res = await request(server)
        .get('/api/users/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/users/:id (사용자 수정)', () => {
    let authToken;

    beforeEach(async () => {
      await User.create({
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

    test('이메일 수정', async () => {
      const res = await request(server)
        .put('/api/users/testuser')
        .set('Cookie', authToken)
        .send({ email: 'newemail@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('newemail@example.com');
    });

    test('인증 없이 수정 시도 - 401', async () => {
      const res = await request(server)
        .put('/api/users/testuser')
        .send({ email: 'hack@example.com' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/users/logout', () => {
    test('정상 로그아웃', async () => {
      await User.create({
        id: 'testuser',
        email: 'test@example.com',
        password: 'Test1234!@',
        authority: 3
      });

      const loginRes = await request(server)
        .post('/api/users/login')
        .send({ id: 'testuser', password: 'Test1234!@' });
      const cookies = loginRes.headers['set-cookie'] || [];
      const authToken = cookies.length > 0 ? cookies[0] : '';

      const res = await request(server)
        .post('/api/users/logout')
        .set('Cookie', authToken);

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
    });

    test('쿠키 없이 로그아웃', async () => {
      const res = await request(server)
        .post('/api/users/logout');

      expect(res.status).toBe(200);
    });
  });
});

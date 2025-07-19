const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../../models/User');

describe('User API Tests', () => {
  let server;
  let testUser;

  beforeAll(async () => {
    // 테스트 사용자 생성
    testUser = new User({
      id: 'testuser',
      email: 'test@test.com',
      password: 'password123',
      authority: 3
    });
    await testUser.save();
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await User.deleteMany({});
  });

  beforeEach(async () => {
    // 각 테스트 전에 사용자 데이터 초기화
    await User.deleteMany({});
    testUser = new User({
      id: 'testuser',
      email: 'test@test.com',
      password: 'password123',
      authority: 3
    });
    await testUser.save();
  });

  describe('POST /api/users/signup', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        id: 'newuser',
        email: 'new@test.com',
        password: 'newpassword123'
      };

      const response = await request(app)
        .post('/api/users/signup')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('회원가입이 완료되었습니다.');
      expect(response.body.user.id).toBe(userData.id);
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should return error for duplicate user ID', async () => {
      const userData = {
        id: 'testuser', // 이미 존재하는 ID
        email: 'duplicate@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/signup')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('이미 존재하는 사용자 ID입니다.');
    });

    it('should return error for invalid input', async () => {
      const userData = {
        id: '', // 빈 ID
        email: 'invalid@test.com',
        password: '123' // 너무 짧은 비밀번호
      };

      const response = await request(app)
        .post('/api/users/signup')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        id: 'testuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('로그인 성공');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.id).toBe('testuser');
    });

    it('should return error for invalid password', async () => {
      const loginData = {
        id: 'testuser',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('잘못된 비밀번호입니다.');
    });

    it('should return error for non-existent user', async () => {
      const loginData = {
        id: 'nonexistent',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('사용자를 찾을 수 없습니다.');
    });
  });

  describe('GET /api/users/:userId', () => {
    it('should return user information', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.id).toBe('testuser');
      expect(response.body.user.email).toBe('test@test.com');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('사용자를 찾을 수 없습니다.');
    });
  });
}); 
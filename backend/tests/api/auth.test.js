const request = require('supertest');
const app = require('../../server');
const { 
  setupTestEnvironment, 
  cleanupTestData, 
  createTestUser, 
  generateToken, 
  generateExpiredToken,
  removeTestUserIfExists 
} = require('../helpers/testHelpers');

describe('Authentication Tests', () => {
  let testUser;
  let validToken;
  let expiredToken;

  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterEach(async () => {
    // 이 테스트에서 생성한 사용자만 정리
    if (testUser && testUser._id) {
      const User = require('../../models/User');
      await User.deleteOne({ _id: testUser._id });
    }
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    // 8자리 랜덤 ID로 격리 보장
    const uniqueId = Math.random().toString(36).substring(2, 10);
    
    testUser = await createTestUser({
      id: uniqueId,
      email: `${uniqueId}@test.com`,
      authority: 3,
    });

    // 토큰 생성
    validToken = generateToken(testUser);
    expiredToken = generateExpiredToken(testUser);
    
    // 만료된 토큰이 실제로 만료되도록 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 1100));
  });

  describe('POST /api/users/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          id: testUser.id,
          password: 'Test1234!@',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('로그인 성공');
      // Token is now in httpOnly cookie, not in response body
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('authToken');
      expect(response.body.user.id).toBe(testUser.id);
    });

    it('should return error for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          id: testUser.id,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('잘못된 비밀번호');
    });
  });

  describe('GET /api/users/verify', () => {
    it('should verify valid token successfully', async () => {
      const response = await request(app)
        .get('/api/users/verify')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.user.id).toBe(testUser.id);
    });

    it('should reject expired token', async () => {
      const response = await request(app)
        .get('/api/users/verify')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('jwt expired');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/users/verify')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('invalid token');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/users/verify').expect(401);

      expect(response.body.valid).toBe(false);
      expect(response.body.message).toBe('토큰이 제공되지 않았습니다.');
    });
  });

  describe('Protected Routes with Token Expiration', () => {
    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/boards')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow access with expired token for GET requests (public access)', async () => {
      const response = await request(app)
        .get('/api/boards')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow public access without token for GET requests', async () => {
      const response = await request(app).get('/api/boards').expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

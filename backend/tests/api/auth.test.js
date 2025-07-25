const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

describe('Authentication Tests', () => {
  let testUser;
  let validToken;
  let expiredToken;

  beforeAll(async () => {
    // 기존 테스트 사용자 삭제 (중복 방지)
    await User.findOneAndDelete({ id: 'testuser' });
    
    // 테스트 사용자 생성
    testUser = await User.create({
      id: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      authority: 3
    });

    // 유효한 토큰 생성
    validToken = jwt.sign(
      { _id: testUser._id, id: testUser.id, email: testUser.email, authority: testUser.authority },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 만료된 토큰 생성 (1초 후 만료)
    expiredToken = jwt.sign(
      { _id: testUser._id, id: testUser.id, email: testUser.email, authority: testUser.authority },
      process.env.JWT_SECRET,
      { expiresIn: '1s' }
    );

    // 토큰이 만료될 때까지 대기
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    await User.findByIdAndDelete(testUser._id);
  });

  describe('POST /api/users/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          id: 'testuser',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('로그인 성공');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.id).toBe('testuser');
    });

    it('should return error for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          id: 'testuser',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('잘못된 비밀번호입니다.');
    });
  });

  describe('GET /api/users/verify', () => {
    it('should verify valid token successfully', async () => {
      const response = await request(app)
        .get('/api/users/verify')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.user.id).toBe('testuser');
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
      const response = await request(app)
        .get('/api/users/verify')
        .expect(401);

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
      const response = await request(app)
        .get('/api/boards')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
}); 
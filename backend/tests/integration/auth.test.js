const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../../models/User');

describe('Auth Integration Tests', () => {
  let server;
  let testUser;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    // Start server
    server = app.listen(0); // Random port
  });

  afterAll(async () => {
    // Clean up
    await User.deleteMany({ email: /test_.*@test\.com/ });
    await mongoose.connection.close();
    server.close();
  });

  beforeEach(async () => {
    // Create test user for each test
    testUser = global.testUtils.testUser();
    await User.create({
      ...testUser,
      password: testUser.password // Will be hashed by model
    });
  });

  afterEach(async () => {
    // Clean up test users
    await User.deleteMany({ email: /test_.*@test\.com/ });
  });

  describe('POST /api/users/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(server)
        .post('/api/users/login')
        .send({
          id: testUser.id,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', '로그인 성공');
      expect(response.body.user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        authority: testUser.authority
      });
      // Check cookie is set
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toMatch(/authToken=/);
    });

    test('should reject invalid password', async () => {
      const response = await request(server)
        .post('/api/users/login')
        .send({
          id: testUser.id,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/잘못된 비밀번호/);
    });

    test('should reject non-existent user', async () => {
      const response = await request(server)
        .post('/api/users/login')
        .send({
          id: 'nonexistent',
          password: 'password'
        });

      expect(response.status).toBe(401);
    });

    test('should validate required fields', async () => {
      const response = await request(server)
        .post('/api/users/login')
        .send({
          id: testUser.id
          // Missing password
        });

      expect(response.status).toBe(400);
    });
  });

  // Refresh token endpoint not implemented yet
  describe.skip('POST /api/users/refresh', () => {
    // TODO: Implement refresh token functionality
  });

  describe('POST /api/users/logout', () => {
    let authCookie;

    beforeEach(async () => {
      // Login to get cookie
      const loginResponse = await request(server)
        .post('/api/users/login')
        .send({
          id: testUser.id,
          password: testUser.password
        });

      authCookie = loginResponse.headers['set-cookie'][0];
    });

    test('should logout successfully with valid cookie', async () => {
      const response = await request(server)
        .post('/api/users/logout')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    test('should handle logout without cookie', async () => {
      const response = await request(server)
        .post('/api/users/logout');

      // Without auth cookie, logout still returns 200 (idempotent)
      expect(response.status).toBe(200);
    });
  });
});
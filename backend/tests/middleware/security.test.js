const request = require('supertest');
const app = require('../../server');

describe('Security Middleware Tests', () => {
  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      // 첫 번째 요청은 성공해야 함
      const response1 = await request(app)
        .get('/api/boards/general')
        .expect(200);

      expect(response1.body.success).toBe(true);
    });

    it('should block requests exceeding rate limit', async () => {
      // 여러 요청을 빠르게 보내서 rate limit 초과
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .get('/api/boards/general')
            .expect(429)
        );
      }

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.body.error).toContain('너무 많은 요청이 발생했습니다');
      });
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/boards/general')
        .expect(200);

      // 보안 헤더 확인
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid user input', async () => {
      const invalidData = {
        id: '', // 빈 ID
        email: 'invalid-email', // 잘못된 이메일
        password: '123' // 너무 짧은 비밀번호
      };

      const response = await request(app)
        .post('/api/users/signup')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should reject invalid post input', async () => {
      const invalidData = {
        title: '', // 빈 제목
        content: 'a'.repeat(10001) // 너무 긴 내용
      };

      const response = await request(app)
        .post('/api/boards/general')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/boards/general')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });
}); 
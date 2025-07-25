const request = require('supertest');
const app = require('../../server');

describe('Basic API Tests', () => {
  describe('Server Health', () => {
    it('should respond to basic requests', async () => {
      const response = await request(app)
        .get('/api/boards')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('CORS', () => {
    it('should handle CORS headers', async () => {
      const response = await request(app)
        .get('/api/boards')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
}); 
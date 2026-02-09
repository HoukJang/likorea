const request = require('supertest');
const Tag = require('../../models/Tag');
const { initializeEssentialData } = require('../setup/testDb');

describe('Tag API Tests', () => {
  let app;
  let server;

  beforeAll(async () => {
    await initializeEssentialData();
    app = require('../../server');
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) server.close();
  });

  describe('GET /api/tags', () => {
    test('모든 활성 태그 카테고리별 그룹 반환', async () => {
      const res = await request(server).get('/api/tags');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tags).toBeDefined();
      expect(res.body.tags.type).toBeDefined();
      expect(res.body.tags.region).toBeDefined();
      expect(Array.isArray(res.body.tags.type)).toBe(true);
      expect(Array.isArray(res.body.tags.region)).toBe(true);
    });
  });

  describe('GET /api/tags/category/:category', () => {
    test('type 카테고리 태그 조회', async () => {
      const res = await request(server).get('/api/tags/category/type');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.category).toBe('type');
      expect(Array.isArray(res.body.tags)).toBe(true);
      expect(res.body.tags.length).toBeGreaterThan(0);

      const tagValues = res.body.tags.map(tag => tag.value);
      expect(tagValues).toContain('공지');
      expect(tagValues).toContain('사고팔고');
    });

    test('region 카테고리 태그 조회', async () => {
      const res = await request(server).get('/api/tags/category/region');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.category).toBe('region');
      expect(Array.isArray(res.body.tags)).toBe(true);
      expect(res.body.tags.length).toBeGreaterThan(0);
    });

    test('잘못된 카테고리 - 400', async () => {
      const res = await request(server).get('/api/tags/category/invalid');

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/tags/subcategories/:parentCategory', () => {
    test('사고팔고 하위 카테고리 조회', async () => {
      // Verify category tags exist in DB
      const Tag = require('../../models/Tag');
      const dbTags = await Tag.find({ category: 'category', parentCategory: '사고팔고', isActive: true });

      const res = await request(server).get('/api/tags/subcategories/사고팔고');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.parentCategory).toBe('사고팔고');
      expect(Array.isArray(res.body.subCategories)).toBe(true);

      // If DB has tags but API returns empty, there's a server/caching issue
      if (dbTags.length > 0 && res.body.subCategories.length === 0) {
        // eslint-disable-next-line no-console
        console.log('DEBUG: DB has', dbTags.length, 'category tags but API returned 0');
        console.log('DEBUG: DB tags:', dbTags.map(t => t.value));
      }

      const values = res.body.subCategories.map(s => s.value);
      expect(values).toContain('생활용품');
      expect(values).toContain('가전제품');
      expect(values).toContain('의류');
      expect(values).toContain('가구');
    });

    test('하위 카테고리 없는 타입 조회', async () => {
      const res = await request(server).get('/api/tags/subcategories/생활정보');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.subCategories).toEqual([]);
    });

    test('잘못된 상위 카테고리 - 400', async () => {
      const res = await request(server).get('/api/tags/subcategories/invalid');

      expect(res.status).toBe(400);
    });
  });
});

const request = require('supertest');
const app = require('../../server');

describe('Tag API Tests', () => {
  beforeEach(async () => {
    // 태그는 setup.js에서 initializeTags로 자동 생성됨
  });

  describe('GET /api/tags', () => {
    it('should return all active tags grouped by category', async () => {
      const response = await request(app).get('/api/tags').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tags).toBeDefined();
      expect(response.body.tags.type).toBeDefined();
      expect(response.body.tags.region).toBeDefined();
      expect(Array.isArray(response.body.tags.type)).toBe(true);
      expect(Array.isArray(response.body.tags.region)).toBe(true);
    });
  });

  describe('GET /api/tags/category/:category', () => {
    it('should return tags for type category', async () => {
      const response = await request(app).get('/api/tags/category/type').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.category).toBe('type');
      expect(Array.isArray(response.body.tags)).toBe(true);
      expect(response.body.tags.length).toBeGreaterThan(0);

      // 기본 태그들이 포함되어 있는지 확인
      const tagValues = response.body.tags.map(tag => tag.value);
      expect(tagValues).toContain('공지');
      expect(tagValues).toContain('사고팔고');
      expect(tagValues).toContain('생활정보');
    });

    it('should return tags for region category', async () => {
      const response = await request(app).get('/api/tags/category/region').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.category).toBe('region');
      expect(Array.isArray(response.body.tags)).toBe(true);
      expect(response.body.tags.length).toBeGreaterThan(0);
    });

    it('should return 400 for invalid category', async () => {
      const response = await request(app).get('/api/tags/category/invalid').expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tags/subcategories/:parentCategory', () => {
    it('should return subcategories for 생활정보', async () => {
      const response = await request(app).get('/api/tags/subcategories/생활정보').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.parentCategory).toBe('생활정보');
      expect(Array.isArray(response.body.subCategories)).toBe(true);

      // 생활정보 소주제들이 포함되어 있는지 확인
      const subCategoryValues = response.body.subCategories.map(sub => sub.value);
      expect(subCategoryValues).toContain('할인정보');
      expect(subCategoryValues).toContain('맛집');
    });

    it('should return subcategories for 사고팔고', async () => {
      const response = await request(app).get('/api/tags/subcategories/사고팔고').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.parentCategory).toBe('사고팔고');
      expect(Array.isArray(response.body.subCategories)).toBe(true);

      const subCategoryValues = response.body.subCategories.map(sub => sub.value);
      expect(subCategoryValues).toContain('나눔');
      expect(subCategoryValues).toContain('중고');
    });

    it('should return 400 for invalid parent category', async () => {
      const response = await request(app).get('/api/tags/subcategories/invalid').expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const BoardPost = require('../../models/BoardPost');
const User = require('../../models/User');
const { 
  setupTestEnvironment, 
  cleanupTestData, 
  createTestUser, 
  createTestAdmin,
  createTestPost,
  generateToken,
  ensureBoardCounter,
  removeTestUserIfExists 
} = require('../helpers/testHelpers');

describe('Board API Tests', () => {
  let testUser;
  let testPost;
  let authToken;
  let anotherUser;
  let anotherToken;

  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterEach(async () => {
    // 이 테스트에서 생성한 데이터만 정리
    const BoardPost = require('../../models/BoardPost');
    const User = require('../../models/User');
    
    if (testUser && testUser._id) {
      await User.deleteOne({ _id: testUser._id });
    }
    if (anotherUser && anotherUser._id) {
      await User.deleteOne({ _id: anotherUser._id });
    }
    if (testPost && testPost._id) {
      await BoardPost.deleteOne({ _id: testPost._id });
    }
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    // Counter 확인
    await ensureBoardCounter();

    // 8자리 랜덤 ID로 사용자 생성
    const userId = Math.random().toString(36).substring(2, 10);
    const anotherUserId = Math.random().toString(36).substring(2, 10);

    testUser = await createTestUser({
      id: userId,
      email: `${userId}@test.com`,
      authority: 3,
    });

    // 다른 사용자 생성 (권한 테스트용)
    anotherUser = await createTestUser({
      id: anotherUserId,
      email: `${anotherUserId}@test.com`,
      authority: 3,
    });

    // 인증 토큰 생성
    authToken = generateToken(testUser);
    anotherToken = generateToken(anotherUser);

    // 테스트 게시글 생성
    testPost = await createTestPost(testUser._id, {
      title: '테스트 게시글',
      content: '테스트 내용',
      tags: {
        type: '생활정보',
        subcategory: '할인정보',
        region: '24',
      },
    });
  });

  describe('GET /api/boards', () => {
    it('should return board posts successfully', async () => {
      const response = await request(app).get('/api/boards').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.posts)).toBe(true);
      expect(response.body.posts.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent board', async () => {
      // 모든 게시글 삭제
      await BoardPost.deleteMany({});

      const response = await request(app).get('/api/boards').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.posts)).toBe(true);
      expect(response.body.posts.length).toBe(0);
    });
  });

  describe('GET /api/boards/:postId', () => {
    it('should return specific post successfully', async () => {
      const response = await request(app).get(`/api/boards/${testPost._id}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.post.title).toBe('테스트 게시글');
      expect(response.body.post.content).toBe('테스트 내용');
    });

    it('should return 404 for non-existent post', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/boards/${nonExistentId}`).expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/boards', () => {
    it('should create new post successfully', async () => {
      const newPost = {
        title: '새로운 게시글',
        content: '새로운 내용',
        tags: {
          type: '생활정보',
          region: '24',
        },
      };

      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newPost)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.post.title).toBe('새로운 게시글');
    });

    it('should return 403 for unauthorized request', async () => {
      const newPost = {
        title: '새로운 게시글',
        content: '새로운 내용',
        tags: {
          type: '생활정보',
          subcategory: '할인정보',
          region: '24',
        },
      };

      const response = await request(app).post('/api/boards').send(newPost).expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/boards/:postId', () => {
    it('should update post successfully', async () => {
      const updateData = {
        title: '수정된 제목',
        content: '수정된 내용',
        tags: {
          type: '생활정보',
          region: '24',
        },
      };

      const response = await request(app)
        .put(`/api/boards/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.post.title).toBe('수정된 제목');
    });

    it('should return 404 for non-existent post', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = {
        title: '수정된 제목',
        content: '수정된 내용',
        tags: {
          type: '생활정보',
          region: '24',
        },
      };

      const response = await request(app)
        .put(`/api/boards/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized request', async () => {
      // beforeEach에서 생성한 anotherUser와 anotherToken 사용

      const updateData = {
        title: '수정된 제목',
        content: '수정된 내용',
        tags: {
          type: '생활정보',
          region: '24',
        },
      };

      const response = await request(app)
        .put(`/api/boards/${testPost._id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/boards/:postId', () => {
    it('should delete post successfully', async () => {
      const response = await request(app)
        .delete(`/api/boards/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent post', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/boards/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized request', async () => {
      // beforeEach에서 생성한 anotherUser와 anotherToken 사용
      const response = await request(app)
        .delete(`/api/boards/${testPost._id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});

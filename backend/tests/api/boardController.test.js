const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const BoardPost = require('../../models/BoardPost');
const User = require('../../models/User');

describe('Board API Tests', () => {
  let testUser;
  let testPost;
  let authToken;
  let uniqueId = 0;

  const getUniqueUserId = () => `boardtest${Date.now()}_${++uniqueId}`;
  const getUniqueEmail = () => `boardtest${Date.now()}_${uniqueId}@test.com`;

  // JWT 토큰 생성 헬퍼 함수
  const generateToken = user => {
    return jwt.sign(
      {
        _id: user._id,
        id: user.id,
        authority: user.authority,
      },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );
  };

  beforeEach(async () => {
    // 테스트용 태그는 setup.js에서 initializeTags로 생성됨

    // 테스트 사용자 생성
    testUser = new User({
      id: getUniqueUserId(),
      email: getUniqueEmail(),
      password: 'password123',
      authority: 3,
    });
    await testUser.save();

    // 인증 토큰 생성
    authToken = generateToken(testUser);

    // 테스트 게시글 생성
    testPost = new BoardPost({
      title: '테스트 게시글',
      content: '테스트 내용',
      author: testUser._id,
      tags: {
        type: '생활정보',
        region: '24',
      },
    });
    await testPost.save();
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

    it('should return 401 for unauthorized request', async () => {
      const newPost = {
        title: '새로운 게시글',
        content: '새로운 내용',
        tags: {
          type: '생활정보',
          region: '24',
        },
      };

      const response = await request(app).post('/api/boards').send(newPost).expect(401);

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
      // 다른 사용자 생성
      const anotherUser = new User({
        id: 'anotheruser',
        email: 'another@test.com',
        password: 'password123',
        authority: 3,
      });
      await anotherUser.save();

      const anotherToken = generateToken(anotherUser);

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
      // 다른 사용자 생성
      const anotherUser = new User({
        id: 'anotheruser2',
        email: 'another2@test.com',
        password: 'password123',
        authority: 3,
      });
      await anotherUser.save();

      const anotherToken = generateToken(anotherUser);

      const response = await request(app)
        .delete(`/api/boards/${testPost._id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});

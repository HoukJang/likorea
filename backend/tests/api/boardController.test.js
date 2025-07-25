const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const BoardPost = require('../../models/BoardPost');
const User = require('../../models/User');

describe('Board API Tests', () => {
  let server;
  let testUser;
  let testPost;

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
    await BoardPost.deleteMany({});
    await User.deleteMany({});
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 초기화
    await BoardPost.deleteMany({});
    await User.deleteMany({});
    
    testUser = new User({
      id: 'testuser',
      email: 'test@test.com',
      password: 'password123',
      authority: 3
    });
    await testUser.save();

    // 테스트 게시글 생성
    testPost = new BoardPost({
      title: '테스트 게시글',
      content: '테스트 내용',
      author: testUser._id,
      tags: {
        type: '생활정보',
        region: '롱아일랜드'
      }
    });
    await testPost.save();
  });

  describe('GET /api/boards', () => {
    it('should return board posts successfully', async () => {
      const response = await request(app)
        .get('/api/boards')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.posts).toBeDefined();
      expect(Array.isArray(response.body.posts)).toBe(true);
      expect(response.body.posts.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent board', async () => {
      // 모든 게시글 삭제
      await BoardPost.deleteMany({});
      
      const response = await request(app)
        .get('/api/boards')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.posts).toBeDefined();
      expect(Array.isArray(response.body.posts)).toBe(true);
      expect(response.body.posts.length).toBe(0);
    });
  });

  describe('GET /api/boards/:postId', () => {
    it('should return specific post successfully', async () => {
      const response = await request(app)
        .get(`/api/boards/${testPost._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.post).toBeDefined();
      expect(response.body.post.title).toBe('테스트 게시글');
      expect(response.body.post.content).toBe('테스트 내용');
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/boards/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('게시글을 찾을 수 없습니다.');
    });
  });

  describe('POST /api/boards', () => {
    it('should create new post successfully', async () => {
      const postData = {
        title: '새 게시글',
        content: '새 내용',
        tags: {
          type: '생활정보',
          region: '롱아일랜드'
        }
      };

      const response = await request(app)
        .post('/api/boards')
        .send(postData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('게시글이 성공적으로 작성되었습니다.');
      expect(response.body.post.title).toBe(postData.title);
      expect(response.body.post.content).toBe(postData.content);
    });

    it('should return error for invalid input', async () => {
      const postData = {
        title: '', // 빈 제목
        content: '내용',
        author: testUser._id
      };

      const response = await request(app)
        .post('/api/boards')
        .send(postData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/boards/:postId', () => {
    it('should update post successfully', async () => {
      const updateData = {
        title: '수정된 제목',
        content: '수정된 내용'
      };

      const response = await request(app)
        .put(`/api/boards/${testPost._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('게시글이 성공적으로 수정되었습니다.');
      expect(response.body.post.title).toBe(updateData.title);
      expect(response.body.post.content).toBe(updateData.content);
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = {
        title: '수정된 제목',
        content: '수정된 내용'
      };

      const response = await request(app)
        .put(`/api/boards/${fakeId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('게시글을 찾을 수 없습니다.');
    });
  });

  describe('DELETE /api/boards/:postId', () => {
    it('should delete post successfully', async () => {
      const response = await request(app)
        .delete(`/api/boards/${testPost._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('게시글이 성공적으로 삭제되었습니다.');
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/boards/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('게시글을 찾을 수 없습니다.');
    });
  });
}); 
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const BoardPost = require('../../models/BoardPost');
const User = require('../../models/User');
const Tag = require('../../models/Tag');

describe('Board API Tests', () => {
  let server;
  let testUser;
  let testPost;
  let authToken;
  let testTypeTag;
  let testRegionTag;

  // JWT 토큰 생성 헬퍼 함수
  const generateToken = (user) => {
    return jwt.sign(
      { 
        _id: user._id,  // userId 대신 _id 사용
        id: user.id, 
        authority: user.authority 
      },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    // 테스트용 태그 생성
    testTypeTag = new Tag({
      category: 'type',
      value: '생활정보',
      displayName: '생활정보',
      order: 1,
      isActive: true
    });
    await testTypeTag.save();

    testRegionTag = new Tag({
      category: 'region',
      value: '롱아일랜드',
      displayName: '롱아일랜드',
      order: 1,
      isActive: true
    });
    await testRegionTag.save();

    // 테스트 사용자 생성
    testUser = new User({
      id: 'testuser',
      email: 'test@test.com',
      password: 'password123',
      authority: 3
    });
    await testUser.save();
    
    // 인증 토큰 생성
    authToken = generateToken(testUser);
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await BoardPost.deleteMany({});
    await User.deleteMany({});
    await Tag.deleteMany({});
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

    // 인증 토큰 재생성
    authToken = generateToken(testUser);

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
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('게시글 생성 성공');
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
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(400);

      // success 필드가 false이거나 undefined일 수 있음
      expect(response.body.success === false || response.body.success === undefined).toBe(true);
    });

    it('should return 403 for unauthorized request', async () => {
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
        .expect(403);

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
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('게시글 수정 성공');
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
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('게시글을 찾을 수 없습니다.');
    });

    it('should return 403 for unauthorized request', async () => {
      const updateData = {
        title: '수정된 제목',
        content: '수정된 내용'
      };

      const response = await request(app)
        .put(`/api/boards/${testPost._id}`)
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
      expect(response.body.message).toBe('게시글 삭제 성공');
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/boards/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('게시글을 찾을 수 없습니다.');
    });

    it('should return 403 for unauthorized request', async () => {
      const response = await request(app)
        .delete(`/api/boards/${testPost._id}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
}); 
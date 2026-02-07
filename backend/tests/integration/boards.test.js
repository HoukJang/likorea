const request = require('supertest');
const mongoose = require('mongoose');
const { connectDB } = require('../../config/db');
const BoardPost = require('../../models/BoardPost');
const User = require('../../models/User');
const Tag = require('../../models/Tag');
const Counter = require('../../models/Counter');
const { initializeEssentialData } = require('../setup/testDb');

describe('Board API Tests', () => {
  let app;
  let server;
  let authToken;
  let adminToken;
  let testUser;
  let adminUser;
  let testPost;

  beforeAll(async () => {
    await connectDB();
    await initializeEssentialData();
    app = require('../../server');
    server = app.listen(0);
  });

  afterAll(async () => {
    await BoardPost.deleteMany({});
    await User.deleteMany({});
    if (server) server.close();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Promise.all([
      BoardPost.deleteMany({}),
      User.deleteMany({}),
      Counter.findOneAndUpdate(
        { _id: 'postNumber' },
        { seq: 0 },
        { upsert: true }
      )
    ]);

    testUser = await User.create({
      id: 'testuser',
      email: 'test@example.com',
      password: 'Test1234!@',
      authority: 3
    });

    adminUser = await User.create({
      id: 'admin',
      email: 'admin@example.com',
      password: 'Admin1234!@',
      authority: 5
    });

    const loginRes = await request(server)
      .post('/api/users/login')
      .send({ id: 'testuser', password: 'Test1234!@' });
    const cookies = loginRes.headers['set-cookie'] || [];
    authToken = cookies.length > 0 ? cookies[0] : '';

    const adminLoginRes = await request(server)
      .post('/api/users/login')
      .send({ id: 'admin', password: 'Admin1234!@' });
    const adminCookies = adminLoginRes.headers['set-cookie'] || [];
    adminToken = adminCookies.length > 0 ? adminCookies[0] : '';

    testPost = await BoardPost.create({
      title: '테스트 게시글',
      content: '<p>테스트 내용입니다.</p>',
      tags: {
        type: '사고팔고',
        region: '24',
        subcategory: '생활용품'
      },
      author: testUser._id,
      viewCount: 0
    });
  });

  describe('GET /api/boards (게시글 목록)', () => {
    beforeEach(async () => {
      await BoardPost.create({
        title: '부동산 게시글',
        content: '부동산 내용',
        tags: { type: '부동산', region: '30' },
        author: testUser._id
      });

      await BoardPost.create({
        title: '모임 게시글',
        content: '모임 내용',
        tags: { type: '모임', region: '24' },
        author: adminUser._id
      });
    });

    test('기본 목록 조회', async () => {
      const res = await request(server).get('/api/boards');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.posts).toHaveLength(3);
      expect(res.body.totalPosts).toBe(3);
      expect(res.body.totalPages).toBe(1);
      expect(res.body.currentPage).toBe(1);
    });

    test('페이지네이션', async () => {
      const res = await request(server)
        .get('/api/boards')
        .query({ page: 1, limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(2);
      expect(res.body.totalPosts).toBe(3);
      expect(res.body.totalPages).toBe(2);
      expect(res.body.currentPage).toBe(1);
    });

    test('타입 필터링', async () => {
      const res = await request(server)
        .get('/api/boards')
        .query({ type: '부동산' });

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(1);
      expect(res.body.posts[0].tags.type).toBe('부동산');
    });

    test('지역 필터링 - 단일 지역', async () => {
      const res = await request(server)
        .get('/api/boards')
        .query({ region: '24' });

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(2);
      expect(res.body.posts.every(p => p.tags.region === '24')).toBe(true);
    });

    test('지역 필터링 - 다중 지역', async () => {
      const res = await request(server)
        .get('/api/boards')
        .query({ region: '24,30' });

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(3);
    });

    test('검색 기능', async () => {
      const res = await request(server)
        .get('/api/boards')
        .query({ search: '부동산' });

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(1);
      expect(res.body.posts[0].title).toContain('부동산');
    });

    test('소주제 필터링', async () => {
      const res = await request(server)
        .get('/api/boards')
        .query({ subcategory: '생활용품' });

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(1);
      expect(res.body.posts[0].tags.subcategory).toBe('생활용품');
    });

    test('복합 필터링', async () => {
      const res = await request(server)
        .get('/api/boards')
        .query({
          type: '사고팔고',
          region: '24',
          page: 1,
          limit: 10
        });

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(1);
      expect(res.body.posts[0].tags.type).toBe('사고팔고');
      expect(res.body.posts[0].tags.region).toBe('24');
    });

    test('빈 결과', async () => {
      await BoardPost.deleteMany({});

      const res = await request(server).get('/api/boards');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.posts)).toBe(true);
      expect(res.body.posts.length).toBe(0);
    });
  });

  describe('GET /api/boards/:postId (게시글 상세)', () => {
    test('정상적인 조회', async () => {
      const res = await request(server)
        .get(`/api/boards/${testPost._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.post).toMatchObject({
        title: '테스트 게시글',
        content: '<p>테스트 내용입니다.</p>',
        tags: {
          type: '사고팔고',
          region: '24',
          subcategory: '생활용품'
        }
      });
    });

    test('존재하지 않는 게시글', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(server)
        .get(`/api/boards/${fakeId}`);

      expect(res.status).toBe(404);
    });

    test('잘못된 ID 형식', async () => {
      const res = await request(server)
        .get('/api/boards/invalid-id');

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/boards (게시글 생성)', () => {
    test('정상적인 게시글 생성', async () => {
      const res = await request(server)
        .post('/api/boards')
        .set('Cookie', authToken)
        .send({
          title: '새로운 게시글',
          content: '<p>새로운 내용입니다.</p>',
          tags: {
            type: '사고팔고',
            region: '30',
            subcategory: '나눔'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('게시글 생성 성공');
      expect(res.body.post).toMatchObject({
        title: '새로운 게시글',
        content: '<p>새로운 내용입니다.</p>'
      });
      expect(res.body.post.postNumber).toBeGreaterThan(0);
    });

    test('인증 없이 생성 시도 - 401 반환', async () => {
      const res = await request(server)
        .post('/api/boards')
        .send({
          title: '새로운 게시글',
          content: '내용',
          tags: { type: '사고팔고', region: '24' }
        });

      expect(res.status).toBe(401);
    });

    test('Authorization 헤더로도 인증 가능', async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { _id: testUser._id, id: testUser.id, email: testUser.email, authority: testUser.authority },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      const res = await request(server)
        .post('/api/boards')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '헤더 인증 테스트',
          content: '내용',
          tags: { type: '사고팔고', region: '24' }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('필수 필드 누락 - 제목', async () => {
      const res = await request(server)
        .post('/api/boards')
        .set('Cookie', authToken)
        .send({
          content: '내용',
          tags: { type: '사고팔고', region: '24' }
        });

      expect(res.status).toBe(400);
    });

    test('HTML 콘텐츠 sanitization', async () => {
      const res = await request(server)
        .post('/api/boards')
        .set('Cookie', authToken)
        .send({
          title: '테스트',
          content: '<p>안전한 내용</p><script>alert("XSS")</script>',
          tags: { type: '사고팔고', region: '24' }
        });

      expect(res.status).toBe(201);
      expect(res.body.post.content).not.toContain('<script>');
      expect(res.body.post.content).toContain('<p>안전한 내용</p>');
    });
  });

  describe('PUT /api/boards/:postId (게시글 수정)', () => {
    test('작성자가 수정', async () => {
      const res = await request(server)
        .put(`/api/boards/${testPost._id}`)
        .set('Cookie', authToken)
        .send({
          title: '수정된 제목',
          content: '수정된 내용',
          tags: { type: '부동산', region: '30' }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.post.title).toBe('수정된 제목');
    });

    test('관리자가 다른 사람 글 수정', async () => {
      const res = await request(server)
        .put(`/api/boards/${testPost._id}`)
        .set('Cookie', adminToken)
        .send({
          title: '관리자가 수정한 제목',
          content: '관리자가 수정한 내용'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('다른 사용자가 수정 시도 - 403', async () => {
      const otherUser = await User.create({
        id: 'otheruser',
        email: 'other@example.com',
        password: 'Other1234!@',
        authority: 3
      });

      const loginRes = await request(server)
        .post('/api/users/login')
        .send({ id: 'otheruser', password: 'Other1234!@' });
      const cookies = loginRes.headers['set-cookie'] || [];
      const otherToken = cookies.length > 0 ? cookies[0] : '';

      const res = await request(server)
        .put(`/api/boards/${testPost._id}`)
        .set('Cookie', otherToken)
        .send({
          title: '다른 사람이 수정',
          content: '수정 시도'
        });

      expect(res.status).toBe(403);
    });

    test('존재하지 않는 게시글 수정', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(server)
        .put(`/api/boards/${fakeId}`)
        .set('Cookie', authToken)
        .send({
          title: '수정',
          content: '내용'
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/boards/:postId (게시글 삭제)', () => {
    test('작성자가 삭제', async () => {
      const res = await request(server)
        .delete(`/api/boards/${testPost._id}`)
        .set('Cookie', authToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const checkRes = await request(server)
        .get(`/api/boards/${testPost._id}`);
      expect(checkRes.status).toBe(404);
    });

    test('관리자가 다른 사람 글 삭제', async () => {
      const res = await request(server)
        .delete(`/api/boards/${testPost._id}`)
        .set('Cookie', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('다른 사용자가 삭제 시도 - 403', async () => {
      const otherUser = await User.create({
        id: 'otheruser2',
        email: 'other2@example.com',
        password: 'Other1234!@',
        authority: 3
      });

      const loginRes = await request(server)
        .post('/api/users/login')
        .send({ id: 'otheruser2', password: 'Other1234!@' });
      const cookies = loginRes.headers['set-cookie'] || [];
      const otherToken = cookies.length > 0 ? cookies[0] : '';

      const res = await request(server)
        .delete(`/api/boards/${testPost._id}`)
        .set('Cookie', otherToken);

      expect(res.status).toBe(403);
    });

    test('인증 없이 삭제 시도 - 401', async () => {
      const res = await request(server)
        .delete(`/api/boards/${testPost._id}`);

      expect(res.status).toBe(401);
    });

    test('존재하지 않는 게시글 삭제', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(server)
        .delete(`/api/boards/${fakeId}`)
        .set('Cookie', authToken);

      expect(res.status).toBe(404);
    });
  });
});

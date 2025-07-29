const request = require('supertest');
const app = require('../../server');
const BoardPost = require('../../models/BoardPost');
const User = require('../../models/User');
const Tag = require('../../models/Tag');
const Counter = require('../../models/Counter');
const mongoose = require('mongoose');
const { loginAndGetCookie, getOrCreateTestUser, cleanupTestUsers } = require('../helpers/authHelpers');
const { setupTestEnvironment, cleanupTestData } = require('../helpers/testHelpers');
const testConfig = require('../../config/test.config');

describe('Board API Tests', () => {
  let authToken;
  let testUser;
  let adminUser;
  let adminToken;
  let testPost;
  let testTags;

  beforeAll(async () => {
    // 테스트 환경 설정 사용
    await setupTestEnvironment();
  });

  beforeEach(async () => {
    // 게시글과 사용자 초기화
    await Promise.all([
      BoardPost.deleteMany({}),
      User.deleteMany({}),
      Counter.findOneAndUpdate(
        { _id: 'postNumber' },
        { seq: 0 },
        { upsert: true }
      )
    ]);

    // 태그는 setupTestEnvironment에서 이미 설정됨
    testTags = await Tag.find({});

    // 테스트 유저 생성
    testUser = await getOrCreateTestUser('regular');
    adminUser = await getOrCreateTestUser('admin');

    // 로그인하여 쿠키 얻기
    authToken = await loginAndGetCookie(request, app, {
      id: testConfig.testUsers.regular.id,
      password: testConfig.testUsers.regular.password
    });

    adminToken = await loginAndGetCookie(request, app, {
      id: testConfig.testUsers.admin.id,  
      password: testConfig.testUsers.admin.password
    });

    // 테스트 게시글 생성 (postNumber는 자동 생성됨)
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

  afterAll(async () => {
    await cleanupTestData();
    await cleanupTestUsers();
  });

  describe('GET /api/boards (게시글 목록)', () => {
    beforeEach(async () => {
      // 추가 게시글 생성 (postNumber는 자동 생성됨)
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
      const res = await request(app)
        .get('/api/boards');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.posts).toHaveLength(3);
      expect(res.body.totalPosts).toBe(3);
      expect(res.body.totalPages).toBe(1);
      expect(res.body.currentPage).toBe(1);
    });

    test('페이지네이션', async () => {
      const res = await request(app)
        .get('/api/boards')
        .query({ page: 1, limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(2);
      expect(res.body.totalPosts).toBe(3);
      expect(res.body.totalPages).toBe(2);
      expect(res.body.currentPage).toBe(1);
    });

    test('타입 필터링', async () => {
      const res = await request(app)
        .get('/api/boards')
        .query({ type: '부동산' });

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(1);
      expect(res.body.posts[0].tags.type).toBe('부동산');
    });

    test('지역 필터링 - 단일 지역', async () => {
      const res = await request(app)
        .get('/api/boards')
        .query({ region: '24' });

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(2);
      expect(res.body.posts.every(p => p.tags.region === '24')).toBe(true);
    });

    test('지역 필터링 - 다중 지역', async () => {
      const res = await request(app)
        .get('/api/boards')
        .query({ region: '24,30' });

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(3);
    });

    test('지역 필터링 - 범위', async () => {
      const res = await request(app)
        .get('/api/boards')
        .query({ region: '20-30' });

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(3); // 24(2개), 30(1개)
    });

    test('검색 기능', async () => {
      const res = await request(app)
        .get('/api/boards')
        .query({ search: '부동산' });

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(1);
      expect(res.body.posts[0].title).toContain('부동산');
    });

    test('소주제 필터링', async () => {
      const res = await request(app)
        .get('/api/boards')
        .query({ subcategory: '생활용품' });

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(1);
      expect(res.body.posts[0].tags.subcategory).toBe('생활용품');
    });

    test('복합 필터링', async () => {
      const res = await request(app)
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
  });

  describe('GET /api/boards/:postId (게시글 상세)', () => {
    test('정상적인 조회', async () => {
      const res = await request(app)
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
        },
        viewCount: 1 // 조회수 증가
      });
    });

    test('존재하지 않는 게시글', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/boards/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('게시글을 찾을 수 없습니다');
    });

    test('잘못된 ID 형식', async () => {
      const res = await request(app)
        .get('/api/boards/invalid-id');

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('조회수 증가 확인', async () => {
      // 첫 번째 조회
      await request(app).get(`/api/boards/${testPost._id}`);
      
      // 두 번째 조회
      const res = await request(app).get(`/api/boards/${testPost._id}`);
      
      expect(res.body.post.viewCount).toBe(2);
    });
  });

  describe('POST /api/boards (게시글 생성)', () => {
    test('정상적인 게시글 생성', async () => {
      const res = await request(app)
        .post('/api/boards')
        .set('Cookie', authToken)
        .send({
          title: '새로운 게시글',
          content: '<p>새로운 내용입니다.</p>',
          tags: {
            type: '사고팔고',
            region: '30',
            subcategory: '가전제품'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('게시글 생성 성공');
      expect(res.body.post).toMatchObject({
        title: '새로운 게시글',
        content: '<p>새로운 내용입니다.</p>'
      });
      // postNumber는 자동 생성되므로 1보다 크기만 확인
      expect(res.body.post.postNumber).toBeGreaterThan(0);
    });

    test('인증 없이 생성 시도', async () => {
      const res = await request(app)
        .post('/api/boards')
        .send({
          title: '새로운 게시글',
          content: '내용',
          tags: { type: '사고팔고', region: '24' }
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('인증이 필요합니다');
    });

    test('필수 필드 누락 - 제목', async () => {
      const res = await request(app)
        .post('/api/boards')
        .set('Cookie', authToken)
        .send({
          content: '내용',
          tags: { type: '사고팔고', region: '24' }
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('제목');
    });

    test('필수 필드 누락 - 태그', async () => {
      const res = await request(app)
        .post('/api/boards')
        .set('Cookie', authToken)
        .send({
          title: '제목',
          content: '내용'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('태그');
    });

    test('잘못된 태그 값', async () => {
      const res = await request(app)
        .post('/api/boards')
        .set('Cookie', authToken)
        .send({
          title: '제목',
          content: '내용',
          tags: {
            type: '존재하지않는타입',
            region: '24'
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('유효하지 않은');
    });

    test('HTML 콘텐츠 sanitization', async () => {
      const res = await request(app)
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
      const res = await request(app)
        .put(`/api/boards/${testPost._id}`)
        .set('Cookie', authToken)
        .send({
          title: '수정된 제목',
          content: '수정된 내용',
          tags: {
            type: '부동산',
            region: '30'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('게시글 수정 성공');
      expect(res.body.post.title).toBe('수정된 제목');
    });

    test('관리자가 다른 사람 글 수정', async () => {
      const res = await request(app)
        .put(`/api/boards/${testPost._id}`)
        .set('Cookie', adminToken)
        .send({
          title: '관리자가 수정한 제목',
          content: '관리자가 수정한 내용'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('다른 사용자가 수정 시도', async () => {
      // 다른 유저 생성
      const otherUser = await User.create({
        id: 'otheruser',
        email: 'other@example.com',
        password: 'Other1234!@',
        authority: 3
      });

      const loginRes = await request(app)
        .post('/api/users/login')
        .send({
          id: 'otheruser',
          password: 'Other1234!@'
        });

      const otherToken = loginRes.headers['set-cookie'][0];

      const res = await request(app)
        .put(`/api/boards/${testPost._id}`)
        .set('Cookie', otherToken)
        .send({
          title: '다른 사람이 수정',
          content: '수정 시도'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('권한이 없습니다');
    });

    test('존재하지 않는 게시글 수정', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/boards/${fakeId}`)
        .set('Cookie', authToken)
        .send({
          title: '수정',
          content: '내용'
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('게시글을 찾을 수 없습니다');
    });

    test('부분 수정 - 제목만', async () => {
      const res = await request(app)
        .put(`/api/boards/${testPost._id}`)
        .set('Cookie', authToken)
        .send({
          title: '제목만 수정',
          content: testPost.content,  // 기존 내용 유지
          tags: testPost.tags  // 기존 태그 유지
        });

      expect(res.status).toBe(200);
      expect(res.body.post.title).toBe('제목만 수정');
      expect(res.body.post.content).toBe(testPost.content); // 내용은 그대로
    });
  });

  describe('DELETE /api/boards/:postId (게시글 삭제)', () => {
    test('작성자가 삭제', async () => {
      const res = await request(app)
        .delete(`/api/boards/${testPost._id}`)
        .set('Cookie', authToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('게시글 삭제 성공');

      // 삭제 확인
      const checkRes = await request(app)
        .get(`/api/boards/${testPost._id}`);
      expect(checkRes.status).toBe(404);
    });

    test('관리자가 다른 사람 글 삭제', async () => {
      const res = await request(app)
        .delete(`/api/boards/${testPost._id}`)
        .set('Cookie', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('다른 사용자가 삭제 시도', async () => {
      // 다른 유저 생성
      const otherUser = await User.create({
        id: 'otheruser2',
        email: 'other2@example.com',
        password: 'Other1234!@',
        authority: 3
      });

      const loginRes = await request(app)
        .post('/api/users/login')
        .send({
          id: 'otheruser2',
          password: 'Other1234!@'
        });

      const otherToken = loginRes.headers['set-cookie'][0];

      const res = await request(app)
        .delete(`/api/boards/${testPost._id}`)
        .set('Cookie', otherToken);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('권한이 없습니다');
    });

    test('존재하지 않는 게시글 삭제', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/boards/${fakeId}`)
        .set('Cookie', authToken);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('게시글을 찾을 수 없습니다');
    });

    test('인증 없이 삭제 시도', async () => {
      const res = await request(app)
        .delete(`/api/boards/${testPost._id}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('인증이 필요합니다');
    });
  });

  describe('GET /api/boards/subcategories (소주제 조회)', () => {
    test('전체 소주제 조회', async () => {
      const res = await request(app)
        .get('/api/boards/subcategories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.subCategories).toBeDefined();
      expect(res.body.subCategories['사고팔고']).toContain('생활용품');
      expect(res.body.subCategories['부동산']).toContain('렌트');
    });

    test('특정 타입의 소주제 조회', async () => {
      const res = await request(app)
        .get('/api/boards/subcategories')
        .query({ type: '사고팔고' });

      expect(res.status).toBe(200);
      expect(res.body.subCategories).toBeDefined();
      expect(res.body.subCategories['사고팔고']).toBeDefined();
      expect(res.body.subCategories['부동산']).toBeUndefined();
    });

    test('존재하지 않는 타입', async () => {
      const res = await request(app)
        .get('/api/boards/subcategories')
        .query({ type: '없는타입' });

      expect(res.status).toBe(200);
      expect(res.body.subCategories).toBeDefined();
      // 없는 타입도 빈 배열로 반환됨
      expect(res.body.subCategories['없는타입']).toEqual([]);
    });
  });
});
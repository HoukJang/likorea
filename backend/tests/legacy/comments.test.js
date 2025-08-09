const request = require('supertest');
const app = require('../../server');
const BoardPost = require('../../models/BoardPost');
const Comment = require('../../models/Comment');
const User = require('../../models/User');
const mongoose = require('mongoose');

describe('Comment API Tests', () => {
  let authToken;
  let testUser;
  let adminUser;
  let adminToken;
  let testPost;
  let testComment;

  beforeAll(async () => {
    // 테스트 데이터베이스 연결
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/likorea-test');
    }
  });

  beforeEach(async () => {
    // 데이터베이스 초기화
    await Promise.all([
      User.deleteMany({}),
      BoardPost.deleteMany({}),
      Comment.deleteMany({})
    ]);

    // 테스트 유저 생성
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

    // 로그인하여 토큰 얻기
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        id: 'testuser',
        password: 'Test1234!@'
      });
    
    // 쿠키 확인 및 할당
    const cookies = loginRes.headers['set-cookie'];
    authToken = cookies && cookies.length > 0 ? cookies[0] : null;
    
    if (!authToken) {
      console.error('일반 사용자 로그인 실패:', loginRes.body);
    }

    const adminLoginRes = await request(app)
      .post('/api/users/login')
      .send({
        id: 'admin',
        password: 'Admin1234!@'
      });
    
    // 관리자 쿠키 확인 및 할당
    const adminCookies = adminLoginRes.headers['set-cookie'];
    adminToken = adminCookies && adminCookies.length > 0 ? adminCookies[0] : null;
    
    if (!adminToken) {
      console.error('관리자 로그인 실패:', adminLoginRes.body);
    }

    // 테스트 게시글 생성
    testPost = await BoardPost.create({
      postNumber: 1,
      title: '테스트 게시글',
      content: '<p>테스트 내용입니다.</p>',
      tags: {
        type: '사고팔고',
        region: '24'
      },
      author: testUser._id,
      viewCount: 0
    });

    // 테스트 댓글 생성
    testComment = await Comment.create({
      content: '테스트 댓글입니다.',
      author: testUser._id,
      post: testPost._id
    });

    // 게시글의 댓글 수 업데이트
    testPost.commentCount = 1;
    await testPost.save();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/boards/:postId/comments (댓글 목록)', () => {
    beforeEach(async () => {
      // 추가 댓글 생성
      await Comment.insertMany([
        {
          content: '두 번째 댓글',
          author: adminUser._id,
          post: testPost._id
        },
        {
          content: '대댓글입니다',
          author: testUser._id,
          post: testPost._id,
          parentComment: testComment._id
        }
      ]);
    });

    test('정상적인 댓글 목록 조회', async () => {
      const res = await request(app)
        .get(`/api/boards/${testPost._id}/comments`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.comments).toHaveLength(3);
      expect(res.body.comments[0]).toMatchObject({
        content: '테스트 댓글입니다.',
        author: {
          id: 'testuser',
          email: 'test@example.com'
        }
      });
    });

    test('대댓글 구조 확인', async () => {
      const res = await request(app)
        .get(`/api/boards/${testPost._id}/comments`);

      const parentComment = res.body.comments.find(c => c.content === '테스트 댓글입니다.');
      const childComment = res.body.comments.find(c => c.content === '대댓글입니다');
      
      expect(childComment.parentComment).toBe(parentComment._id);
    });

    test('존재하지 않는 게시글의 댓글', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/boards/${fakeId}/comments`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.comments).toEqual([]);
    });

    test('잘못된 게시글 ID', async () => {
      const res = await request(app)
        .get('/api/boards/invalid-id/comments');

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /api/boards/:postId/comments (댓글 생성)', () => {
    test('정상적인 댓글 생성', async () => {
      const res = await request(app)
        .post(`/api/boards/${testPost._id}/comments`)
        .set('Cookie', authToken)
        .send({
          content: '새로운 댓글입니다.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('댓글이 작성되었습니다.');
      expect(res.body.comment).toMatchObject({
        content: '새로운 댓글입니다.',
        author: testUser._id.toString(),
        post: testPost._id.toString()
      });

      // 게시글의 댓글 수 증가 확인
      const updatedPost = await BoardPost.findById(testPost._id);
      expect(updatedPost.commentCount).toBe(2);
    });

    test('대댓글 생성', async () => {
      const res = await request(app)
        .post(`/api/boards/${testPost._id}/comments`)
        .set('Cookie', authToken)
        .send({
          content: '이것은 대댓글입니다.',
          parentComment: testComment._id
        });

      expect(res.status).toBe(201);
      expect(res.body.comment.parentComment).toBe(testComment._id.toString());
    });

    test('인증 없이 댓글 생성', async () => {
      const res = await request(app)
        .post(`/api/boards/${testPost._id}/comments`)
        .send({
          content: '인증 없는 댓글'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('인증이 필요합니다');
    });

    test('빈 댓글 내용', async () => {
      const res = await request(app)
        .post(`/api/boards/${testPost._id}/comments`)
        .set('Cookie', authToken)
        .send({
          content: ''
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('댓글 내용');
    });

    test('존재하지 않는 게시글에 댓글', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/boards/${fakeId}/comments`)
        .set('Cookie', authToken)
        .send({
          content: '댓글 내용'
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('게시글을 찾을 수 없습니다');
    });

    test('존재하지 않는 부모 댓글', async () => {
      const fakeCommentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/boards/${testPost._id}/comments`)
        .set('Cookie', authToken)
        .send({
          content: '대댓글',
          parentComment: fakeCommentId
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('부모 댓글을 찾을 수 없습니다');
    });

    test('HTML sanitization', async () => {
      const res = await request(app)
        .post(`/api/boards/${testPost._id}/comments`)
        .set('Cookie', authToken)
        .send({
          content: '안전한 내용 <script>alert("XSS")</script>'
        });

      expect(res.status).toBe(201);
      expect(res.body.comment.content).not.toContain('<script>');
      expect(res.body.comment.content).toContain('안전한 내용');
    });
  });

  describe('PUT /api/boards/:postId/comments/:commentId (댓글 수정)', () => {
    test('작성자가 댓글 수정', async () => {
      const res = await request(app)
        .put(`/api/boards/${testPost._id}/comments/${testComment._id}`)
        .set('Cookie', authToken)
        .send({
          content: '수정된 댓글입니다.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('댓글이 수정되었습니다.');
      expect(res.body.comment.content).toBe('수정된 댓글입니다.');
    });

    test('관리자가 다른 사람 댓글 수정', async () => {
      const res = await request(app)
        .put(`/api/boards/${testPost._id}/comments/${testComment._id}`)
        .set('Cookie', adminToken)
        .send({
          content: '관리자가 수정한 댓글'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('다른 사용자가 댓글 수정 시도', async () => {
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

      const cookies = loginRes.headers['set-cookie'] || [];
      const otherToken = cookies.length > 0 ? cookies[0] : '';

      const res = await request(app)
        .put(`/api/boards/${testPost._id}/comments/${testComment._id}`)
        .set('Cookie', otherToken)
        .send({
          content: '다른 사람이 수정'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('권한이 없습니다');
    });

    test('존재하지 않는 댓글 수정', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/boards/${testPost._id}/comments/${fakeId}`)
        .set('Cookie', authToken)
        .send({
          content: '수정'
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('댓글을 찾을 수 없습니다');
    });

    test('빈 내용으로 수정', async () => {
      const res = await request(app)
        .put(`/api/boards/${testPost._id}/comments/${testComment._id}`)
        .set('Cookie', authToken)
        .send({
          content: ''
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('댓글 내용');
    });
  });

  describe('DELETE /api/boards/:postId/comments/:commentId (댓글 삭제)', () => {
    test('작성자가 댓글 삭제', async () => {
      const res = await request(app)
        .delete(`/api/boards/${testPost._id}/comments/${testComment._id}`)
        .set('Cookie', authToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('댓글이 삭제되었습니다.');

      // 삭제 확인
      const deletedComment = await Comment.findById(testComment._id);
      expect(deletedComment).toBeNull();

      // 게시글의 댓글 수 감소 확인
      const updatedPost = await BoardPost.findById(testPost._id);
      expect(updatedPost.commentCount).toBe(0);
    });

    test('관리자가 다른 사람 댓글 삭제', async () => {
      const res = await request(app)
        .delete(`/api/boards/${testPost._id}/comments/${testComment._id}`)
        .set('Cookie', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('다른 사용자가 댓글 삭제 시도', async () => {
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

      const cookies = loginRes.headers['set-cookie'] || [];
      const otherToken = cookies.length > 0 ? cookies[0] : '';

      const res = await request(app)
        .delete(`/api/boards/${testPost._id}/comments/${testComment._id}`)
        .set('Cookie', otherToken);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('권한이 없습니다');
    });

    test('대댓글이 있는 댓글 삭제', async () => {
      // 대댓글 생성
      const childComment = await Comment.create({
        content: '대댓글',
        author: testUser._id,
        post: testPost._id,
        parentComment: testComment._id
      });

      const res = await request(app)
        .delete(`/api/boards/${testPost._id}/comments/${testComment._id}`)
        .set('Cookie', authToken);

      expect(res.status).toBe(200);

      // 대댓글도 함께 삭제되었는지 확인
      const deletedChild = await Comment.findById(childComment._id);
      expect(deletedChild).toBeNull();
    });

    test('존재하지 않는 댓글 삭제', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/boards/${testPost._id}/comments/${fakeId}`)
        .set('Cookie', authToken);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('댓글을 찾을 수 없습니다');
    });

    test('인증 없이 댓글 삭제', async () => {
      const res = await request(app)
        .delete(`/api/boards/${testPost._id}/comments/${testComment._id}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('인증이 필요합니다');
    });
  });
});
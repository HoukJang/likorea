const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../models/User');
const BoardPost = require('../../models/BoardPost');
const Counter = require('../../models/Counter');
const { initializeEssentialData } = require('../setup/testDb');

describe('Input Validation Tests', () => {
  let app;
  let server;
  let authToken;
  let testUser;

  beforeAll(async () => {
    await initializeEssentialData();
    app = require('../../server');
    server = app.listen(0);
  });

  afterAll(async () => {
    await BoardPost.deleteMany({});
    await User.deleteMany({});
    if (server) server.close();
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      BoardPost.deleteMany({}),
      Counter.findOneAndUpdate(
        { _id: 'board' },
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

    const loginRes = await request(server)
      .post('/api/users/login')
      .send({ id: 'testuser', password: 'Test1234!@' });
    const cookies = loginRes.headers['set-cookie'] || [];
    authToken = cookies.length > 0 ? cookies[0] : '';
  });

  describe('User Validation', () => {
    test('회원가입 - 아이디 형식 검증', async () => {
      const invalidIds = [
        'ab',
        'a'.repeat(21),
      ];

      for (const id of invalidIds) {
        const res = await request(server)
          .post('/api/users')
          .send({
            id,
            email: 'valid@example.com',
            password: 'Test1234!@'
          });

        expect(res.status).toBe(400);
      }
    });

    test('회원가입 - 이메일 형식 검증', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
      ];

      for (const email of invalidEmails) {
        const res = await request(server)
          .post('/api/users')
          .send({
            id: 'newuser',
            email,
            password: 'Test1234!@'
          });

        expect(res.status).toBe(400);
      }
    });

    test('회원가입 - 비밀번호 정책 검증', async () => {
      // Actual validator: min 6 chars + lowercase + numbers
      const weakPasswords = [
        'Ab1',               // too short (< 6)
        'NOLOWERCASE1!',     // no lowercase
        'nonumbers!!',       // no numbers
      ];

      for (const password of weakPasswords) {
        const res = await request(server)
          .post('/api/users')
          .send({
            id: 'newuser',
            email: 'new@example.com',
            password
          });

        expect(res.status).toBe(400);
      }
    });

    test('사용자 수정 - 이메일 형식 검증', async () => {
      const res = await request(server)
        .put('/api/users/testuser')
        .set('Cookie', authToken)
        .send({ email: 'invalid-email' });

      expect(res.status).toBe(400);
    });
  });

  describe('Board Validation', () => {
    test('제목 길이 검증', async () => {
      const invalidTitles = [
        '',
        'a'.repeat(101),
      ];

      for (const title of invalidTitles) {
        const res = await request(server)
          .post('/api/boards')
          .set('Cookie', authToken)
          .send({
            title,
            content: '정상적인 내용',
            tags: { type: '사고팔고', region: '24' }
          });

        expect(res.status).toBe(400);
      }
    });

    test('내용 누락 검증', async () => {
      const res = await request(server)
        .post('/api/boards')
        .set('Cookie', authToken)
        .send({
          title: '정상적인 제목',
          content: '',
          tags: { type: '사고팔고', region: '24' }
        });

      expect(res.status).toBe(400);
    });

    test('태그 필수 검증', async () => {
      // Controller requires tags.type; region defaults to '0' if missing
      const invalidTags = [
        {},
        { region: '24' },
      ];

      for (const tags of invalidTags) {
        const res = await request(server)
          .post('/api/boards')
          .set('Cookie', authToken)
          .send({
            title: '제목',
            content: '내용',
            tags
          });

        expect(res.status).toBe(400);
      }
    });

    test('유효한 태그 값 검증', async () => {
      const invalidTags = [
        { type: '존재하지않는타입', region: '24' },
        { type: '사고팔고', region: '999' },
      ];

      for (const tags of invalidTags) {
        const res = await request(server)
          .post('/api/boards')
          .set('Cookie', authToken)
          .send({
            title: '제목',
            content: '내용',
            tags
          });

        expect(res.status).toBe(400);
      }
    });

    test('소주제 검증 - 잘못된 소주제', async () => {
      const res = await request(server)
        .post('/api/boards')
        .set('Cookie', authToken)
        .send({
          title: '제목',
          content: '내용',
          tags: {
            type: '사고팔고',
            region: '24',
            subcategory: '존재하지않는소주제'
          }
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Comment Validation', () => {
    let testPost;

    beforeEach(async () => {
      testPost = await BoardPost.create({
        title: '테스트 게시글',
        content: '내용',
        tags: { type: '사고팔고', region: '24' },
        author: testUser._id
      });
    });

    test('빈 댓글 내용 거부', async () => {
      const res = await request(server)
        .post(`/api/boards/${testPost._id}/comments`)
        .set('Cookie', authToken)
        .send({ content: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('ObjectId Validation', () => {
    test('잘못된 ObjectId 형식', async () => {
      const invalidIds = [
        'invalid-id',
        '123',
        '60c000000000000000000000x',
      ];

      for (const id of invalidIds) {
        const res = await request(server)
          .get(`/api/boards/${id}`);

        expect(res.status).toBe(400);
      }
    });
  });

  describe('Special Characters Handling', () => {
    test('유니코드 및 이모지 처리', async () => {
      const res = await request(server)
        .post('/api/boards')
        .set('Cookie', authToken)
        .send({
          title: '한글 제목 테스트',
          content: '日本語 中文 العربية',
          tags: { type: '사고팔고', region: '24' }
        });

      expect(res.status).toBe(201);
      expect(res.body.post.title).toBe('한글 제목 테스트');
      expect(res.body.post.content).toContain('日本語');
    });
  });

  describe('Login Validation', () => {
    test('로그인 - ID 길이 검증', async () => {
      const res = await request(server)
        .post('/api/users/login')
        .send({ id: 'ab', password: 'Test1234!@' });

      expect(res.status).toBe(400);
    });

    test('로그인 - 비밀번호 누락', async () => {
      const res = await request(server)
        .post('/api/users/login')
        .send({ id: 'testuser' });

      expect(res.status).toBe(400);
    });
  });
});

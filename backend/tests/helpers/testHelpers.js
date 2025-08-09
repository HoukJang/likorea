const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Board = require('../../models/BoardPost');
const Tag = require('../../models/Tag');
const Counter = require('../../models/Counter');
const { initializeTags } = require('../../utils/initTags');
const testConfig = require('../../config/test.config');
const authHelpers = require('./authHelpers');

// 테스트에서 생성한 데이터 추적
const testData = {
  users: [],
  boards: [],
  tags: []
};

/**
 * 테스트용 사용자 생성 (추적됨)
 */
const createTestUser = async (userData = {}) => {
  const defaultUser = {
    id: 'testuser',
    email: 'test@example.com',
    password: 'Test1234!@',
    authority: 3 // 일반 사용자 권한
  };

  const user = { ...defaultUser, ...userData };

  // User 모델의 pre('save') 미들웨어가 패스워드를 자동으로 해싱하므로
  // 여기서는 해싱하지 않음

  const createdUser = await User.create(user);
  testData.users.push(createdUser._id);
  return createdUser;
};

/**
 * 테스트용 관리자 사용자 생성
 */
const createTestAdmin = async (userData = {}) => {
  const adminData = {
    id: 'admin',
    email: 'admin@example.com',
    password: 'Admin1234!@',
    authority: 5, // 관리자 권한
    ...userData
  };

  return await createTestUser(adminData);
};

/**
 * JWT 토큰 생성 (authHelpers의 함수 사용)
 */
const generateToken = (user) => {
  return authHelpers.generateTestToken(user);
};

/**
 * 만료된 JWT 토큰 생성 (authHelpers의 함수 사용)
 */
const generateExpiredToken = (user) => {
  return authHelpers.generateExpiredTestToken(user);
};

/**
 * 테스트용 게시글 생성 (추적됨)
 */
const createTestPost = async (userId, postData = {}) => {
  const defaultPost = {
    title: '테스트 게시글',
    content: '테스트 내용입니다.',
    author: userId,
    tags: {
      type: '생활정보',
      subcategory: '할인정보',
      region: '24'
    }
  };

  const post = { ...defaultPost, ...postData };
  const createdPost = await Board.create(post);
  testData.boards.push(createdPost._id);
  return createdPost;
};

/**
 * Counter 확인/초기화 (board counter만)
 */
const ensureBoardCounter = async () => {
  const counter = await Counter.findOne({ _id: 'board' });
  if (!counter) {
    await Counter.create({ _id: 'board', seq: 0 });
  }
};

/**
 * 태그 시스템 확인/초기화 (기존 태그가 없을 때만)
 */
const ensureTestTags = async () => {
  try {
    const existingTags = await Tag.countDocuments();
    if (existingTags === 0) {
      await initializeTags();
    }
  } catch (error) {
    console.error('Tag initialization failed:', error);
    throw error;
  }
};

/**
 * 테스트 환경 설정 (기존 데이터 보존)
 */
const setupTestEnvironment = async () => {
  await ensureBoardCounter();
  await ensureTestTags();
};

/**
 * 테스트에서 생성한 데이터만 삭제
 */
const cleanupTestData = async () => {
  try {
    // 테스트에서 생성한 게시글만 삭제
    if (testData.boards.length > 0) {
      await Board.deleteMany({ _id: { $in: testData.boards } });
      testData.boards = [];
    }

    // 테스트에서 생성한 사용자만 삭제
    if (testData.users.length > 0) {
      await User.deleteMany({ _id: { $in: testData.users } });
      testData.users = [];
    }

    // 테스트용 태그가 있다면 삭제 (일반적으로는 태그는 보존)
    if (testData.tags.length > 0) {
      await Tag.deleteMany({ _id: { $in: testData.tags } });
      testData.tags = [];
    }
  } catch (error) {
    console.error('Test data cleanup failed:', error);
    throw error;
  }
};

/**
 * 특정 테스트 사용자 삭제 (이미 존재할 수 있는 경우)
 */
const removeTestUserIfExists = async (userId) => {
  try {
    await User.deleteOne({ id: userId });
  } catch (error) {
    // 사용자가 존재하지 않아도 에러 무시
  }
};

/**
 * 테스트용 로그인 수행 (쿠키 문자열 반환)
 */
const loginTestUser = async (app, credentials) => {
  const request = require('supertest');
  const response = await request(app)
    .post('/api/users/login')
    .send(credentials);

  // 쿠키 헤더에서 authToken 추출
  const cookies = response.headers['set-cookie'];
  if (!cookies || cookies.length === 0) {
    throw new Error('로그인 응답에 쿠키가 없습니다');
  }

  // 첫 번째 쿠키를 반환 (authToken이어야 함)
  return cookies[0];
};

module.exports = {
  createTestUser,
  createTestAdmin,
  generateToken,
  generateExpiredToken,
  createTestPost,
  ensureBoardCounter,
  ensureTestTags,
  setupTestEnvironment,
  cleanupTestData,
  removeTestUserIfExists,
  loginTestUser,
  // Re-export authHelpers for convenience
  ...authHelpers
};
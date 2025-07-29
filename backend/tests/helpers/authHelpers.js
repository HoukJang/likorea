const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const testConfig = require('../../config/test.config');

/**
 * 테스트용 JWT 토큰 생성 (DB 없이)
 */
const generateTestToken = (userData = {}) => {
  const defaultUser = {
    _id: userData._id || '507f1f77bcf86cd799439011',
    id: userData.id || 'testuser',
    email: userData.email || 'test@example.com',
    authority: userData.authority || 3
  };

  return jwt.sign(
    defaultUser,
    testConfig.jwt.secret,
    { expiresIn: testConfig.jwt.expiresIn }
  );
};

/**
 * 만료된 JWT 토큰 생성
 */
const generateExpiredTestToken = (userData = {}) => {
  const defaultUser = {
    _id: userData._id || '507f1f77bcf86cd799439011',
    id: userData.id || 'testuser',
    email: userData.email || 'test@example.com',
    authority: userData.authority || 3
  };

  return jwt.sign(
    defaultUser,
    testConfig.jwt.secret,
    { expiresIn: testConfig.jwt.shortExpiresIn }
  );
};

/**
 * 테스트 사용자 생성 또는 가져오기
 */
const getOrCreateTestUser = async (type = 'regular') => {
  const userData = testConfig.testUsers[type];
  
  if (!userData) {
    throw new Error(`Unknown test user type: ${type}`);
  }

  try {
    // 먼저 기존 사용자 찾기
    let user = await User.findOne({ id: userData.id });
    
    if (!user) {
      // 없으면 생성
      user = await User.create(userData);
    }
    
    return user;
  } catch (error) {
    // 중복 키 에러인 경우 다시 찾기
    if (error.code === 11000) {
      return await User.findOne({ id: userData.id });
    }
    throw error;
  }
};

/**
 * 로그인하여 인증 쿠키 문자열 받기
 */
const loginAndGetCookie = async (request, app, credentials) => {
  const response = await request(app)
    .post('/api/users/login')
    .send(credentials);

  if (response.status !== 200) {
    console.error('Login failed:', response.body);
    throw new Error('Login failed: ' + (response.body.error || 'Unknown error'));
  }

  const cookies = response.headers['set-cookie'];
  if (!cookies || cookies.length === 0) {
    throw new Error('No cookies returned from login');
  }

  return cookies[0];
};

/**
 * Authorization 헤더 형식으로 토큰 반환
 */
const getAuthHeader = (token) => {
  return `Bearer ${token}`;
};

/**
 * 테스트용 인증된 요청 생성 헬퍼
 */
const authenticatedRequest = (request, app, method, url) => {
  const token = generateTestToken();
  
  let req = request(app)[method](url);
  
  // Authorization 헤더 추가
  req.set('Authorization', getAuthHeader(token));
  
  return req;
};

/**
 * 쿠키 파싱 헬퍼
 */
const parseCookie = (cookieString) => {
  if (!cookieString) return {};
  
  const cookies = {};
  cookieString.split(';').forEach(cookie => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      cookies[key] = value;
    }
  });
  
  return cookies;
};

/**
 * 테스트 사용자 정리
 */
const cleanupTestUsers = async () => {
  const testUserIds = Object.values(testConfig.testUsers).map(u => u.id);
  await User.deleteMany({ id: { $in: testUserIds } });
};

module.exports = {
  generateTestToken,
  generateExpiredTestToken,
  getOrCreateTestUser,
  loginAndGetCookie,
  getAuthHeader,
  authenticatedRequest,
  parseCookie,
  cleanupTestUsers
};
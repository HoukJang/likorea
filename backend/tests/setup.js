// 테스트 환경 설정
process.env.NODE_ENV = 'test';

// dotenv를 사용하여 .env.test 파일 로드 (테스트 환경)
require('dotenv').config({ path: '.env.test' });

// 테스트 설정 로드
const testConfig = require('../config/test.config');
const { initTestDatabase, cleanupTestDatabase } = require('./setup/testDb');

// 환경 변수 설정
process.env.NODE_ENV = 'test';
process.env.PORT = testConfig.server.port;
process.env.MONGODB_URI = process.env.MONGO_URI || testConfig.database.url;
process.env.JWT_SECRET = testConfig.jwt.secret;

// 글로벌 테스트 타임아웃 설정
jest.setTimeout(testConfig.timeout.integration);

// 테스트 환경 초기화
beforeAll(async () => {
  try {
    // 테스트 데이터베이스 초기화
    await initTestDatabase();
    
    // MongoDB 연결 가능 표시
    global.__MONGODB_AVAILABLE__ = true;
  } catch (error) {
    console.error('❌ 테스트 환경 설정 실패:', error.message);
    console.warn('💡 MongoDB Atlas 연결을 확인하세요');
    
    // MongoDB 없이도 단위 테스트는 실행 가능하도록 설정
    global.__MONGODB_AVAILABLE__ = false;
  }
});

// 테스트 종료 후 정리
afterAll(async () => {
  try {
    await cleanupTestDatabase();
  } catch (error) {
    console.error('❌ 테스트 정리 실패:', error.message);
  }
});

// 콘솔 로그 억제 (테스트 중에는 로그가 필요 없음)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

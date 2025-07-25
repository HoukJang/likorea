// 테스트 환경 설정
process.env.NODE_ENV = 'test';
process.env.PORT = 5002; // 테스트용 포트

// dotenv를 사용하여 .env 파일 로드
require('dotenv').config({ path: '.env' });

// MongoDB 연결 정보를 .env 파일에서 가져오기
if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI가 .env 파일에 설정되지 않았습니다.');
}

// 테스트 환경에서는 .env의 MONGO_URI를 그대로 사용
process.env.MONGODB_URI = process.env.MONGO_URI;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// 글로벌 테스트 타임아웃 설정 (원격 DB 연결을 위해 증가)
jest.setTimeout(30000);

// MongoDB 연결 상태 확인
const mongoose = require('mongoose');

beforeAll(async () => {
  try {
    // 기존 연결이 있으면 닫기
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // 테스트 데이터베이스에 연결
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ 테스트 데이터베이스 연결 성공');
  } catch (error) {
    console.error('❌ 테스트 데이터베이스 연결 실패:', error.message);
    throw error;
  }
});

afterAll(async () => {
  try {
    // 모든 컬렉션 삭제
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }
    
    // 연결 종료
    await mongoose.disconnect();
    console.log('✅ 테스트 데이터베이스 연결 종료');
  } catch (error) {
    console.error('❌ 테스트 데이터베이스 정리 실패:', error.message);
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
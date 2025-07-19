// 테스트 환경 설정
process.env.NODE_ENV = 'test';
process.env.PORT = 5002; // 테스트용 포트
process.env.MONGODB_URI = 'mongodb://localhost:27017/likorea_test';
process.env.JWT_SECRET = 'test-secret-key';

// 글로벌 테스트 타임아웃 설정
jest.setTimeout(10000);

// MongoDB 연결 상태 확인
const mongoose = require('mongoose');

beforeAll(async () => {
  // 기존 연결이 있으면 닫기
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // 테스트 데이터베이스에 연결
  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  // 모든 컬렉션 삭제
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
  
  // 연결 종료
  await mongoose.disconnect();
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
/**
 * 테스트 환경 설정
 */
module.exports = {
  // 데이터베이스 설정
  database: {
    // MongoDB Memory Server 사용 여부
    useMemoryServer: false,
    // 테스트 DB URL (MongoDB Atlas 사용)
    url: process.env.MONGO_URI || 'mongodb+srv://likorea62:WkdghdnrFhddkfzhfldk@likorea.6zxr8.mongodb.net/likorea_test?retryWrites=true&w=majority',
    // 테스트 전 DB 초기화 여부
    dropBeforeTest: true,
    // 테스트 간 데이터 격리
    isolateTests: true
  },

  // JWT 설정
  jwt: {
    secret: 'test-secret-key-for-testing-environment-minimum-32-characters',
    expiresIn: '1d',
    // 테스트용 짧은 만료 토큰
    shortExpiresIn: '1s'
  },

  // 서버 설정
  server: {
    port: 5002,
    // 로그 출력 억제
    silent: true
  },

  // 테스트 사용자 정보
  testUsers: {
    regular: {
      id: 'testuser',
      email: 'test@example.com',
      password: 'Test1234!@',
      authority: 3
    },
    admin: {
      id: 'admin',
      email: 'admin@example.com', 
      password: 'Admin1234!@',
      authority: 5
    },
    moderator: {
      id: 'moderator',
      email: 'mod@example.com',
      password: 'Mod1234!@',
      authority: 4
    }
  },

  // 테스트 타임아웃
  timeout: {
    unit: 10000,      // 10초
    integration: 30000, // 30초
    e2e: 60000        // 60초
  },

  // 재시도 설정
  retry: {
    times: 3,
    delay: 1000
  }
};
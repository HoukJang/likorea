module.exports = {
  testEnvironment: 'node',
  rootDir: '../',
  collectCoverageFrom: [
    '**/*.js',
    '!coverage/**',
    '!node_modules/**',
    '!tests/**',
    '!server.js',
    '!config/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/legacy/'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  verbose: true,
  // 테스트 완료 후 강제 종료
  forceExit: true,
  // 열린 핸들 감지
  detectOpenHandles: true,
  // 테스트 타임아웃 (30초)
  testTimeout: 30000,
  // 최대 동시 실행 워커 수
  maxWorkers: '50%'
};
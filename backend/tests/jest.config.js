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
  verbose: true
};
const path = require('path');
const fs = require('fs');

// Read MONGO_URI from globalSetup's temp file
const uriPath = path.join(__dirname, '.test-mongo-uri');
if (fs.existsSync(uriPath)) {
  process.env.MONGO_URI = fs.readFileSync(uriPath, 'utf8').trim();
}

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';

jest.setTimeout(60000);

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Global test utilities
global.testUtils = {
  randomString: (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  },

  testUser: (overrides = {}) => ({
    id: `test_${global.testUtils.randomString(8)}`,
    email: `test_${global.testUtils.randomString(8)}@test.com`,
    password: 'TestPassword123!',
    authority: 3,
    ...overrides
  }),

  testPost: (overrides = {}) => ({
    title: `Test Post ${global.testUtils.randomString(5)}`,
    content: `Test content ${global.testUtils.randomString(20)}`,
    tags: ['사고팔고'],
    ...overrides
  })
};

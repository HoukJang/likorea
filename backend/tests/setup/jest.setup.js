// Jest setup file for backend tests
require('dotenv').config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/likorea-test';

// Increase test timeout for slow operations
// MongoDB Atlas needs more time for initial connection
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
  // Generate random test data
  randomString: (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  },

  // Generate test user data
  testUser: (overrides = {}) => ({
    id: `test_${global.testUtils.randomString(8)}`,
    email: `test_${global.testUtils.randomString(8)}@test.com`,
    password: 'TestPassword123!',
    authority: 3,
    ...overrides
  }),

  // Generate test post data
  testPost: (overrides = {}) => ({
    title: `Test Post ${global.testUtils.randomString(5)}`,
    content: `Test content ${global.testUtils.randomString(20)}`,
    tags: ['사고팔고'],
    ...overrides
  })
};
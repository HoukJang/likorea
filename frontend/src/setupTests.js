// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// Global mocks setup

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock window.alert
Object.defineProperty(window, 'alert', {
  value: jest.fn(),
  writable: true
});

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: jest.fn(() => true),
  writable: true
});

// Mock window.prompt
Object.defineProperty(window, 'prompt', {
  value: jest.fn(),
  writable: true
});

// Mock window.dispatchEvent
Object.defineProperty(window, 'dispatchEvent', {
  value: jest.fn(),
  writable: true
});

// Mock window.location
const mockLocation = {
  href: '',
  pathname: '/',
  search: '',
  hash: '',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  protocol: 'http:',
  origin: 'http://localhost:3000',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock fetch
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset localStorage mock
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.setItem.mockImplementation(() => {});
  localStorageMock.removeItem.mockImplementation(() => {});
  localStorageMock.clear.mockImplementation(() => {});
  
  // Reset window mocks
  window.alert.mockImplementation(() => {});
  window.confirm.mockReturnValue(true);
  window.prompt.mockReturnValue('');
  window.dispatchEvent.mockImplementation(() => true);
  
  // Reset location mock
  mockLocation.href = '';
  mockLocation.pathname = '/';
  mockLocation.search = '';
  mockLocation.hash = '';
  
  // Reset fetch mock
  global.fetch.mockClear();
});

// Clean up after each test
afterEach(() => {
  jest.resetAllMocks();
});

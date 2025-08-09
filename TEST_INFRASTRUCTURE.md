# Test Infrastructure Documentation

## Overview
This document describes the new test infrastructure for the Likorea project, replacing the legacy test system.

## Test Structure

### Backend Tests
Located in `/backend/tests/`

```
backend/tests/
├── jest.config.js          # Jest configuration
├── setup/
│   └── jest.setup.js      # Test setup and utilities
├── unit/                  # Unit tests
│   └── validators.test.js # Validator function tests
├── integration/           # Integration tests
│   └── auth.test.js      # Auth endpoint tests
└── legacy/               # Old test files (archived)
```

### Frontend Tests
Located in `/frontend/src/__tests__/`

```
frontend/src/__tests__/
├── jest.config.js           # Jest configuration
├── jest.setup.js           # Test setup
├── __mocks__/
│   └── fileMock.js        # File import mocks
├── components/
│   └── Login.test.js      # Component unit tests
└── legacy/                # Old test files (archived)
```

## Running Tests

### Backend
```bash
cd backend

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Frontend
```bash
cd frontend

# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in CI mode
CI=true npm test
```

## Test Environment

### Backend Test Environment
- Uses `.env.test` file for test-specific configuration
- Test database: MongoDB connection (can be local or Atlas)
- JWT secrets and other sensitive data use test values
- Automatic cleanup after tests

### Frontend Test Environment
- Uses Jest with React Testing Library
- Mocks for localStorage, fetch, and other browser APIs
- CSS modules and file imports are mocked
- Environment variables use test values

## Writing New Tests

### Backend Unit Test Example
```javascript
const { validateEmail } = require('../../utils/validators');

describe('validateEmail', () => {
  test('should accept valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });
  
  test('should reject invalid email', () => {
    expect(validateEmail('not-an-email')).toBe(false);
  });
});
```

### Backend Integration Test Example
```javascript
const request = require('supertest');
const app = require('../../server');

describe('POST /api/auth/login', () => {
  test('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ id: 'testuser', password: 'password123' });
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

### Frontend Component Test Example
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../../components/Login';

test('renders login form', () => {
  render(<Login />);
  expect(screen.getByPlaceholderText('아이디')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
});
```

## Test Utilities

### Backend Test Utilities (global.testUtils)
- `randomString(length)` - Generate random strings
- `testUser(overrides)` - Generate test user data
- `testPost(overrides)` - Generate test post data

### Frontend Test Utilities
- React Testing Library utilities
- Mock implementations for browser APIs
- Test ID attributes for component selection

## CI/CD Integration

Tests are automatically run in the CI/CD pipeline:
- On every push to `main` and `develop` branches
- On every pull request to `main` branch
- Both backend and frontend tests must pass for deployment

## Coverage Requirements

### Backend
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

### Frontend
- Branches: 60%
- Functions: 60%
- Lines: 60%
- Statements: 60%

## Migration from Legacy Tests

All old test files have been moved to `legacy/` folders. To migrate a legacy test:

1. Review the old test logic
2. Identify what's being tested
3. Rewrite using the new test structure
4. Ensure proper setup/teardown
5. Add appropriate assertions
6. Delete the legacy file once migrated

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Descriptive**: Use clear test descriptions
4. **Fast**: Keep tests fast and focused
5. **Reliable**: Tests should not be flaky
6. **Maintainable**: Keep tests simple and readable

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**
   - Ensure MongoDB is running (for local tests)
   - Check `.env.test` configuration
   - Verify network connectivity

2. **Port Conflicts**
   - Tests use random ports to avoid conflicts
   - If issues persist, check for processes using ports

3. **Module Import Errors**
   - Clear Jest cache: `jest --clearCache`
   - Reinstall dependencies: `npm ci`

4. **Timeout Errors**
   - Default timeout is 30 seconds
   - Increase for slow operations in jest.setup.js

## Future Improvements

1. Add E2E tests using Playwright or Cypress
2. Implement visual regression testing
3. Add performance benchmarking tests
4. Integrate with code coverage services
5. Add mutation testing for better quality
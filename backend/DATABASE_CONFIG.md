# Database Configuration Guide

## Environment-Specific MongoDB Setup

This project uses different MongoDB configurations based on the environment:

### Development Environment
- **Database**: Local MongoDB
- **URI**: `mongodb://localhost:27017/likorea`
- **Setup**: Install and run MongoDB locally
  ```bash
  # macOS
  brew install mongodb-community
  brew services start mongodb-community
  
  # Docker
  docker run -d -p 27017:27017 --name mongodb mongo
  ```

### Test Environment
- **Database**: MongoDB Atlas (separate test database)
- **URI**: `mongodb+srv://<username>:<password>@likorea.6zxr8.mongodb.net/likorea-test`
- **Purpose**: Isolated test database to avoid conflicts with production data
- **Note**: Tests run with 60-second timeout to accommodate Atlas connection time

### Production Environment
- **Database**: MongoDB Atlas
- **URI**: `mongodb+srv://<username>:<password>@likorea.6zxr8.mongodb.net/longisland`
- **Features**: 
  - Automatic failover
  - Backup and restore
  - Performance monitoring
  - Secure connection with TLS

## Environment Files

- `.env.development` - Local MongoDB for development
- `.env.test` - MongoDB Atlas test database
- `.env.production` - MongoDB Atlas production database

## Running Tests

```bash
# Run all tests (uses MongoDB Atlas test database)
npm test

# Run specific test file
npm test auth.test.js

# Run with coverage
npm run test:coverage
```

## Troubleshooting

### Connection Timeout Errors
If you see `MongooseError: Operation buffering timed out`:
1. Check your internet connection (for Atlas)
2. Verify MongoDB URI is correct
3. Ensure IP whitelist includes your current IP (for Atlas)
4. For local MongoDB, ensure it's running

### Switching Environments
The application automatically loads the correct `.env` file based on NODE_ENV:
- `development` → `.env.development` (default)
- `test` → `.env.test`
- `production` → `.env.production`
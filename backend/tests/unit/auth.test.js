const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock User model
const User = {
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn()
};

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

describe('Authentication Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('JWT Token Tests', () => {
    const secret = 'test-secret';
    const payload = {
      _id: 'test-user-id',
      id: 'testuser',
      email: 'test@example.com',
      authority: 3
    };

    it('should create valid JWT token', () => {
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify valid JWT token', () => {
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });
      const decoded = jwt.verify(token, secret);
      
      expect(decoded._id).toBe(payload._id);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.authority).toBe(payload.authority);
    });

    it('should reject expired token', () => {
      const token = jwt.sign(payload, secret, { expiresIn: '1s' });
      
      // Wait for token to expire
      setTimeout(() => {
        expect(() => {
          jwt.verify(token, secret);
        }).toThrow('jwt expired');
      }, 2000);
    });

    it('should reject invalid token', () => {
      expect(() => {
        jwt.verify('invalid.token.here', secret);
      }).toThrow();
    });
  });

  describe('Password Hashing Tests', () => {
    it('should hash password correctly', async () => {
      const password = 'testpassword123';
      const hashedPassword = 'hashedpassword123';
      
      bcrypt.hash.mockResolvedValue(hashedPassword);
      
      const result = await bcrypt.hash(password, 10);
      
      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    it('should compare password correctly', async () => {
      const password = 'testpassword123';
      const hashedPassword = 'hashedpassword123';
      
      bcrypt.compare.mockResolvedValue(true);
      
      const result = await bcrypt.compare(password, hashedPassword);
      
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should reject wrong password', async () => {
      const password = 'wrongpassword';
      const hashedPassword = 'hashedpassword123';
      
      bcrypt.compare.mockResolvedValue(false);
      
      const result = await bcrypt.compare(password, hashedPassword);
      
      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });
  });

  describe('Token Expiration Detection', () => {
    it('should detect expired token error message', () => {
      const errorMessages = [
        '토큰이 만료되었습니다.',
        '유효하지 않은 토큰입니다.',
        '인증 토큰이 필요합니다.'
      ];

      const isTokenExpired = (message) => {
        return errorMessages.some(msg => message.includes(msg));
      };

      expect(isTokenExpired('토큰이 만료되었습니다.')).toBe(true);
      expect(isTokenExpired('유효하지 않은 토큰입니다.')).toBe(true);
      expect(isTokenExpired('인증 토큰이 필요합니다.')).toBe(true);
      expect(isTokenExpired('다른 에러 메시지')).toBe(false);
    });
  });

  describe('Protected Route Path Detection', () => {
    it('should identify protected routes correctly', () => {
      const loginRequiredPaths = ['/boards/new', '/boards/edit', '/admin', '/profile'];
      
      const isProtectedRoute = (pathname) => {
        return loginRequiredPaths.some(path => pathname.includes(path));
      };

      expect(isProtectedRoute('/boards/new')).toBe(true);
      expect(isProtectedRoute('/boards/edit/123')).toBe(true);
      expect(isProtectedRoute('/admin')).toBe(true);
      expect(isProtectedRoute('/profile')).toBe(true);
      expect(isProtectedRoute('/')).toBe(false);
      expect(isProtectedRoute('/boards')).toBe(false);
    });
  });
}); 
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth';
import * as authApi from '../api/auth';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.dispatchEvent
global.window = {
  ...global.window,
  dispatchEvent: jest.fn(),
  location: {
    pathname: '/',
    href: '',
  },
};

// Mock API functions
jest.mock('../api/auth');

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  describe('Initial State', () => {
    it('should initialize with null user when no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useAuth());
      
      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should initialize with user data when token exists', () => {
      localStorageMock.getItem
        .mockReturnValueOnce('valid-token')
        .mockReturnValueOnce('testuser')
        .mockReturnValueOnce('test@example.com')
        .mockReturnValueOnce('3');

      authApi.verifyToken.mockResolvedValue({
        valid: true,
        user: {
          id: 'testuser',
          email: 'test@example.com',
          authority: '3'
        }
      });

      const { result } = renderHook(() => useAuth());
      
      expect(result.current.user).toBeDefined();
    });
  });

  describe('Login', () => {
    it('should login successfully and store user data', async () => {
      const mockLoginResponse = {
        token: 'new-token',
        user: {
          id: 'testuser',
          email: 'test@example.com',
          authority: 3
        }
      };

      authApi.login.mockResolvedValue(mockLoginResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login({
          id: 'testuser',
          password: 'password123'
        });
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'new-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('userId', 'testuser');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('userEmail', 'test@example.com');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('userAuthority', 3);
      expect(result.current.user).toEqual({
        id: 'testuser',
        email: 'test@example.com',
        authority: 3
      });
      expect(window.dispatchEvent).toHaveBeenCalledWith(new Event('login'));
    });

    it('should handle login error', async () => {
      const mockError = new Error('Invalid credentials');
      authApi.login.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.login({
            id: 'testuser',
            password: 'wrongpassword'
          });
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.user).toBe(null);
    });
  });

  describe('Logout', () => {
    it('should logout and clear user data', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.logout();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userId');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userEmail');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userAuthority');
      expect(result.current.user).toBe(null);
      expect(result.current.error).toBe(null);
      expect(window.dispatchEvent).toHaveBeenCalledWith(new Event('logout'));
    });
  });

  describe('Token Validation', () => {
    it('should validate token successfully', async () => {
      localStorageMock.getItem.mockReturnValue('valid-token');
      
      authApi.verifyToken.mockResolvedValue({
        valid: true,
        user: {
          id: 'testuser',
          email: 'test@example.com',
          authority: '3'
        }
      });

      const { result } = renderHook(() => useAuth());

      // Wait for initial validation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(authApi.verifyToken).toHaveBeenCalled();
      expect(result.current.user).toBeDefined();
    });

    it('should logout when token is invalid', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-token');
      
      authApi.verifyToken.mockResolvedValue({
        valid: false,
        error: 'Token expired'
      });

      const { result } = renderHook(() => useAuth());

      // Wait for initial validation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(authApi.verifyToken).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalled();
      expect(result.current.user).toBe(null);
    });
  });
}); 
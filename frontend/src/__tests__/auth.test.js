import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth';
import * as authApi from '../api/auth';

// Mock API functions
jest.mock('../api/auth', () => ({
  login: jest.fn(),
  verifyToken: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: jest.fn(),
  isAdmin: jest.fn(),
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    // Mocks are already cleared in setupTests.js
    // Just need to configure specific mock behaviors for this test
  });

  describe('Initial State', () => {
    it('should initialize with null user when no token exists', async () => {
      localStorage.getItem.mockReturnValue(null);
      authApi.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useAuth());

      // Wait for initial loading to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should initialize with user data when token exists', async () => {
      localStorage.getItem.mockReturnValue('valid-token');
      authApi.isAuthenticated.mockReturnValue(true);
      authApi.verifyToken.mockResolvedValue({
        valid: true,
        user: {
          id: 'testuser',
          email: 'test@example.com',
          authority: '3',
        },
      });

      const { result } = renderHook(() => useAuth());

      // Wait for initial loading to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

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
          authority: 3,
        },
      };

      authApi.login.mockResolvedValue(mockLoginResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login({
          id: 'testuser',
          password: 'password123',
        });
      });

      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'new-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('userId', 'testuser');
      expect(localStorage.setItem).toHaveBeenCalledWith('userEmail', 'test@example.com');
      expect(localStorage.setItem).toHaveBeenCalledWith('userAuthority', 3);
      expect(result.current.user).toEqual({
        id: 'testuser',
        email: 'test@example.com',
        authority: 3,
      });
      expect(window.dispatchEvent).toHaveBeenCalledWith(expect.any(Event));
    });

    it('should handle login error', async () => {
      const mockError = new Error('Invalid credentials');
      authApi.login.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.login({
            id: 'testuser',
            password: 'wrongpassword',
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

      expect(authApi.logout).toHaveBeenCalled();
      expect(result.current.user).toBe(null);
      expect(result.current.error).toBe(null);
      expect(window.dispatchEvent).toHaveBeenCalledWith(expect.any(Event));
    });
  });

  describe('Token Validation', () => {
    it('should validate token successfully', async () => {
      localStorage.getItem.mockReturnValue('valid-token');
      authApi.isAuthenticated.mockReturnValue(true);
      authApi.verifyToken.mockResolvedValue({
        valid: true,
        user: {
          id: 'testuser',
          email: 'test@example.com',
          authority: '3',
        },
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
      localStorage.getItem.mockReturnValue('invalid-token');
      authApi.isAuthenticated.mockReturnValue(true);
      authApi.verifyToken.mockResolvedValue({
        valid: false,
        error: 'Token expired',
      });

      const { result } = renderHook(() => useAuth());

      // Wait for initial validation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(authApi.verifyToken).toHaveBeenCalled();
      expect(authApi.logout).toHaveBeenCalled();
      expect(result.current.user).toBe(null);
    });
  });
});

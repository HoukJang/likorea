import apiClient from '../api/client';

describe('ApiClient', () => {
  beforeEach(() => {
    // Set default test token for most tests
    localStorage.getItem.mockReturnValue('test-token');
  });

  describe('Token Management', () => {
    it('should not include token in headers (httpOnly cookie)', () => {
      const headers = apiClient.getDefaultHeaders();

      // httpOnly 쿠키로 전환되어 Authorization 헤더가 없어야 함
      expect(headers.Authorization).toBeUndefined();
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should not include token in headers when token does not exist', () => {
      localStorage.getItem.mockReturnValue(null);

      const headers = apiClient.getDefaultHeaders();

      expect(headers.Authorization).toBeUndefined();
      expect(headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Token Expiration Handling', () => {
    it('should handle token expiration error and logout', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        headers: {
          get: () => 'application/json',
        },
        json: () =>
          Promise.resolve({
            error: '토큰이 만료되었습니다.',
          }),
      };

      global.fetch.mockResolvedValue(mockResponse);

      try {
        await apiClient.get('/api/boards');
      } catch (error) {
        // Expected error
      }

      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('userId');
      expect(localStorage.removeItem).toHaveBeenCalledWith('userEmail');
      expect(localStorage.removeItem).toHaveBeenCalledWith('userAuthority');
      expect(window.dispatchEvent).toHaveBeenCalledWith(new Event('logout'));
      expect(window.alert).toHaveBeenCalledWith(
        '로그인 세션이 만료되었습니다. 다시 로그인해주세요.'
      );
    });

    it('should handle invalid token error', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        headers: {
          get: () => 'application/json',
        },
        json: () =>
          Promise.resolve({
            error: '유효하지 않은 토큰입니다.',
          }),
      };

      global.fetch.mockResolvedValue(mockResponse);

      try {
        await apiClient.get('/api/boards');
      } catch (error) {
        // Expected error
      }

      expect(localStorage.removeItem).toHaveBeenCalled();
      expect(window.dispatchEvent).toHaveBeenCalledWith(new Event('logout'));
    });

    it('should handle authentication required error', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        headers: {
          get: () => 'application/json',
        },
        json: () =>
          Promise.resolve({
            error: '인증 토큰이 필요합니다.',
          }),
      };

      global.fetch.mockResolvedValue(mockResponse);

      try {
        await apiClient.get('/api/boards');
      } catch (error) {
        // Expected error
      }

      expect(localStorage.removeItem).toHaveBeenCalled();
      expect(window.dispatchEvent).toHaveBeenCalledWith(new Event('logout'));
    });

    it('should redirect to login page for protected routes', async () => {
      global.window.location.pathname = '/boards/new';

      const mockResponse = {
        ok: false,
        status: 401,
        headers: {
          get: () => 'application/json',
        },
        json: () =>
          Promise.resolve({
            error: '토큰이 만료되었습니다.',
          }),
      };

      global.fetch.mockResolvedValue(mockResponse);

      try {
        await apiClient.get('/api/boards');
      } catch (error) {
        // Expected error
      }

      expect(window.location.href).toBe('/login');
    });

    it('should not redirect for public routes', async () => {
      global.window.location.pathname = '/';

      const mockResponse = {
        ok: false,
        status: 401,
        headers: {
          get: () => 'application/json',
        },
        json: () =>
          Promise.resolve({
            error: '토큰이 만료되었습니다.',
          }),
      };

      global.fetch.mockResolvedValue(mockResponse);

      try {
        await apiClient.get('/api/boards');
      } catch (error) {
        // Expected error
      }

      expect(window.location.href).toBe('');
    });
  });

  describe('API Requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: () => Promise.resolve({ success: true, data: [] }),
      };

      global.fetch.mockResolvedValue(mockResponse);

      const result = await apiClient.get('/api/boards');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/boards'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include', // httpOnly 쿠키 사용
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      // Authorization 헤더는 검증하지 않음 (httpOnly 쿠키 사용)
      expect(result.success).toBe(true);
    });

    it('should make successful POST request with JSON body', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: () => Promise.resolve({ success: true }),
      };

      global.fetch.mockResolvedValue(mockResponse);

      const postData = { title: 'Test Post', content: 'Test Content' };
      await apiClient.post('/api/boards', postData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/boards'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });
});

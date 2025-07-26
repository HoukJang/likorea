import apiClient from '../api/client';

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.getItem.mockReturnValue('test-token');
    localStorage.setItem.mockImplementation(() => {});
    localStorage.removeItem.mockImplementation(() => {});
    global.fetch.mockClear();
  });

  describe('Token Management', () => {
    it('should include token in headers when token exists', () => {
      const headers = apiClient.getDefaultHeaders();

      expect(headers.Authorization).toBe('Bearer test-token');
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
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
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

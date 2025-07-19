import { BACKEND_URL } from '../config';
import { handleApiError } from '../utils/errorHandler';

/**
 * 공통 API 클라이언트
 * 모든 API 호출을 통합하고 인증 토큰 자동 첨부, 에러 처리 통합
 */
class ApiClient {
  constructor() {
    this.baseURL = BACKEND_URL;
  }

  /**
   * 인증 토큰 가져오기
   */
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  /**
   * 기본 헤더 생성
   */
  getDefaultHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * API 요청 실행
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} options - fetch 옵션
   * @returns {Promise} API 응답
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getDefaultHeaders(),
      ...options,
    };

    // body가 객체인 경우 JSON으로 변환
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      // 응답이 JSON이 아닌 경우 처리
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const error = new Error(data.message || `API 요청 실패: ${response.status}`);
        error.response = response;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * GET 요청
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * POST 요청
   */
  async post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
      ...options,
    });
  }

  /**
   * PUT 요청
   */
  async put(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
      ...options,
    });
  }

  /**
   * DELETE 요청
   */
  async delete(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      body: data,
      ...options,
    });
  }

  /**
   * PATCH 요청
   */
  async patch(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data,
      ...options,
    });
  }
}

// 싱글톤 인스턴스 생성
const apiClient = new ApiClient();

export default apiClient; 
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
   * 토큰 만료 감지 및 자동 로그아웃
   */
  handleTokenExpiration() {
    console.log('토큰이 만료되었습니다. 자동 로그아웃을 실행합니다.');
    
    // 사용자에게 알림
    if (typeof window !== 'undefined' && window.alert) {
      alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
    }
    
    // 로컬스토리지에서 인증 정보 제거
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userAuthority');
    
    // 로그아웃 이벤트 발생
    window.dispatchEvent(new Event('logout'));
    
    // 현재 페이지가 로그인이 필요한 페이지인 경우 로그인 페이지로 리다이렉트
    const currentPath = window.location.pathname;
    const loginRequiredPaths = ['/boards/new', '/boards/edit', '/admin', '/profile'];
    
    if (loginRequiredPaths.some(path => currentPath.includes(path))) {
      window.location.href = '/login';
    }
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
        // 토큰 만료 에러 처리
        if (response.status === 401 && data.error && 
            (data.error.includes('토큰이 만료되었습니다') || 
             data.error.includes('유효하지 않은 토큰입니다') ||
             data.error.includes('인증 토큰이 필요합니다'))) {
          this.handleTokenExpiration();
        }
        
        const errorMessage = data.error || data.message || `API 요청 실패: ${response.status}`;
        const error = new Error(errorMessage);
        error.response = response;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      // 네트워크 에러나 기타 에러에서도 토큰 만료 확인
      if (error.message && 
          (error.message.includes('토큰이 만료되었습니다') || 
           error.message.includes('유효하지 않은 토큰입니다') ||
           error.message.includes('인증 토큰이 필요합니다'))) {
        this.handleTokenExpiration();
      }
      
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
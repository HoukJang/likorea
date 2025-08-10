import apiClient from './client';

/**
 * 인증 관련 API 함수들
 */

/**
 * 사용자 로그인
 * @param {Object} credentials - 로그인 정보 { id, password }
 * @returns {Promise} 로그인 결과
 */
export const login = async credentials => {
  return apiClient.post('/api/users/login', credentials);
};

/**
 * 사용자 회원가입
 * @param {Object} userData - 회원가입 정보
 * @returns {Promise} 회원가입 결과
 */
export const signup = async userData => {
  return apiClient.post('/api/users', userData);
};

/**
 * 사용자 정보 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise} 사용자 정보
 */
export const getUser = async userId => {
  return apiClient.get(`/api/users/${userId}`);
};

/**
 * 사용자 정보 수정
 * @param {string} userId - 사용자 ID
 * @param {Object} userData - 수정할 사용자 정보
 * @returns {Promise} 수정 결과
 */
export const updateUser = async (userId, userData) => {
  return apiClient.put(`/api/users/${userId}`, userData);
};

/**
 * 사용자 삭제
 * @param {string} userId - 사용자 ID
 * @returns {Promise} 삭제 결과
 */
export const deleteUser = async userId => {
  return apiClient.delete(`/api/users/${userId}`);
};

/**
 * 토큰 검증
 * @returns {Promise} 검증 결과
 */
export const verifyToken = async () => {
  return apiClient.get('/api/users/verify');
};

/**
 * 로그아웃
 */
export const logout = async () => {
  try {
    await apiClient.post('/api/users/logout');
  } catch (error) {
    // 로그아웃 오류는 무시
  }

  // localStorage에서 사용자 정보 제거
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userAuthority');

  // 로그아웃 이벤트 발생
  window.dispatchEvent(new Event('logout'));
};

/**
 * 현재 로그인된 사용자 정보 가져오기
 * 서버에서 현재 사용자 정보를 확인함
 * @returns {Object|null} 사용자 정보 또는 null
 */
export const getCurrentUser = async () => {
  try {
    const response = await verifyToken();
    if (response.valid && response.user) {
      return response.user;
    }
    return null;
  } catch (error) {
    // 서버 검증 실패 시 null 반환
    return null;
  }
};

/**
 * 인증 상태 확인
 * 서버에 토큰 검증 요청을 보내 확인
 * @returns {boolean} 로그인 여부
 */
export const isAuthenticated = async () => {
  try {
    const response = await verifyToken();
    return response.valid === true;
  } catch (error) {
    // 서버 검증 실패 시 false 반환
    return false;
  }
};

/**
 * 관리자 권한 확인
 * @returns {boolean} 관리자 여부
 */
export const isAdmin = async () => {
  try {
    const user = await getCurrentUser();
    return user?.authority === 5 || user?.authority === '5';
  } catch (error) {
    // 서버 검증 실패 시 false 반환
    return false;
  }
};

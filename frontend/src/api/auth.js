import apiClient from './client';

/**
 * 인증 관련 API 함수들
 */

/**
 * 사용자 로그인
 * @param {Object} credentials - 로그인 정보 { id, password }
 * @returns {Promise} 로그인 결과
 */
export const login = async (credentials) => {
  return apiClient.post('/api/users/login', credentials);
};

/**
 * 사용자 회원가입
 * @param {Object} userData - 회원가입 정보
 * @returns {Promise} 회원가입 결과
 */
export const signup = async (userData) => {
  return apiClient.post('/api/users', userData);
};

/**
 * 사용자 정보 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise} 사용자 정보
 */
export const getUser = async (userId) => {
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
export const deleteUser = async (userId) => {
  return apiClient.delete(`/api/users/${userId}`);
};

/**
 * 토큰 검증
 * @param {string} token - 검증할 토큰
 * @returns {Promise} 검증 결과
 */
export const verifyToken = async (token) => {
  return apiClient.post('/api/users/verify-token', { token });
};

/**
 * 로그아웃 (클라이언트 측)
 */
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userAuthority');
  
  // 로그아웃 이벤트 발생
  window.dispatchEvent(new Event('logout'));
};

/**
 * 현재 로그인된 사용자 정보 가져오기
 * @returns {Object|null} 사용자 정보 또는 null
 */
export const getCurrentUser = () => {
  const userId = localStorage.getItem('userId');
  const userEmail = localStorage.getItem('userEmail');
  const userAuthority = localStorage.getItem('userAuthority');
  
  if (!userId) return null;
  
  return {
    id: userId,
    email: userEmail,
    authority: userAuthority,
  };
};

/**
 * 인증 상태 확인
 * @returns {boolean} 로그인 여부
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

/**
 * 관리자 권한 확인
 * @returns {boolean} 관리자 여부
 */
export const isAdmin = () => {
  const authority = localStorage.getItem('userAuthority');
  return authority === '5';
}; 
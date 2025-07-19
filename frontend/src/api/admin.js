import apiClient from './client';

/**
 * 관리자 관련 API 함수들
 */

/**
 * 전체 사용자 목록 조회
 * @returns {Promise} 사용자 목록
 */
export const getAllUsers = async () => {
  return apiClient.get('/api/admin/users');
};

/**
 * 관리자 통계 조회
 * @returns {Promise} 통계 정보
 */
export const getAdminStats = async () => {
  return apiClient.get('/api/admin/stats');
};

/**
 * 게시판 정보 조회
 * @returns {Promise} 게시판 정보
 */
export const getBoardInfo = async () => {
  return apiClient.get('/api/admin/boards');
};

/**
 * 게시판 타입 생성
 * @param {Object} boardTypeData - 게시판 타입 데이터
 * @returns {Promise} 생성된 게시판 타입
 */
export const createBoardType = async (boardTypeData) => {
  return apiClient.post('/api/admin/boards', boardTypeData);
};

/**
 * 사용자 권한 변경
 * @param {string} userId - 사용자 ID
 * @param {number} authority - 새로운 권한 레벨
 * @returns {Promise} 권한 변경 결과
 */
export const updateUserAuthority = async (userId, authority) => {
  return apiClient.put(`/api/admin/users/${userId}/authority`, { authority });
};

/**
 * 사용자 계정 비활성화/활성화
 * @param {string} userId - 사용자 ID
 * @param {boolean} isActive - 활성화 여부
 * @returns {Promise} 상태 변경 결과
 */
export const toggleUserStatus = async (userId, isActive) => {
  return apiClient.put(`/api/admin/users/${userId}/status`, { isActive });
};

/**
 * 게시글 관리 (삭제)
 * @param {string} boardType - 게시판 타입
 * @param {string} postId - 게시글 ID
 * @returns {Promise} 삭제 결과
 */
export const deleteBoardAsAdmin = async (boardType, postId) => {
  return apiClient.delete(`/api/admin/boards/${boardType}/${postId}`);
};

/**
 * 댓글 관리 (삭제)
 * @param {string} boardType - 게시판 타입
 * @param {string} postId - 게시글 ID
 * @param {string} commentId - 댓글 ID
 * @returns {Promise} 삭제 결과
 */
export const deleteCommentAsAdmin = async (boardType, postId, commentId) => {
  return apiClient.delete(`/api/admin/boards/${boardType}/${postId}/comments/${commentId}`);
}; 
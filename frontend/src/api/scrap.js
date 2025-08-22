import apiClient from './client';

/**
 * 스크랩 관련 API 함수들
 */

/**
 * 스크랩 토글 (추가/제거)
 * @param {string} postId - 게시글 ID
 * @returns {Promise} 스크랩 상태 정보
 */
export const toggleScrap = async postId => {
  return apiClient.post(`/api/scraps/toggle/${postId}`);
};

/**
 * 사용자의 스크랩 목록 조회
 * @param {Object} options - 조회 옵션
 * @param {number} options.page - 페이지 번호 (기본값: 1)
 * @param {number} options.limit - 페이지당 항목 수 (기본값: 20)
 * @returns {Promise} 스크랩 목록 및 페이지네이션 정보
 */
export const getUserScraps = async (options = {}) => {
  const { page = 1, limit = 20 } = options;
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  return apiClient.get(`/api/scraps/user?${params.toString()}`);
};

/**
 * 특정 게시글의 스크랩 여부 확인
 * @param {string} postId - 게시글 ID
 * @returns {Promise} 스크랩 여부 정보
 */
export const checkScrapStatus = async postId => {
  return apiClient.get(`/api/scraps/check/${postId}`);
};

/**
 * 특정 게시글의 스크랩 수 조회
 * @param {string} postId - 게시글 ID
 * @returns {Promise} 스크랩 수 정보
 */
export const getScrapCount = async postId => {
  return apiClient.get(`/api/scraps/count/${postId}`);
};

/**
 * 전체 스크랩 목록 조회 (관리자용)
 * @param {Object} options - 조회 옵션
 * @param {number} options.page - 페이지 번호 (기본값: 1)
 * @param {number} options.limit - 페이지당 항목 수 (기본값: 20)
 * @param {string} options.sortBy - 정렬 필드
 * @param {string} options.sortOrder - 정렬 순서 (asc/desc)
 * @returns {Promise} 전체 스크랩 목록 및 페이지네이션 정보
 */
export const getAllScrapsAdmin = async (options = {}) => {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder
  });

  return apiClient.get(`/api/scraps/admin/all?${params.toString()}`);
};
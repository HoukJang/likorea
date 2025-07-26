import apiClient from './client';

/**
 * 태그 관련 API 함수들
 */

/**
 * 모든 활성 태그 조회
 * @returns {Promise} 태그 목록 (카테고리별로 그룹화)
 */
export const getAllTags = async () => {
  try {
    const response = await apiClient.get('/api/tags');
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * 특정 카테고리의 태그 조회
 * @param {string} category - 태그 카테고리 (type, region, category)
 * @returns {Promise} 해당 카테고리의 태그 목록
 */
export const getTagsByCategory = async category => {
  try {
    const response = await apiClient.get(`/api/tags/category/${category}`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * 상위 카테고리별 하위 카테고리 태그 조회
 * @param {string} parentCategory - 상위 카테고리 (공지, 사고팔고, 부동산, 생활정보, 모임, 기타)
 * @returns {Promise} 해당 상위 카테고리의 하위 카테고리 목록
 */
export const getSubCategoriesByParent = async parentCategory => {
  try {
    const response = await apiClient.get(`/api/tags/subcategories/${parentCategory}`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * 관리자: 모든 태그 조회 (활성/비활성 모두)
 * @param {string} category - 필터링할 카테고리 (선택사항)
 * @returns {Promise} 모든 태그 목록
 */
export const getAllTagsForAdmin = async (category = '') => {
  const params = category ? `?category=${category}` : '';
  return apiClient.get(`/api/tags/admin${params}`);
};

/**
 * 관리자: 새 태그 추가
 * @param {Object} tagData - 태그 데이터
 * @returns {Promise} 생성된 태그
 */
export const addTag = async tagData => {
  return apiClient.post('/api/tags', tagData);
};

/**
 * 관리자: 태그 수정
 * @param {string} tagId - 태그 ID
 * @param {Object} tagData - 수정할 태그 데이터
 * @returns {Promise} 수정된 태그
 */
export const updateTag = async (tagId, tagData) => {
  return apiClient.put(`/api/tags/${tagId}`, tagData);
};

/**
 * 관리자: 태그 비활성화
 * @param {string} tagId - 태그 ID
 * @returns {Promise} 비활성화 결과
 */
export const deactivateTag = async tagId => {
  return apiClient.delete(`/api/tags/${tagId}`);
};

/**
 * 관리자: 태그 재활성화
 * @param {string} tagId - 태그 ID
 * @returns {Promise} 재활성화 결과
 */
export const activateTag = async tagId => {
  return apiClient.patch(`/api/tags/${tagId}/activate`);
};

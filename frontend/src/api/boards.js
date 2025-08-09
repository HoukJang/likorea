import apiClient from './client';

/**
 * 게시판 관련 API 함수들
 * API 문서: http://localhost:5001/api-docs
 */

/**
 * 게시글 목록 조회
 * @param {Object} options - 조회 옵션
 * @param {number} options.page - 페이지 번호 (기본값: 1)
 * @param {number} options.limit - 페이지당 항목 수 (기본값: 10)
 * @param {string} options.type - 타입 태그 필터
 * @param {string} options.region - 지역 태그 필터
 * @param {string} options.subcategory - 소주제 필터
 * @param {string} options.search - 검색어
 * @returns {Promise} 게시글 목록
 */
export const getBoards = async (options = {}) => {
  const { page = 1, limit = 10, type, region, subcategory, search } = options;
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  if (type) params.append('type', type);
  if (region) params.append('region', region);
  if (subcategory) params.append('subcategory', subcategory);
  if (search) params.append('search', search);

  return apiClient.get(`/api/boards?${params.toString()}`);
};

/**
 * 게시글 생성
 * @param {Object} boardData - 게시글 데이터
 * @param {string} boardData.title - 게시글 제목
 * @param {string} boardData.content - 게시글 내용
 * @param {Object} boardData.tags - 태그 정보
 * @param {string} boardData.tags.type - 타입 태그
 * @param {string} boardData.tags.region - 지역 태그
 * @returns {Promise} 생성된 게시글
 */
export const createBoard = async boardData => {
  return apiClient.post('/api/boards', {
    title: boardData.title,
    content: boardData.content,
    tags: boardData.tags
  });
};

/**
 * 게시글 수정
 * @param {string} postId - 게시글 ID
 * @param {Object} boardData - 수정할 게시글 데이터
 * @param {string} boardData.title - 게시글 제목
 * @param {string} boardData.content - 게시글 내용
 * @param {Object} boardData.tags - 태그 정보 (선택사항)
 * @returns {Promise} 수정된 게시글
 */
export const updateBoard = async (postId, boardData) => {
  return apiClient.put(`/api/boards/${postId}`, {
    title: boardData.title,
    content: boardData.content,
    tags: boardData.tags
  });
};

/**
 * 게시글 삭제
 * @param {string} postId - 게시글 ID
 * @returns {Promise} 삭제 결과
 */
export const deleteBoard = async postId => {
  return apiClient.delete(`/api/boards/${postId}`);
};

/**
 * 게시글 조회
 * @param {string} postId - 게시글 ID
 * @returns {Promise} 게시글 정보
 */
export const getBoardPost = async postId => {
  return apiClient.get(`/api/boards/${postId}`);
};

/**
 * 댓글 추가
 * @param {string} postId - 게시글 ID
 * @param {Object} commentData - 댓글 데이터
 * @param {string} commentData.content - 댓글 내용
 * @param {string} commentData.parentComment - 부모 댓글 ID (대댓글인 경우)
 * @returns {Promise} 생성된 댓글
 */
export const addComment = async (postId, commentData) => {
  const payload = {
    content: commentData.content
  };

  if (commentData.parentComment) {
    payload.parentComment = commentData.parentComment;
  }

  return apiClient.post(`/api/boards/${postId}/comments`, payload);
};

/**
 * 댓글 수정
 * @param {string} postId - 게시글 ID
 * @param {string} commentId - 댓글 ID
 * @param {Object} commentData - 수정할 댓글 데이터
 * @param {string} commentData.content - 댓글 내용
 * @param {string} commentData.id - 사용자 ID
 * @returns {Promise} 수정된 댓글
 */
export const updateComment = async (postId, commentId, commentData) => {
  return apiClient.put(`/api/boards/${postId}/comments/${commentId}`, {
    content: commentData.content,
    id: commentData.id
  });
};

/**
 * 댓글 삭제
 * @param {string} postId - 게시글 ID
 * @param {string} commentId - 댓글 ID
 * @param {string} userId - 사용자 ID
 * @returns {Promise} 삭제 결과
 */
export const deleteComment = async (postId, commentId, userId) => {
  return apiClient.delete(`/api/boards/${postId}/comments/${commentId}?userId=${userId}`);
};

/**
 * 댓글 목록 조회
 * @param {string} postId - 게시글 ID
 * @returns {Promise} 댓글 목록
 */
export const getComments = async postId => {
  try {
    return await apiClient.get(`/api/boards/${postId}/comments`);
  } catch (error) {
    // 에러 발생 시 빈 댓글 목록 반환
    return { success: true, comments: [] };
  }
};

/**
 * 소주제 정보 조회
 * @param {string} type - 글종류 (선택사항, 없으면 전체 소주제 반환)
 * @returns {Promise} 소주제 정보
 */
export const getSubCategories = async (type = null) => {
  const params = new URLSearchParams();
  if (type) params.append('type', type);

  return apiClient.get(`/api/boards/subcategories?${params.toString()}`);
};

import apiClient from './client';

/**
 * 게시판 관련 API 함수들
 */

/**
 * 게시글 목록 조회
 * @param {string} boardType - 게시판 타입
 * @returns {Promise} 게시글 목록
 */
export const getBoards = async (boardType) => {
  return apiClient.get(`/api/boards/${boardType}`);
};

/**
 * 게시글 생성
 * @param {string} boardType - 게시판 타입
 * @param {Object} boardData - 게시글 데이터
 * @returns {Promise} 생성된 게시글
 */
export const createBoard = async (boardType, boardData) => {
  return apiClient.post(`/api/boards/${boardType}`, boardData);
};

/**
 * 게시글 수정
 * @param {string} boardType - 게시판 타입
 * @param {string} postId - 게시글 ID
 * @param {Object} boardData - 수정할 게시글 데이터
 * @returns {Promise} 수정된 게시글
 */
export const updateBoard = async (boardType, postId, boardData) => {
  return apiClient.put(`/api/boards/${boardType}/${postId}`, boardData);
};

/**
 * 게시글 삭제
 * @param {string} boardType - 게시판 타입
 * @param {string} postId - 게시글 ID
 * @param {string} userId - 사용자 ID
 * @returns {Promise} 삭제 결과
 */
export const deleteBoard = async (boardType, postId, userId) => {
  return apiClient.delete(`/api/boards/${boardType}/${postId}`, { userId });
};

/**
 * 게시글 조회
 * @param {string} boardType - 게시판 타입
 * @param {string} postId - 게시글 ID
 * @returns {Promise} 게시글 정보
 */
export const getBoardPost = async (boardType, postId) => {
  return apiClient.get(`/api/boards/${boardType}/${postId}`);
};

/**
 * 댓글 추가
 * @param {string} boardType - 게시판 타입
 * @param {string} postId - 게시글 ID
 * @param {Object} commentData - 댓글 데이터
 * @returns {Promise} 생성된 댓글
 */
export const addComment = async (boardType, postId, commentData) => {
  return apiClient.post(`/api/boards/${boardType}/${postId}/comments`, {
    content: commentData.content,
    id: commentData.id
  });
};

/**
 * 댓글 수정
 * @param {string} boardType - 게시판 타입
 * @param {string} postId - 게시글 ID
 * @param {string} commentId - 댓글 ID
 * @param {Object} commentData - 수정할 댓글 데이터
 * @returns {Promise} 수정된 댓글
 */
export const updateComment = async (boardType, postId, commentId, commentData) => {
  return apiClient.put(`/api/boards/${boardType}/${postId}/comments/${commentId}`, {
    content: commentData.content,
    id: commentData.id
  });
};

/**
 * 댓글 삭제
 * @param {string} boardType - 게시판 타입
 * @param {string} postId - 게시글 ID
 * @param {string} commentId - 댓글 ID
 * @param {string} userId - 사용자 ID
 * @returns {Promise} 삭제 결과
 */
export const deleteComment = async (boardType, postId, commentId, userId) => {
  return apiClient.delete(`/api/boards/${boardType}/${postId}/comments/${commentId}`, {
    id: userId
  });
};

/**
 * 댓글 목록 조회
 * @param {string} boardType - 게시판 타입
 * @param {string} postId - 게시글 ID
 * @returns {Promise} 댓글 목록
 */
export const getComments = async (boardType, postId) => {
  try {
    return await apiClient.get(`/api/boards/${boardType}/${postId}/comments`);
  } catch (error) {
    console.error('댓글 조회 오류:', error);
    // 에러 발생 시 빈 댓글 목록 반환
    return { comments: [] };
  }
};
import apiClient from './client';

/**
 * 메시지(쪽지) 관련 API 함수들
 */

/**
 * 메시지 전송
 * @param {Object} messageData - 메시지 데이터
 * @param {string} messageData.receiverId - 수신자 ID
 * @param {string} messageData.subject - 제목
 * @param {string} messageData.content - 내용
 * @returns {Promise} 전송된 메시지
 */
export const sendMessage = async messageData => {
  return apiClient.post('/api/messages/send', messageData);
};

/**
 * 받은 메시지함 조회
 * @param {Object} options - 조회 옵션
 * @param {number} options.page - 페이지 번호 (기본값: 1)
 * @param {number} options.limit - 페이지당 항목 수 (기본값: 20)
 * @returns {Promise} 받은 메시지 목록 및 페이지네이션 정보
 */
export const getInbox = async (options = {}) => {
  const { page = 1, limit = 20 } = options;
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  return apiClient.get(`/api/messages/inbox?${params.toString()}`);
};

/**
 * 보낸 메시지함 조회
 * @param {Object} options - 조회 옵션
 * @param {number} options.page - 페이지 번호 (기본값: 1)
 * @param {number} options.limit - 페이지당 항목 수 (기본값: 20)
 * @returns {Promise} 보낸 메시지 목록 및 페이지네이션 정보
 */
export const getSentMessages = async (options = {}) => {
  const { page = 1, limit = 20 } = options;
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  return apiClient.get(`/api/messages/sent?${params.toString()}`);
};

/**
 * 특정 메시지 조회
 * @param {string} messageId - 메시지 ID
 * @returns {Promise} 메시지 상세 정보
 */
export const getMessage = async messageId => {
  return apiClient.get(`/api/messages/${messageId}`);
};

/**
 * 메시지 읽음 처리
 * @param {string} messageId - 메시지 ID
 * @returns {Promise} 처리 결과
 */
export const markAsRead = async messageId => {
  return apiClient.put(`/api/messages/${messageId}/read`);
};

/**
 * 메시지 삭제
 * @param {string} messageId - 메시지 ID
 * @returns {Promise} 처리 결과
 */
export const deleteMessage = async messageId => {
  return apiClient.delete(`/api/messages/${messageId}`);
};

/**
 * 읽지 않은 메시지 수 조회
 * @returns {Promise} 읽지 않은 메시지 수
 */
export const getUnreadCount = async () => {
  return apiClient.get('/api/messages/unread-count');
};

/**
 * 특정 사용자와의 대화 조회
 * @param {string} otherUserId - 대화 상대방 사용자 ID
 * @param {Object} options - 조회 옵션
 * @param {number} options.page - 페이지 번호 (기본값: 1)
 * @param {number} options.limit - 페이지당 항목 수 (기본값: 20)
 * @returns {Promise} 대화 메시지 목록
 */
export const getConversation = async (otherUserId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  return apiClient.get(`/api/messages/conversation/${otherUserId}?${params.toString()}`);
};
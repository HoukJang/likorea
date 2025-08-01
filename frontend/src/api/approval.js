import client from './client';

// 승인 대기 게시글 목록 조회
export const getPendingPosts = async (params = {}) => {
  const response = await client.get('/api/approval/pending', { params });
  return response;
};

// 특정 승인 대기 게시글 조회
export const getPendingPost = async (postId) => {
  const response = await client.get(`/api/approval/pending/${postId}`);
  return response;
};

// 승인 대기 게시글 편집
export const updatePendingPost = async (postId, data) => {
  const response = await client.put(`/api/approval/pending/${postId}`, data);
  return response;
};

// 게시글 승인
export const approvePost = async (postId) => {
  const response = await client.post(`/api/approval/approve/${postId}`);
  return response;
};

// 게시글 거절
export const rejectPost = async (postId, reason = '') => {
  const response = await client.post(`/api/approval/reject/${postId}`, { reason });
  return response;
};

// 일괄 승인
export const approveBatch = async (postIds) => {
  const response = await client.post('/api/approval/approve-batch', { postIds });
  return response;
};
import { BACKEND_URL } from '../config';

export const getBoards = async (boardType) => {
  const response = await fetch(`${BACKEND_URL}/api/boards/${boardType}`);
  if (!response.ok) throw new Error(`게시글 목록 조회 실패: ${response.status}`);
  return response.json();
};

export const createBoard = async (boardType, boardData) => {
  const response = await fetch(`${BACKEND_URL}/api/boards/${boardType}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(boardData)
  });
  if (!response.ok) throw new Error(`게시글 생성 실패: ${response.status}`);
  return response.json();
};

export const updateBoard = async (boardType, postId, boardData) => {
  const response = await fetch(`${BACKEND_URL}/api/boards/${boardType}/${postId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(boardData)
  });
  if (!response.ok) throw new Error(`게시글 수정 실패: ${response.status}`);
  return response.json();
};

export const deleteBoard = async (boardType, postId, userId) => {
  const response = await fetch(`${BACKEND_URL}/api/boards/${boardType}/${postId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  if (!response.ok) throw new Error(`게시글 삭제 실패: ${response.status}`);
  return response.json();
};

export const addComment = async (boardType, postId, commentData) => {
  const response = await fetch(`${BACKEND_URL}/api/boards/${boardType}/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      content: commentData.content,
      id: commentData.id  // 사용자 ID
    })
  });
  if (!response.ok) throw new Error(`댓글 생성 실패: ${response.status}`);
  return response.json();
};

export const updateComment = async (boardType, postId, commentId, commentData) => {
  const response = await fetch(`${BACKEND_URL}/api/boards/${boardType}/${postId}/comments/${commentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: commentData.content,
      id: commentData.id  // 사용자 ID
    })
  });
  if (!response.ok) throw new Error(`댓글 수정 실패: ${response.status}`);
  return response.json();
};

export const deleteComment = async (boardType, postId, commentId, userId) => {
  const response = await fetch(`${BACKEND_URL}/api/boards/${boardType}/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId })
  });
  if (!response.ok) throw new Error(`댓글 삭제 실패: ${response.status}`);
  return response.json();
};

export const getBoardPost = async (boardType, postId) => {
  const response = await fetch(`${BACKEND_URL}/api/boards/${boardType}/${postId}`);
  if (!response.ok) {
    throw new Error(`게시글 조회 실패: ${response.statusText}`);
  }
  return await response.json();
};

export const getUser = async (userId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/${userId}`);
    if (!response.ok) {
      throw new Error('사용자 정보 조회에 실패했습니다.');
    }
    return await response.json();
  } catch (error) {
    console.error('API 오류:', error);
    throw error;
  }
};

export const getComments = async (boardType, postId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/boards/${boardType}/${postId}/comments`);
    if (!response.ok) {
      throw new Error(`댓글 조회 실패: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('댓글 조회 오류:', error);
    // 에러 발생 시 빈 댓글 목록 반환
    return { comments: [] };
  }
};
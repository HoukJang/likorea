import client from './client';

// Claude 모델 목록 조회
export const getClaudeModels = async () => {
  const response = await client.get('/api/bots/models');
  return response;
};

// 봇 목록 조회
export const getBots = async () => {
  const response = await client.get('/api/bots');
  return response;
};

// 봇 상세 조회
export const getBot = async (botId) => {
  const response = await client.get(`/api/bots/${botId}`);
  return response;
};

// 봇 생성
export const createBot = async (botData) => {
  const response = await client.post('/api/bots', botData);
  return response;
};

// 봇 수정
export const updateBot = async (botId, botData) => {
  const response = await client.put(`/api/bots/${botId}`, botData);
  return response;
};

// 봇 삭제
export const deleteBot = async (botId, deletePosts = false) => {
  const response = await client.delete(`/api/bots/${botId}?deletePosts=${deletePosts}`);
  return response;
};

// 봇 설정 업데이트
export const updateBotSettings = async (botId, settings) => {
  const response = await client.patch(`/api/bots/${botId}/settings`, settings);
  return response;
};

// 봇 상태 변경
export const updateBotStatus = async (botId, status) => {
  const response = await client.patch(`/api/bots/${botId}/status`, { status });
  return response;
};

// 봇으로 게시글 작성
export const createBotPost = async (botId, task, additionalPrompt = '') => {
  const response = await client.post('/api/bots/post', {
    botId,
    task,
    additionalPrompt
  });
  return response;
};
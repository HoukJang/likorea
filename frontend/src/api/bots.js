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
  // 프론트엔드 형식을 백엔드 형식으로 변환
  const formattedData = {
    name: botData.name,
    description: botData.description,
    type: botData.type,
    aiModel: botData.aiModel,
    systemPrompt: botData.systemPrompt,
    userPrompt: botData.userPrompt,
    apiSettings: botData.apiSettings,
    persona: botData.persona,
    settings: botData.settings
  };

  const response = await client.post('/api/bots', formattedData);
  return response;
};

// 봇 수정
export const updateBot = async (botId, botData) => {
  // 프론트엔드 형식을 백엔드 형식으로 변환
  const formattedData = {
    name: botData.name,
    description: botData.description,
    type: botData.type,
    status: botData.status,
    aiModel: botData.aiModel,
    systemPrompt: botData.systemPrompt,
    userPrompt: botData.userPrompt,
    apiSettings: botData.apiSettings,
    persona: botData.persona,
    settings: botData.settings
  };

  const response = await client.put(`/api/bots/${botId}`, formattedData);
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

// 봇 작업 상태 리셋
export const resetBotTask = async (botId) => {
  const response = await client.patch(`/api/bots/${botId}/reset-task`);
  return response;
};

// 봇으로 게시글 작성
export const createBotPost = async (botId, task, additionalPrompt = '') => {
  const response = await client.post('/api/bots/post', {
    botId,
    task,
    additionalPrompt
  });

  // 프롬프트 정보 로그 (개발 환경에서만 prompts 필드가 존재)
  if (process.env.NODE_ENV === 'development') {
    if (response.prompts) {
      console.log('\n🤖 AI 프롬프트 정보');
      console.log('===============================');
      console.log('모델:', response.prompts.model);
      console.log('제공자:', response.prompts.provider);
      console.log('\n📝 System Prompt:');
      console.log(response.prompts.systemPrompt);
      console.log('\n💬 User Prompt:');
      console.log(response.prompts.userPrompt);
      console.log('===============================\n');
      console.log('💰 예상 비용: $' + (response.estimatedCost || 0).toFixed(4));
      console.log('📊 토큰 사용량:', response.usage);
    } else {
      console.log('✅ 게시글 생성 성공');
      console.log('💰 예상 비용: $' + (response.estimatedCost || 0).toFixed(4));
      console.log('📊 토큰 사용량:', response.usage);
    }
  }

  return response;
};

// 봇 작업 상태 조회
export const getBotTaskStatus = async (botId) => {
  const response = await client.get(`/api/bots/${botId}/task-status`);
  return response;
};

// 봇의 최근 게시글 조회 (메뉴 이미지 포함)
export const getBotLatestPost = async (botId) => {
  const response = await client.get(`/api/bots/${botId}/latest-post`);
  return response;
};
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const Bot = require('../models/Bot');
const User = require('../models/User');
const BoardPost = require('../models/BoardPost');
const Anthropic = require('@anthropic-ai/sdk');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const newsAggregatorService = require('../services/newsAggregatorService');

// Claude 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 디버그 로거
const debug = process.env.NODE_ENV === 'development' ? console.log : () => {};

// Claude 모델 정보
const CLAUDE_MODELS = [
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude 4 Opus (최강)',
    description: '최고 성능 코딩 모델, 200K 출력 지원',
    costPer1kTokens: { input: 0.015, output: 0.075 },
    maxOutput: 200000,
    supportThinking: true,
    betaHeader: 'interleaved-thinking-2025-05-14' // Claude 4 모델용 확장된 사고 기능
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude 4 Sonnet',
    description: '하이브리드 추론, 사고 과정 표시',
    costPer1kTokens: { input: 0.003, output: 0.015 },
    maxOutput: 8192,
    supportThinking: true,
    betaHeader: 'interleaved-thinking-2025-05-14' // Claude 4 모델용 확장된 사고 기능
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    description: '128K 출력 지원 (베타)',
    costPer1kTokens: { input: 0.003, output: 0.015 },
    maxOutput: 128000,
    supportThinking: true,
    betaHeader: 'output-128k-2025-02-19'
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: '균형잡힌 성능',
    costPer1kTokens: { input: 0.003, output: 0.015 },
    maxOutput: 8192,
    supportThinking: false
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    description: '빠르고 경제적',
    costPer1kTokens: { input: 0.0008, output: 0.004 },
    maxOutput: 4096,
    supportThinking: false
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    description: '가장 경제적',
    costPer1kTokens: { input: 0.00025, output: 0.00125 },
    maxOutput: 4096,
    supportThinking: false
  }
];

// 사용 가능한 Claude 모델 목록 조회 (관리자만)
router.get('/models', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({
      models: CLAUDE_MODELS,
      default: 'claude-3-haiku-20240307'
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ 
      error: '모델 목록을 불러오는데 실패했습니다',
      details: error.message 
    });
  }
});

// 봇 목록 조회 (관리자만)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const bots = await Bot.find()
      .select('-persona.likoreaAccount.password') // 비밀번호 제외
      .sort({ createdAt: -1 });
    
    // 각 봇의 통계 정보 추가
    const botsWithStats = await Promise.all(bots.map(async (bot) => {
      const postCount = await BoardPost.countDocuments({ 
        botId: bot._id 
      });
      const pendingCount = await BoardPost.countDocuments({ 
        botId: bot._id,
        isApproved: false 
      });
      
      return {
        ...bot.toObject(),
        stats: {
          ...bot.stats,
          totalPosts: postCount,
          pendingPosts: pendingCount
        },
        taskStatus: bot.taskStatus,
        currentTask: bot.currentTask
      };
    }));
    
    res.json({ bots: botsWithStats });
  } catch (error) {
    console.error('Error fetching bots:', error);
    res.status(500).json({ 
      error: '봇 목록을 불러오는데 실패했습니다',
      details: error.message 
    });
  }
});

// 비동기 게시글 생성 함수
async function generatePostAsync(bot, task, additionalPrompt, adminUserId) {
  try {
    // 봇 상태를 'generating'으로 업데이트
    bot.taskStatus = 'generating';
    bot.currentTask = {
      description: task,
      startedAt: new Date()
    };
    await bot.save();

    // 봇의 계정 정보 확인
    if (!bot.persona || !bot.persona.likoreaAccount) {
      throw new Error('봇의 계정 정보가 설정되지 않았습니다');
    }

    // 봇 계정으로 사용자 찾기 또는 생성
    let botUser = await User.findOne({ id: bot.persona.likoreaAccount.username });
    
    if (!botUser) {
      // 봇 사용자 계정 생성
      botUser = await User.create({
        id: bot.persona.likoreaAccount.username,
        email: bot.persona.likoreaAccount.email,
        password: bot.persona.likoreaAccount.password,
        authority: 3, // 일반 사용자 권한
      });
    }

    // 프롬프트 구성
    let systemPrompt = bot.prompt?.system || `당신은 롱아일랜드 한인 커뮤니티의 활발한 회원입니다.

응답 형식:
제목: [게시글 제목]
내용: [게시글 내용]`;
    
    // 페르소나 정보 추가 (시스템 프롬프트에)
    if (bot.persona) {
      const personaInfo = [];
      if (bot.persona.age) personaInfo.push(`${bot.persona.age}살`);
      if (bot.persona.occupation) personaInfo.push(bot.persona.occupation);
      if (bot.persona.personality) personaInfo.push(bot.persona.personality);
      if (bot.persona.location) personaInfo.push(`${bot.persona.location} 거주`);
      
      if (personaInfo.length > 0 || bot.persona.interests?.length > 0) {
        systemPrompt += '\n\n'
        if (personaInfo.length > 0) {
          systemPrompt += `당신은 ${personaInfo.join(', ')}인 ${bot.name}입니다.`;
        }
        if (bot.persona.interests?.length > 0) {
          systemPrompt += ` 관심사: ${bot.persona.interests.join(', ')}.`;
        }
      }
    }
    
    // 현재 뉴욕 시간 가져오기
    const nyTime = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    const nyDate = new Date().toLocaleString("ko-KR", { 
      timeZone: "America/New_York",
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    
    // 뉴스봇 전용 처리
    let userPrompt;
    const isNewsBot = bot.type === 'news' || 
                      bot.subType === 'news' || 
                      (bot.name && bot.name.includes('뉴스'));
    
    if (isNewsBot) {
      // 주차 계산 (월의 몇 번째 주인지)
      const month = nyTime.getMonth() + 1;
      const day = nyTime.getDate();
      const weekOfMonth = Math.floor((day - 1) / 7) + 1;
      
      // task에서 지역 추출 (예: "Great Neck 뉴스", "Manhasset", "Flushing" 등)
      // "/" 로 구분된 여러 지역 지원 (예: "Great Neck/Flushing/Manhasset")
      // task가 없거나 비어있으면 기본값 사용
      let targetLocations = ['Long Island']; // 기본값
      
      if (task && task.trim()) {
        // task에서 "뉴스" 단어 제거하고 지역명만 추출
        const cleanTask = task.replace(/뉴스/gi, '').trim();
        
        if (cleanTask) {
          // "/" 로 구분된 여러 지역 파싱
          targetLocations = cleanTask.split('/').map(loc => loc.trim()).filter(loc => loc);
          
          // 비어있는 경우 기본값 사용
          if (targetLocations.length === 0) {
            targetLocations = ['Long Island'];
          }
        }
      }
      
      // 실제 뉴스 데이터 크롤링
      debug(`🔍 실제 뉴스 데이터 수집 중... (지역: ${targetLocations.join(', ')})`);
      try {
        // 전체 기사 추출 옵션 결정 (봇 설정 또는 환경 변수)
        const extractFullArticles = bot.apiSettings?.extractFullArticles || 
                                   process.env.EXTRACT_FULL_ARTICLES === 'true' || 
                                   false; // 기본값: false (성능 고려)
        
        const newsData = await newsAggregatorService.aggregateWeeklyNews(targetLocations, {
          extractFullArticles: extractFullArticles,
          maxFullArticles: bot.apiSettings?.maxFullArticles || 7
        });
        const newsPrompt = newsAggregatorService.formatForClaudePrompt(newsData);
        
        debug(`✅ 실제 뉴스 ${newsData.selectedArticles}개 수집 완료 (전체 ${newsData.totalArticles}개)`);
        
        userPrompt = `현재 날짜: ${nyDate} (뉴욕 시간)
제목: ${month}월 ${weekOfMonth}째주 ${targetLocation} 뉴스

아래 실제 뉴스들을 요약해주세요:

${newsPrompt}

응답 형식:
제목: [게시글 제목]
내용: [게시글 내용]`;
      } catch (error) {
        console.error('뉴스 크롤링 실패:', error);
        // 크롤링 실패 시 폴백 메시지
        userPrompt = `현재 날짜는 ${nyDate} (뉴욕 시간)입니다.
정확히 계산하면 ${month}월 ${weekOfMonth}째주입니다.

뉴스 데이터를 가져오는데 일시적인 문제가 발생했습니다.
대신 이번 주 지역 커뮤니티에서 일반적으로 관심을 가질만한 주제들에 대해 안내문을 작성해주세요.
(실제 뉴스가 아님을 명시해주세요)

제목: ${month}월 ${weekOfMonth}째주 Great Neck·Manhasset 커뮤니티 소식
    
응답 형식:
제목: [게시글 제목]
내용: [게시글 내용]`;
      }
    } else {
      // 일반 봇용 프롬프트
      userPrompt = `현재 날짜는 ${nyDate} (뉴욕 시간)입니다. 다음 주제로 롱아일랜드 한인 커뮤니티에 게시글을 작성해주세요: ${task}
    
요구사항:
1. 제목은 40자 이내로 간결하게
2. 내용은 친근하고 자연스러운 한국어로
3. 롱아일랜드 지역 특성을 반영
4. 자연스럽고 진정성 있는 커뮤니티 구성원의 목소리로 작성

응답 형식:
제목: [게시글 제목]
내용: [게시글 내용]`;
    }

    // 유저 프롬프트 구성
    let combinedUserPrompt = bot.prompt?.user || '';
    
    // 기본 유저 프롬프트가 있으면 추가
    if (combinedUserPrompt) {
      combinedUserPrompt += '\n\n';
    }
    
    // 주제와 추가 요청사항 추가
    combinedUserPrompt += userPrompt;
    if (additionalPrompt) {
      combinedUserPrompt += `\n\n추가 요청사항: ${additionalPrompt}`;
    }
    
    // 디버그 로깅: Claude API 요청 전
    debug('\n=== Claude API 요청 준비 ===');
    debug('봇 정보:', {
      name: bot.name,
      type: bot.type,
      subType: bot.subType,
      model: bot.aiModel,
      isNewsBot
    });
    debug('\nAPI 설정:', {
      maxTokens: bot.apiSettings?.maxTokens || 800,
      temperature: bot.apiSettings?.temperature || 0.8,
      topP: bot.apiSettings?.topP || 0.95,
      topK: bot.apiSettings?.topK || 0,
      enableThinking: bot.apiSettings?.enableThinking || false
    });
    debug('\n[System Prompt]\n', systemPrompt);
    debug('\n[User Prompt]\n', combinedUserPrompt);
    debug('========================\n');
    
    // Claude API 호출 준비
    // 뉴스봇은 더 많은 토큰이 필요함 (여러 뉴스 요약)
    const defaultMaxTokens = isNewsBot ? 2000 : 800;
    
    const apiParams = {
      model: bot.aiModel || "claude-3-haiku-20240307",
      max_tokens: bot.apiSettings?.maxTokens || defaultMaxTokens,
      temperature: bot.apiSettings?.temperature || 0.8,
      system: systemPrompt,
      messages: [
        { role: "user", content: combinedUserPrompt }
      ]
    };
    
    // top_p, top_k 추가 (값이 있을 때만)
    if (bot.apiSettings?.topP !== undefined && bot.apiSettings.topP !== 0.95) {
      apiParams.top_p = bot.apiSettings.topP;
    }
    if (bot.apiSettings?.topK !== undefined && bot.apiSettings.topK !== 0) {
      apiParams.top_k = bot.apiSettings.topK;
    }
    
    // 베타 헤더 추가 (확장된 사고 기능 등)
    const headers = {};
    const modelConfig = CLAUDE_MODELS.find(m => m.id === bot.aiModel);
    
    // 확장된 사고 기능 활성화 체크
    // Claude 4 모델에서만 interleaved-thinking 지원
    if (bot.apiSettings?.enableThinking && modelConfig?.supportThinking) {
      headers['anthropic-beta'] = 'interleaved-thinking-2025-05-14';
      debug('확장된 사고 기능 활성화: interleaved-thinking-2025-05-14');
    } 
    // 모델별 기본 베타 헤더 (thinking이 활성화되지 않은 경우)
    else if (modelConfig?.betaHeader && !bot.apiSettings?.enableThinking) {
      headers['anthropic-beta'] = modelConfig.betaHeader;
      debug(`모델 기본 베타 헤더 사용: ${modelConfig.betaHeader}`);
    }
    
    // 사용자 정의 베타 헤더 (주의: 잘못된 헤더 값은 API 오류 발생)
    // thinking-2025-05-14 같은 잘못된 값 필터링
    if (bot.apiSettings?.betaHeaders) {
      bot.apiSettings.betaHeaders.forEach((value, key) => {
        if (key === 'anthropic-beta' && value.includes('thinking-2025-05-14')) {
          // 잘못된 thinking 헤더를 올바른 값으로 교정
          headers[key] = 'interleaved-thinking-2025-05-14';
          debug('잘못된 thinking 헤더 자동 교정: thinking-2025-05-14 → interleaved-thinking-2025-05-14');
        } else if (key === 'anthropic-beta' && headers['anthropic-beta']) {
          // 기존 베타 헤더가 있으면 병합
          headers[key] = `${headers[key]},${value}`;
        } else {
          headers[key] = value;
        }
      });
    }
    
    // 디버그 로깅: API 호출 직전
    debug('\n=== Claude API 호출 ===');
    debug('API 파라미터:', JSON.stringify(apiParams, null, 2));
    debug('헤더:', headers);
    
    // Claude API 호출
    let message;
    let generatedTitle;
    let generatedContent;
    let usage = {};
    
    try {
      const startTime = Date.now();
      
      if (Object.keys(headers).length > 0) {
        message = await anthropic.messages.create(apiParams, { headers });
      } else {
        message = await anthropic.messages.create(apiParams);
      }
      
      const responseTime = Date.now() - startTime;
      
      // 디버그 로깅: API 응답
      debug('\n=== Claude API 응답 ===');
      debug(`응답 시간: ${responseTime}ms`);
      debug('사용량:', {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
        total_tokens: message.usage.input_tokens + message.usage.output_tokens
      });
      
      // 사고 과정이 있는 경우
      if (message.thinking) {
        debug('\n[사고 과정]\n', message.thinking);
      }
      
      const response = message.content[0].text;
      debug('\n[원본 응답]\n', response.substring(0, 500) + (response.length > 500 ? '...' : ''));
      
      // 응답에서 제목과 내용 파싱
      const titleMatch = response.match(/제목:\s*(.+)/);
      const contentMatch = response.match(/내용:\s*([\s\S]+)/);
      
      generatedTitle = titleMatch ? titleMatch[1].trim() : task.substring(0, 50);
      generatedContent = contentMatch ? contentMatch[1].trim() : response;
      
      debug('\n[파싱 결과]');
      debug('제목:', generatedTitle);
      debug('내용 길이:', generatedContent.length + '자');
      debug('========================\n');
      
      // Claude 사용량 정보
      usage = {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens,
        model: bot.aiModel,
        responseTime
      };
      
    } catch (apiError) {
      console.error('Claude API 호출 오류:', apiError);
      debug('\nAPI 오류 상세:', {
        message: apiError.message,
        status: apiError.status,
        type: apiError.type
      });
      throw apiError;
    }

    // HTML 형식으로 변환
    {
      // 뉴스봇의 경우 URL을 링크로 변환
      if (isNewsBot) {
        generatedContent = generatedContent
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            // URL을 실제 링크로 변환
            const urlPattern = /\[?(https?:\/\/[^\s\]]+)\]?/g;
            line = line.replace(urlPattern, '<a href="$1" target="_blank">$1</a>');
            return `<p>${line}</p>`;
          })
          .join('\n');
      } else {
        // 일반 봇의 경우 기존 로직 유지
        generatedContent = generatedContent
          .split('\n')
          .filter(line => line.trim())
          .map(line => `<p>${line}</p>`)
          .join('\n');
      }
    }

    // 봇 서명 생성
    const botInfo = [];
    if (bot.persona?.age) botInfo.push(`${bot.persona.age}살`);
    if (bot.persona?.occupation) botInfo.push(bot.persona.occupation);
    const signature = botInfo.length > 0 ? `${bot.name} (${botInfo.join(' ')})` : bot.name;
    
    // 봇 서명 추가
    generatedContent += `\n<p><br></p>\n<p><em>- ${signature}</em></p>`;

    // 게시글 작성 (승인 대기 상태로)
    const post = await BoardPost.create({
      title: generatedTitle,
      content: generatedContent,
      tags: {
        type: bot.settings.targetCategories[0] || '기타',
        region: '0'
      },
      author: botUser._id,
      modifiedAt: new Date(),
      isBot: true,
      botId: bot._id,
      isApproved: false // 봇 게시글은 승인 대기
    });

    // 봇 통계 업데이트
    bot.lastActivity = new Date();
    bot.stats.postsCreated += 1;
    bot.stats.lastPostDate = new Date();
    bot.taskStatus = 'completed';
    bot.currentTask.completedAt = new Date();
    await bot.save();

    console.log(`✅ 봇 ${bot.name}의 게시글 생성 완료: ${post.title}`);

  } catch (error) {
    console.error('봇 게시글 생성 실패:', error);
    
    // 에러 상태로 업데이트
    bot.taskStatus = 'failed';
    bot.currentTask.completedAt = new Date();
    bot.currentTask.error = error.message;
    await bot.save();
  }
}

// 봇으로 게시글 작성 (관리자만) - 비동기 처리
router.post('/post', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { botId, task, additionalPrompt } = req.body;
    
    if (!botId || !task) {
      return res.status(400).json({ 
        error: '봇 ID와 작업 내용을 입력해주세요' 
      });
    }

    // 봇 찾기
    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ error: '봇을 찾을 수 없습니다' });
    }

    // 이미 작업 중인지 확인
    if (bot.taskStatus === 'generating') {
      return res.status(400).json({ 
        error: '이미 게시글을 생성 중입니다',
        currentTask: bot.currentTask
      });
    }

    // 비동기로 게시글 생성 시작
    generatePostAsync(bot, task, additionalPrompt, req.user._id);

    // 즉시 응답 반환
    res.json({
      success: true,
      message: '봇이 게시글을 작성하기 시작했습니다',
      bot: {
        name: bot.name,
        taskStatus: 'generating',
        currentTask: {
          description: task,
          startedAt: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error executing bot task:', error);
    res.status(500).json({ 
      error: '봇 작업 실행에 실패했습니다',
      details: error.message 
    });
  }
});

// 봇 상세 조회 (관리자만)
router.get('/:botId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { botId } = req.params;
    
    const bot = await Bot.findById(botId)
      .select('-persona.likoreaAccount.password');
      
    if (!bot) {
      return res.status(404).json({ error: '봇을 찾을 수 없습니다' });
    }
    
    // 봇의 최근 게시글
    const recentPosts = await BoardPost.find({ botId: bot._id })
      .select('title postNumber isApproved createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      bot,
      recentPosts
    });
  } catch (error) {
    console.error('Error fetching bot details:', error);
    res.status(500).json({ 
      error: '봇 정보를 불러오는데 실패했습니다',
      details: error.message 
    });
  }
});

// 봇 수정 (관리자만)
router.put('/:botId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { botId } = req.params;
    const { 
      name, 
      description, 
      systemPrompt, 
      userPrompt,
      aiModel, 
      status,
      type,
      apiSettings 
    } = req.body;
    
    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ error: '봇을 찾을 수 없습니다' });
    }
    
    // 업데이트할 필드
    if (name) bot.name = name;
    if (description) bot.description = description;
    if (systemPrompt !== undefined) bot.prompt.system = systemPrompt;
    if (userPrompt !== undefined) bot.prompt.user = userPrompt;
    if (aiModel) bot.aiModel = aiModel;
    if (status) bot.status = status;
    if (type) bot.type = type;
    
    // API 설정 업데이트
    if (apiSettings) {
      bot.apiSettings = {
        ...bot.apiSettings.toObject ? bot.apiSettings.toObject() : bot.apiSettings,
        ...apiSettings
      };
    }
    
    await bot.save();
    
    res.json({
      success: true,
      message: '봇 정보가 수정되었습니다',
      bot
    });
  } catch (error) {
    console.error('Error updating bot:', error);
    res.status(500).json({ 
      error: '봇 수정에 실패했습니다',
      details: error.message 
    });
  }
});

// 봇 삭제 (관리자만)
router.delete('/:botId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { botId } = req.params;
    
    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ error: '봇을 찾을 수 없습니다' });
    }
    
    // 봇이 작성한 게시글 처리 (삭제 또는 보존 선택 가능)
    const postsCount = await BoardPost.countDocuments({ botId: bot._id });
    
    if (postsCount > 0) {
      // 봇 삭제 시 게시글 처리 옵션
      const { deletePosts } = req.query;
      
      if (deletePosts === 'true') {
        await BoardPost.deleteMany({ botId: bot._id });
      } else {
        // 게시글은 보존하되 봇 연결 해제
        await BoardPost.updateMany(
          { botId: bot._id },
          { $unset: { botId: 1 }, isBot: false }
        );
      }
    }
    
    // 봇 사용자 계정 삭제
    if (bot.username) {
      await User.deleteOne({ id: bot.username });
    }
    
    // 봇 삭제
    await bot.deleteOne();
    
    res.json({
      success: true,
      message: '봇이 삭제되었습니다',
      deletedPostsCount: postsCount
    });
  } catch (error) {
    console.error('Error deleting bot:', error);
    res.status(500).json({ 
      error: '봇 삭제에 실패했습니다',
      details: error.message 
    });
  }
});

// 봇 생성 (관리자만)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      type, 
      aiModel, 
      systemPrompt, 
      userPrompt,
      apiSettings,
      persona 
    } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ error: '봇 이름과 설명은 필수입니다' });
    }
    
    // 봇 아이디 생성 (이름 기반)
    const username = name.toLowerCase().replace(/\s+/g, '_') + '_bot';
    
    // 이메일 및 비밀번호 자동 생성
    const email = `${username}@likorea-bot.com`;
    const password = crypto.randomBytes(12).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 봇 사용자 계정 생성
    const botUser = await User.create({
      id: username,
      email,
      password: hashedPassword,
      authority: 3, // 일반 사용자 권한
      profile: {
        nickname: name,
        bio: `${name} 봇입니다.`
      }
    });
    
    // 기본 시스템 프롬프트
    const defaultSystemPrompt = `당신은 롱아일랜드 한인 커뮤니티의 활발한 회원입니다.

응답 형식:
제목: [게시글 제목]
내용: [게시글 내용]`;
    
    // 봇 생성 데이터 준비
    const botData = {
      name,
      description,
      username,
      type: type || 'poster',
      status: 'inactive',
      aiModel: aiModel || 'claude-3-haiku-20240307',
      persona: {
        ...persona,
        likoreaAccount: {
          username,
          email,
          password // 원본 비밀번호 저장
        }
      },
      prompt: {
        system: systemPrompt || defaultSystemPrompt,
        user: userPrompt || ''
      }
    };
    
    // API 설정 추가 (전달된 경우)
    if (apiSettings) {
      botData.apiSettings = apiSettings;
    }
    
    // 봇 생성
    const bot = await Bot.create(botData);
    
    res.status(201).json({
      success: true,
      message: '봇이 생성되었습니다',
      bot: {
        ...bot.toObject(),
        accountInfo: {
          username,
          email,
          temporaryPassword: password // 초기 비밀번호 한 번만 보여줌
        }
      }
    });
  } catch (error) {
    console.error('Error creating bot:', error);
    res.status(500).json({ 
      error: '봇 생성에 실패했습니다',
      details: error.message 
    });
  }
});

// 봇 설정 업데이트 (관리자만)
router.patch('/:botId/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { botId } = req.params;
    const { aiModel, settings, apiSettings } = req.body;
    
    const updateData = {};
    if (aiModel && CLAUDE_MODELS.find(m => m.id === aiModel)) {
      updateData.aiModel = aiModel;
    }
    if (settings) {
      updateData.settings = { ...settings };
    }
    if (apiSettings) {
      updateData.apiSettings = apiSettings;
    }
    
    const bot = await Bot.findByIdAndUpdate(
      botId,
      updateData,
      { new: true }
    );
    
    if (!bot) {
      return res.status(404).json({ error: '봇을 찾을 수 없습니다' });
    }
    
    res.json({
      success: true,
      message: '봇 설정이 업데이트되었습니다',
      bot
    });
  } catch (error) {
    console.error('Error updating bot settings:', error);
    res.status(500).json({ 
      error: '봇 설정 업데이트에 실패했습니다',
      details: error.message 
    });
  }
});

// 봇 작업 상태 조회 (관리자만)
router.get('/:botId/task-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { botId } = req.params;
    
    const bot = await Bot.findById(botId)
      .select('taskStatus currentTask');
      
    if (!bot) {
      return res.status(404).json({ error: '봇을 찾을 수 없습니다' });
    }
    
    res.json({
      taskStatus: bot.taskStatus,
      currentTask: bot.currentTask
    });
  } catch (error) {
    console.error('Error fetching bot task status:', error);
    res.status(500).json({ 
      error: '봇 작업 상태 조회에 실패했습니다',
      details: error.message 
    });
  }
});

// 봇 상태 변경 (관리자만)
router.patch('/:botId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { botId } = req.params;
    const { status } = req.body;
    
    if (!['active', 'inactive', 'maintenance'].includes(status)) {
      return res.status(400).json({ error: '유효하지 않은 상태입니다' });
    }
    
    const bot = await Bot.findByIdAndUpdate(
      botId,
      { status },
      { new: true }
    );
    
    if (!bot) {
      return res.status(404).json({ error: '봇을 찾을 수 없습니다' });
    }
    
    res.json({
      success: true,
      message: '봇 상태가 변경되었습니다',
      bot
    });
  } catch (error) {
    console.error('Error updating bot status:', error);
    res.status(500).json({ 
      error: '봇 상태 변경에 실패했습니다',
      details: error.message 
    });
  }
});

// 뉴스 소스 상태 확인 (관리자 전용)
router.get('/news/sources/health', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const sourcesHealth = await newsAggregatorService.checkSourcesHealth();
    
    res.json({
      success: true,
      sources: sourcesHealth,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('뉴스 소스 상태 확인 실패:', error);
    res.status(500).json({
      error: '뉴스 소스 상태 확인에 실패했습니다',
      details: error.message
    });
  }
});

// 뉴스 캐시 클리어 (관리자 전용)
router.post('/news/cache/clear', authenticateToken, requireAdmin, async (req, res) => {
  try {
    newsAggregatorService.clearCache();
    
    res.json({
      success: true,
      message: '뉴스 캐시가 초기화되었습니다',
      clearedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('캐시 초기화 실패:', error);
    res.status(500).json({
      error: '캐시 초기화에 실패했습니다',
      details: error.message
    });
  }
});

// 뉴스 미리보기 (관리자 전용)
router.get('/news/preview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { location = 'Great Neck·Manhasset' } = req.query;
    const newsData = await newsAggregatorService.aggregateWeeklyNews(location);
    
    res.json({
      success: true,
      totalArticles: newsData.totalArticles,
      selectedArticles: newsData.selectedArticles,
      categorized: newsData.categorized,
      topNews: newsData.articles.slice(0, 5), // 상위 5개만
      generatedAt: newsData.generatedAt
    });
  } catch (error) {
    console.error('뉴스 미리보기 실패:', error);
    res.status(500).json({
      error: '뉴스 미리보기 생성에 실패했습니다',
      details: error.message
    });
  }
});

module.exports = router;
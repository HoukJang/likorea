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
const restaurantAnalyzerService = require('../services/restaurantAnalyzerService');
const menuExtractionService = require('../services/menuExtractionService');
const menuEnrichmentService = require('../services/menuEnrichmentService');
const AdminNotification = require('../models/AdminNotification');

// Claude 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
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
async function generatePostAsync(bot, task, additionalPrompt, _adminUserId) {
  console.log(`🤖 [${new Date().toLocaleTimeString()}] 봇 게시글 생성 시작:`, {
    botName: bot.name,
    botId: bot._id,
    task: task,
    hasPersona: !!bot.persona,
    hasLikoreaAccount: !!(bot.persona && bot.persona.likoreaAccount)
  });

  try {
    // 봇 상태를 'generating'으로 업데이트
    bot.taskStatus = 'generating';
    bot.currentTask = {
      description: task,
      startedAt: new Date()
    };
    await bot.save();

    // 봇의 계정 정보 확인 및 생성
    let botUser;

    if (bot.persona && bot.persona.likoreaAccount && bot.persona.likoreaAccount.username) {
      // 새로운 방식: persona.likoreaAccount에 정보가 있는 경우
      botUser = await User.findOne({ id: bot.persona.likoreaAccount.username });

      if (!botUser) {
        // 봇 사용자 계정 생성
        botUser = await User.create({
          id: bot.persona.likoreaAccount.username,
          email: bot.persona.likoreaAccount.email,
          password: bot.persona.likoreaAccount.password,
          authority: 3 // 일반 사용자 권한
        });
      }
    } else {
      // 레거시 봇을 위한 자동 계정 생성
      console.log('⚠️ 레거시 봇 감지, 자동 계정 생성:', bot.name);

      // 고유한 사용자명 생성
      const username = `${bot.name.toLowerCase().replace(/\s+/g, '_')}_bot_${bot._id.toString().substr(-6)}`;
      const email = `${username}@likorea-bot.com`;
      const hashedPassword = await bcrypt.hash(crypto.randomBytes(12).toString('hex'), 10);

      // 기존 사용자 확인
      botUser = await User.findOne({ id: username });

      if (!botUser) {
        botUser = await User.create({
          id: username,
          email: email,
          password: hashedPassword,
          authority: 3,
          profile: {
            nickname: bot.name,
            bio: `${bot.name} 봇입니다.`
          }
        });
        console.log('✅ 봇 계정 생성 완료:', username);
      }

      // 봇의 persona 정보 업데이트
      if (!bot.persona) {
        bot.persona = {};
      }
      bot.persona.likoreaAccount = {
        username: username,
        email: email,
        password: hashedPassword
      };
      await bot.save();
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
        systemPrompt += '\n\n';
        if (personaInfo.length > 0) {
          systemPrompt += `당신은 ${personaInfo.join(', ')}인 ${bot.name}입니다.`;
        }
        if (bot.persona.interests?.length > 0) {
          systemPrompt += ` 관심사: ${bot.persona.interests.join(', ')}.`;
        }
      }
    }

    // 현재 뉴욕 시간 가져오기
    const nyTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const nyDate = new Date().toLocaleString('ko-KR', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    // 이미지 데이터를 전체 스코프에서 선언 (맛집봇용)
    let dishImages = [];

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

        debug('📊 전체 기사 추출 설정:');
        debug(`  - bot.apiSettings?.extractFullArticles: ${bot.apiSettings?.extractFullArticles}`);
        debug(`  - env.EXTRACT_FULL_ARTICLES: ${process.env.EXTRACT_FULL_ARTICLES}`);
        debug(`  - 최종 extractFullArticles: ${extractFullArticles}`);
        debug(`  - maxFullArticles: ${bot.apiSettings?.maxFullArticles || 7}`);

        const newsData = await newsAggregatorService.aggregateWeeklyNews(targetLocations, {
          extractFullArticles: extractFullArticles,
          maxFullArticles: bot.apiSettings?.maxFullArticles || 7
        });
        const newsPrompt = newsAggregatorService.formatForClaudePrompt(newsData);

        debug(`✅ 실제 뉴스 ${newsData.selectedArticles}개 수집 완료 (전체 ${newsData.totalArticles}개)`);

        // DB에 저장된 user prompt 사용 또는 기본 템플릿
        const userPromptTemplate = bot.prompt?.user ||
          `현재 날짜: {CURRENT_DATE}
지역: {LOCATION}

아래는 {MONTH}월 {WEEK_OF_MONTH}째주의 주요 뉴스입니다:

{NEWS_DATA}

위 뉴스들을 바탕으로 한인 커뮤니티를 위한 주간 뉴스 요약 게시글을 작성해주세요.
중요한 지역 소식, 비즈니스 정보, 학교 소식 등을 포함하여 유익하고 읽기 쉽게 정리해주세요.

응답 형식:
제목: [게시글 제목]
내용: [게시글 내용]`;

        // 템플릿 변수 치환
        const currentDateTime = `${nyDate} ${nyTime.toLocaleTimeString('ko-KR', {
          timeZone: 'America/New_York',
          hour: '2-digit',
          minute: '2-digit'
        })} (뉴욕 시간)`;

        userPrompt = userPromptTemplate
          .replace(/{CURRENT_DATE}/g, currentDateTime)
          .replace(/{LOCATION}/g, targetLocations.join(' · '))
          .replace(/{MONTH}/g, month.toString())
          .replace(/{WEEK_OF_MONTH}/g, weekOfMonth.toString())
          .replace(/{NEWS_DATA}/g, newsPrompt);
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
    } else if (bot.type === 'restaurant' || bot.subType === 'restaurant' || (bot.name && bot.name.includes('맛집'))) {
      // 맛집봇 전용 처리
      debug('🍽️ 맛집봇 작업 시작...');

      // dishImages는 이미 상위 스코프에서 선언됨

      // task에서 레스토랑 정보 추출 (예: "Sichuan Garden, 2077 Nesconset Hwy, Stony Brook")
      // 형식: "레스토랑명, 주소" 또는 "레스토랑명 주소"
      let restaurantName = '';
      let restaurantAddress = '';

      if (task && task.trim()) {
        const parts = task.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          restaurantName = parts[0];
          restaurantAddress = parts.slice(1).join(', ');
        } else {
          // 쉼표가 없는 경우 첫 단어를 레스토랑명으로 간주
          const words = task.trim().split(' ');
          if (words.length > 1) {
            restaurantName = words[0];
            restaurantAddress = words.slice(1).join(' ');
          } else {
            restaurantName = task.trim();
            restaurantAddress = 'Stony Brook, NY'; // 기본 지역
          }
        }
      }

      if (!restaurantName) {
        throw new Error('레스토랑 이름을 입력해주세요');
      }

      try {
        debug(`🔍 레스토랑 정보 수집: ${restaurantName} at ${restaurantAddress}`);

        // 새로운 Restaurant Analyzer Service 사용 (Google Places API 기반)
        const analysisResult = await restaurantAnalyzerService.analyzeRestaurant(restaurantName, restaurantAddress);

        debug('✅ 레스토랑 분석 완료');
        debug(`📊 기본 정보: ${analysisResult.restaurant.name}, 평점: ${analysisResult.restaurant.rating}`);
        debug(`🍽️ 추천 메뉴: ${analysisResult.recommendedMenuItems.map(item => item.name).join(', ')}`);
        debug(`📸 사진: 외관 ${analysisResult.photos.exterior ? '✓' : '✗'}, 음식 ${analysisResult.photos.food.length}장`);

        // 이미지 데이터 준비 (Claude가 한글로 변환할 때 사용) - 이미 위에서 선언됨
        // dishImages 초기화
        for (const item of analysisResult.recommendedMenuItems) {
          if (item.photo) {
            dishImages.push({
              dish: item.name,
              imageUrl: item.photo.url || item.photo,
              isReference: item.photo.confidence < 0.7 // 낮은 신뢰도는 참고 이미지로 표시
            });
            debug(`📸 메뉴 이미지: ${item.name} - 신뢰도: ${item.confidence * 100}%`);
          }
        }

        // 외관 사진도 추가
        if (analysisResult.photos.exterior) {
          dishImages.push({
            dish: 'Restaurant Exterior',
            imageUrl: analysisResult.photos.exterior,
            isReference: false
          });
        }

        // 음식 사진들도 추가 (최대 2장)
        analysisResult.photos.food.slice(0, 2).forEach((photo, idx) => {
          dishImages.push({
            dish: `Food Photo ${idx + 1}`,
            imageUrl: photo.url,
            isReference: false
          });
        });

        // Step 1: Claude로 메뉴 추출 (1차 호출)
        console.log('🤖 Step 1: Extracting menu items with Claude...');
        const extractedMenus = await menuExtractionService.extractMenuItems(
          analysisResult.rawReviews,
          analysisResult.restaurant.name,
          restaurantAnalyzerService.detectCuisineType(analysisResult.restaurant.types)
        );

        console.log(`✅ Extracted ${extractedMenus.length} menu items`);

        // 모든 메뉴 항목 표시 (순위대로)
        console.log('📊 All menu items by score:');
        extractedMenus.forEach((menu, idx) => {
          console.log(`   ${idx + 1}. ${menu.name} (score: ${menu.score}, mentions: ${menu.mentions})`);
        });

        // Step 2: 상위 5개 메뉴만 데이터 보강 (이미지 검색 최적화)
        console.log('🔧 Step 2: Enriching top 5 menu items...');
        const top5Menus = extractedMenus.slice(0, 5); // 상위 5개만 선택
        console.log(`📋 선택된 메뉴: ${top5Menus.map(m => m.name).join(', ')}`);

        const enrichedMenus = await menuEnrichmentService.enrichMenuData(
          top5Menus, // 상위 5개만 보강
          analysisResult
        );

        console.log(`✅ Enriched ${enrichedMenus.length} menu items`);

        // Step 3: 보강된 데이터로 최종 글 작성 (Claude 2차 호출)
        userPrompt = `You are a 24-year-old Stony Brook University student writing a restaurant review blog post.

Restaurant Information:
- Name: ${analysisResult.restaurant.name}
- Address: ${analysisResult.restaurant.address}
- Rating: ${analysisResult.restaurant.rating}/5 (${analysisResult.restaurant.totalReviews} reviews)
- Price Level: ${analysisResult.restaurant.priceLevel}
- Services: Delivery: ${analysisResult.restaurant.services.delivery ? 'Yes' : 'No'}, Takeout: ${analysisResult.restaurant.services.takeout ? 'Yes' : 'No'}, Dine-in: ${analysisResult.restaurant.services.dineIn ? 'Yes' : 'No'}

ALL ${enrichedMenus.length} MENU ITEMS RANKED BY POPULARITY (Score 0-100):
${enrichedMenus.map((menu, idx) => {
  let label = '';
  if (idx === 0) label = '🥇 #1 BEST SELLER';
  else if (idx === 1) label = '🥈 #2 MUST TRY';
  else if (idx === 2) label = '🥉 #3 HIGHLY RECOMMENDED';
  else if (idx < 5) label = `⭐ #${idx + 1} POPULAR`;
  else label = `#${idx + 1}`;

  return `
${idx + 1}. ${menu.name} ${label}
   - Score: ${menu.score}/100
   - Price: ${menu.enrichedPrice || menu.priceHint || 'Not specified'}
   - Description: ${menu.enrichedDescription || menu.description || ''}
   - Mentioned: ${menu.mentions} times in reviews
   - Sentiment: ${menu.customerSentiment || 'positive'}
   - Portion: ${menu.portionInfo || 'Standard'}
   - Has Image: ${menu.images && menu.images.length > 0 ? 'Yes' : 'No'}`;
}).join('\n')}

AVAILABLE IMAGES:
${enrichedMenus.filter(m => m.images && m.images.length > 0).map(m =>
  `[이미지: ${m.name}] -> Available (${m.images[0].source})`
).join('\n') || 'No images available'}`;

        // dishImages를 enrichedMenus 기반으로 재구성 (모든 이미지 포함)
        dishImages = enrichedMenus
          .filter(menu => menu.images && menu.images.length > 0)
          .map(menu => ({
            dish: menu.name,
            url: menu.images[0].url,
            source: menu.images[0].source,
            confidence: menu.images[0].confidence || 0.5,
            // 모든 대체 이미지들도 포함
            allImages: menu.allImages || []
          }));

        // dishImages를 bot 객체의 임시 속성으로 저장 (나중에 HTML 변환시 사용)
        bot._dishImages = dishImages;

        // 디버그: 프론트엔드에서 이미지 선택 가능하도록 모든 이미지 정보 저장
        bot._allMenuImages = enrichedMenus.map(menu => ({
          dishName: menu.name,
          selectedImage: menu.images && menu.images[0] ? menu.images[0].url : null,
          allAvailableImages: menu.allImages || []
        }));

        console.log('📸 All Menu Images Data:');
        bot._allMenuImages.forEach(menuImg => {
          console.log(`   🍽️ ${menuImg.dishName}:`);
          console.log(`      - Selected: ${menuImg.selectedImage ? 'Yes' : 'No'}`);
          console.log(`      - Available images: ${menuImg.allAvailableImages.length}`);
          if (menuImg.allAvailableImages.length > 0) {
            console.log('      - Image URLs:');
            menuImg.allAvailableImages.slice(0, 3).forEach((img, idx) => {
              console.log(`        ${idx + 1}. ${img.url.substring(0, 50)}...`);
            });
            if (menuImg.allAvailableImages.length > 3) {
              console.log(`        ... and ${menuImg.allAvailableImages.length - 3} more`);
            }
          }
        });

      } catch (error) {
        console.error('레스토랑 정보 수집 실패:', error);
        userPrompt = `현재 날짜는 ${nyDate}입니다. 
"${restaurantName}" 레스토랑에 대한 리뷰를 작성해주세요.
24세 스토니브룩 대학생 관점에서 작성하되, 실제 정보를 확인할 수 없었다고 언급해주세요.

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
    let combinedUserPrompt = userPrompt || '';

    // 추가 요청사항이 있으면 추가
    if (additionalPrompt) {
      combinedUserPrompt += `\n\n추가 요청사항: ${additionalPrompt}`;
    }

    // 프롬프트가 비어있는 경우 방지
    if (!combinedUserPrompt || combinedUserPrompt.trim() === '') {
      console.error('❌ 빈 프롬프트 감지');
      combinedUserPrompt = `현재 날짜는 ${nyDate}입니다. 롱아일랜드 한인 커뮤니티를 위한 게시글을 작성해주세요.
      
응답 형식:
제목: [게시글 제목]
내용: [게시글 내용]`;
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
      model: bot.aiModel || 'claude-3-haiku-20240307',
      max_tokens: bot.apiSettings?.maxTokens || defaultMaxTokens,
      temperature: bot.apiSettings?.temperature || 0.8,
      system: systemPrompt,
      messages: [
        { role: 'user', content: combinedUserPrompt }
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
    let _usage = {};

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
      _usage = {
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

    // HTML 형식으로 변환 (프론트엔드에서 URL 링크 변환 처리)
    generatedContent = generatedContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => `<p>${line}</p>`)
      .join('\n');

    // 맛집봇인 경우 모든 이미지를 게시글에 포함
    if (bot.type === 'restaurant' && bot._allMenuImages && bot._allMenuImages.length > 0) {
      console.log('🖼️ 맛집봇 이미지 처리 시작...');
      console.log(`📋 처리할 메뉴: ${bot._allMenuImages.map(menu => menu.dishName).join(', ')}`);

      // 각 메뉴에 대해 모든 이미지를 추가
      for (const menuItem of bot._allMenuImages) {
        const dishName = menuItem.dishName;
        const allImages = menuItem.allAvailableImages || [];

        if (allImages.length === 0) {
          console.log(`⚠️ ${dishName}에 대한 이미지가 없습니다`);
          continue;
        }

        // [이미지: dishName] 패턴을 찾아서 모든 이미지로 교체
        const patterns = [
          `[이미지: ${dishName}]`,
          `[이미지:${dishName}]`,
          `[이미지 : ${dishName}]`,
          `[이미지: ${dishName} ]`,
          `[ 이미지: ${dishName} ]`
        ];

        let replaced = false;
        for (const pattern of patterns) {
          const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          const matches = generatedContent.match(regex);

          if (matches) {
            // 이미지 링크 목록으로 생성
            let allImagesHtml = '</p>\n<div style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 20px 0; background-color: #f9f9f9;">';
            allImagesHtml += `\n<h4 style="margin-top: 0; color: #333;">${dishName} - 이미지 링크 (${allImages.length}개)</h4>`;
            allImagesHtml += '\n<ol style="margin: 0; padding-left: 20px;">';

            // 모든 이미지 링크 표시
            allImages.forEach((img, _index) => {
              // TikTok 링크는 제외
              if (img.url.includes('tiktok.com') || img.displayLink?.includes('tiktok.com')) {
                return;
              }

              allImagesHtml += '\n<li style="margin-bottom: 8px;">';
              allImagesHtml += `\n  <a href="${img.url}" target="_blank" rel="noopener noreferrer" style="color: #1976d2; text-decoration: none; word-break: break-all;">${img.url}</a>`;
              allImagesHtml += '\n</li>';
            });

            allImagesHtml += '\n</ol>';
            allImagesHtml += '\n</div>\n<p>';

            // 원본 이미지 태그를 모든 이미지로 교체
            generatedContent = generatedContent.replace(regex, allImagesHtml);
            console.log(`✅ ${dishName}: ${allImages.length}개 이미지 추가됨`);
            replaced = true;
            break;
          }
        }

        if (!replaced) {
          // 이미지 태그를 찾지 못한 경우, 메뉴 이름이 언급된 곳 뒤에 이미지 추가
          const menuNameRegex = new RegExp(`(${dishName})`, 'i');
          const menuMatch = generatedContent.match(menuNameRegex);

          if (menuMatch) {
            // 메뉴 이름 뒤에 이미지 링크 목록 추가
            let allImagesHtml = '</p>\n<div style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 20px 0; background-color: #f9f9f9;">';
            allImagesHtml += `\n<h4 style="margin-top: 0; color: #333;">${dishName} - 이미지 링크 (${allImages.length}개)</h4>`;
            allImagesHtml += '\n<ol style="margin: 0; padding-left: 20px;">';

            // 모든 이미지 링크 표시
            allImages.forEach((img, _index) => {
              // TikTok 링크는 제외
              if (img.url.includes('tiktok.com') || img.displayLink?.includes('tiktok.com')) {
                return;
              }

              allImagesHtml += '\n<li style="margin-bottom: 8px;">';
              allImagesHtml += `\n  <a href="${img.url}" target="_blank" rel="noopener noreferrer" style="color: #1976d2; text-decoration: none; word-break: break-all;">${img.url}</a>`;
              allImagesHtml += '\n</li>';
            });

            allImagesHtml += '\n</ol>';
            allImagesHtml += '\n</div>\n<p>';

            // 메뉴 이름이 있는 단락 끝에 이미지 추가
            const paragraphEndRegex = new RegExp(`(${dishName}[^<]*</p>)`, 'i');
            generatedContent = generatedContent.replace(paragraphEndRegex, `$1${allImagesHtml}`);
            console.log(`✅ ${dishName}: 메뉴 언급 뒤에 ${allImages.length}개 이미지 추가됨`);
          } else {
            console.log(`⚠️ ${dishName}: 게시글에서 메뉴 이름을 찾을 수 없음`);
            // 언급되지 않은 메뉴도 게시글 끝에 추가
            if (!generatedContent.includes('📸 추가 메뉴 이미지')) {
              generatedContent += '\n\n<div style="border: 2px solid #ffd54f; border-radius: 8px; padding: 20px; margin: 30px 0; background-color: #fffde7;">';
              generatedContent += '\n<h3 style="margin-top: 0; color: #f57c00;">📸 추가 메뉴 이미지</h3>';
              generatedContent += '\n<p style="color: #666; font-size: 14px;">아래는 이 레스토랑의 다른 인기 메뉴들입니다:</p>';
            }

            generatedContent += '\n<div style="margin-top: 20px;">';
            generatedContent += `\n<h4 style="color: #333; margin-bottom: 10px;">${dishName}</h4>`;
            generatedContent += '\n<ol style="margin: 0; padding-left: 20px;">';

            // 모든 이미지 링크 표시
            allImages.forEach((img, _index) => {
              const scoreColor = img.score > 50 ? '#4CAF50' : img.score > 0 ? '#FF9800' : '#f44336';
              const warnings = img.warnings && img.warnings.length > 0 ? ` ⚠️ ${img.warnings.join(', ')}` : '';

              generatedContent += '\n<li style="margin-bottom: 8px;">';
              generatedContent += `\n  <a href="${img.url}" target="_blank" rel="noopener noreferrer" style="color: #1976d2; text-decoration: none; word-break: break-all;">${img.url}</a>`;
              generatedContent += `\n  <span style="font-size: 12px; color: ${scoreColor}; margin-left: 8px;">(점수: ${img.score})</span>`;
              if (warnings) {
                generatedContent += `\n  <span style="font-size: 12px; color: #ff9800;">${warnings}</span>`;
              }
              generatedContent += `\n  <div style="font-size: 11px; color: #666; margin-top: 2px;">출처: ${img.displayLink || img.source}</div>`;
              generatedContent += '\n</li>';
            });

            generatedContent += '\n</ol>';
            generatedContent += '\n</div>';
          }
        }
      }

      // 추가 메뉴 이미지 섹션이 열려있으면 닫기
      if (generatedContent.includes('📸 추가 메뉴 이미지') && !generatedContent.endsWith('</div>')) {
        generatedContent += '\n</div>';
      }

      console.log('📄 모든 이미지 추가 완료');
    } else {
      if (bot.type === 'restaurant') {
        console.log('⚠️ 맛집봇이지만 이미지 데이터가 없음:', {
          type: bot.type,
          hasAllMenuImages: !!bot._allMenuImages,
          menuImagesLength: bot._allMenuImages?.length || 0
        });
      }
    }

    // 봇 서명 제거됨 - 사용자 요청에 따라 서명 추가하지 않음

    // AI 경고 문구 추가
    if (bot.type === 'restaurant') {
      generatedContent += '\n<p><br></p>\n<p class="bot-disclaimer">';
      generatedContent += '※ 이 리뷰는 AI 봇이 작성한 것으로, 실제 방문 경험과 다를 수 있으며 일부 내용은 사실과 다를 수 있습니다. 참고용으로만 활용해주세요.';
      generatedContent += '</p>';
    } else if (bot.type === 'news') {
      generatedContent += '\n<p><br></p>\n<p class="bot-disclaimer">';
      generatedContent += '※ 이 뉴스 요약은 AI 봇이 작성한 것으로, 실제 뉴스 내용과 다를 수 있으며 일부 해석은 부정확할 수 있습니다. 원문 확인을 권장합니다.';
      generatedContent += '</p>';
    }

    // 게시글 작성 (승인 대기 상태로)
    const postData = {
      title: generatedTitle,
      content: generatedContent,
      tags: {
        type: bot.settings?.targetCategories?.[0] || '기타',
        region: '0'
      },
      author: botUser._id,
      modifiedAt: new Date(),
      isBot: true,
      botId: bot._id,
      isApproved: false // 봇 게시글은 승인 대기
    };

    console.log('📝 게시글 생성 데이터:', {
      title: postData.title,
      isBot: postData.isBot,
      isApproved: postData.isApproved,
      botId: postData.botId,
      tags: postData.tags
    });

    // 맛집봇의 경우 모든 메뉴 이미지 데이터 저장
    if (bot._allMenuImages && bot._allMenuImages.length > 0) {
      postData.menuImages = bot._allMenuImages;
    }

    const post = await BoardPost.create(postData);

    console.log(`✅ 봇 ${bot.name}의 게시글 생성 완료:`, {
      postId: post._id,
      postNumber: post.postNumber,
      title: post.title,
      isApproved: post.isApproved
    });

    // 봇 통계 업데이트
    bot.lastActivity = new Date();
    bot.stats.postsCreated += 1;
    bot.stats.lastPostDate = new Date();
    bot.taskStatus = 'completed';
    bot.currentTask.completedAt = new Date();
    await bot.save();

  } catch (error) {
    console.error('❌ 봇 게시글 생성 실패:', {
      botName: bot.name,
      error: error.message,
      stack: error.stack,
      task: bot.currentTask?.description
    });

    // 에러 상태로 업데이트
    bot.taskStatus = 'failed';
    bot.currentTask.completedAt = new Date();
    bot.currentTask.error = error.message;
    
    // 원본 작업 정보 보존 (재시도를 위해)
    if (!bot.currentTask.originalTask) {
      bot.currentTask.originalTask = {
        description: bot.currentTask.description,
        additionalPrompt: bot.currentTask.additionalPrompt
      };
    }
    bot.currentTask.retryCount = (bot.currentTask.retryCount || 0);
    
    await bot.save();

    // 관리자 알림 생성
    try {
      await AdminNotification.create({
        type: 'bot_failure',
        severity: error.message.includes('Overloaded') ? 'medium' : 'high',
        title: `봇 작업 실패: ${bot.name}`,
        message: `작업 "${bot.currentTask?.description}"이(가) 실패했습니다.\n에러: ${error.message}`,
        botId: bot._id,
        metadata: {
          botName: bot.name,
          task: bot.currentTask?.description,
          error: error.message,
          errorStack: error.stack,
          timestamp: new Date(),
          retryCount: bot.currentTask.retryCount
        }
      });
      console.log('📧 관리자 알림 생성됨');
    } catch (notifyError) {
      console.error('알림 생성 실패:', notifyError);
    }
  }
}

// 봇으로 게시글 작성 (관리자만) - 비동기 처리
router.post('/post', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { botId, task, additionalPrompt } = req.body;

    // botId만 필수, task는 빈 문자열 허용 (undefined/null은 불가)
    if (!botId || task === undefined || task === null) {
      return res.status(400).json({
        error: '봇 ID와 작업 내용을 입력해주세요'
      });
    }

    // 봇 찾기
    const bot = await Bot.findById(botId);
    if (!bot) {
      console.log('❌ 봇을 찾을 수 없음:', botId);
      return res.status(404).json({ error: '봇을 찾을 수 없습니다' });
    }

    console.log('📋 봇 정보:', {
      name: bot.name,
      type: bot.type,
      hasPersona: !!bot.persona,
      personaKeys: bot.persona ? Object.keys(bot.persona) : []
    });

    // 이미 작업 중인지 확인
    if (bot.taskStatus === 'generating') {
      return res.status(400).json({
        error: '이미 게시글을 생성 중입니다',
        currentTask: bot.currentTask
      });
    }

    // 비동기로 게시글 생성 시작
    generatePostAsync(bot, task, additionalPrompt, req.user._id);

    // 즉시 응답 반환 (맛집봇의 경우 이미지 데이터도 포함)
    const response = {
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
    };

    // 맛집봇의 경우 모든 메뉴 이미지 데이터 포함
    if (bot._allMenuImages) {
      response.menuImages = bot._allMenuImages;
    }

    res.json(response);
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
      apiSettings,
      persona,
      settings
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

    // 페르소나 업데이트 (계정 정보는 제외)
    if (persona) {
      const existingAccount = bot.persona?.likoreaAccount;
      bot.persona = {
        ...persona,
        likoreaAccount: existingAccount // 기존 계정 정보 유지
      };
    }

    // 스케줄링 설정 업데이트
    if (settings) {
      bot.settings = {
        ...bot.settings.toObject ? bot.settings.toObject() : bot.settings,
        ...settings
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
      persona,
      settings
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
    const _botUser = await User.create({
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

    // 스케줄링 설정 추가 (전달된 경우)
    if (settings) {
      botData.settings = settings;
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

    // 작업이 완료된 경우 최근 게시글 정보도 포함
    let latestPost = null;
    let menuImages = null;

    if (bot.taskStatus === 'completed') {
      // 최근 생성된 게시글 찾기
      latestPost = await BoardPost.findOne({ botId: bot._id })
        .sort({ createdAt: -1 })
        .select('_id title postNumber createdAt')
        .limit(1);

      // 맛집봇의 경우 이미지 데이터 추가 (임시 저장된 데이터에서)
      if (bot._allMenuImages) {
        menuImages = bot._allMenuImages;
      }
    }

    res.json({
      taskStatus: bot.taskStatus,
      currentTask: bot.currentTask,
      latestPost: latestPost,
      menuImages: menuImages // 모든 메뉴 이미지 데이터
    });
  } catch (error) {
    console.error('Error fetching bot task status:', error);
    res.status(500).json({
      error: '봇 작업 상태 조회에 실패했습니다',
      details: error.message
    });
  }
});

// 봇 작업 상태 리셋 (관리자만)
router.patch('/:botId/reset-task', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { botId } = req.params;
    
    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ error: '봇을 찾을 수 없습니다' });
    }

    // taskStatus를 idle로 리셋
    bot.taskStatus = 'idle';
    bot.currentTask = {
      description: null,
      startedAt: null,
      completedAt: null,
      error: null
    };
    
    await bot.save();

    res.json({
      success: true,
      message: '봇 작업 상태가 리셋되었습니다',
      bot: {
        name: bot.name,
        taskStatus: bot.taskStatus,
        currentTask: bot.currentTask
      }
    });
  } catch (error) {
    console.error('Error resetting bot task status:', error);
    res.status(500).json({
      error: '봇 작업 상태 리셋에 실패했습니다',
      details: error.message
    });
  }
});

// 실패한 작업 재시도 (관리자만)
router.post('/:botId/retry', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { botId } = req.params;
    
    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ error: '봇을 찾을 수 없습니다' });
    }

    // 실패 상태인 경우만 재시도 가능
    if (bot.taskStatus !== 'failed') {
      return res.status(400).json({ 
        error: '실패한 작업만 재시도할 수 있습니다',
        currentStatus: bot.taskStatus 
      });
    }

    // 원본 작업 정보 가져오기 (originalTask가 있으면 사용, 없으면 currentTask 사용)
    const taskInfo = bot.currentTask?.originalTask || bot.currentTask;
    const lastTask = taskInfo?.description || '';
    const lastPrompt = taskInfo?.additionalPrompt || '';

    if (!lastTask) {
      return res.status(400).json({ 
        error: '재시도할 작업 정보가 없습니다' 
      });
    }

    // 재시도 횟수 증가
    bot.currentTask.retryCount = (bot.currentTask.retryCount || 0) + 1;
    bot.currentTask.lastRetryAt = new Date();
    
    // 상태를 idle로 리셋하여 작업 시작 가능하게 함
    bot.taskStatus = 'idle';
    await bot.save();

    // 기존 작업을 다시 시작 (비동기)
    generatePostAsync(bot, lastTask, lastPrompt, req.user.userId);

    // 재시도 시작 알림 생성
    await AdminNotification.create({
      type: 'system_alert',
      severity: 'low',
      title: `봇 작업 재시도: ${bot.name}`,
      message: `작업 "${lastTask}"을(를) 재시도합니다. (시도 횟수: ${bot.currentTask.retryCount})`,
      botId: bot._id,
      metadata: {
        botName: bot.name,
        task: lastTask,
        retryCount: bot.currentTask.retryCount,
        timestamp: new Date()
      }
    });

    res.json({
      success: true,
      message: '작업 재시도를 시작했습니다',
      taskDescription: lastTask,
      retryCount: bot.currentTask.retryCount
    });
  } catch (error) {
    console.error('작업 재시도 실패:', error);
    res.status(500).json({
      error: '작업 재시도에 실패했습니다',
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

// 봇의 최근 게시글 조회 (메뉴 이미지 포함) - 관리자 전용
router.get('/:botId/latest-post', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { botId } = req.params;

    // 해당 봇의 가장 최근 게시글 조회
    const latestPost = await BoardPost.findOne({ botId: botId })
      .sort({ createdAt: -1 })
      .populate('author', 'id profile.nickname')
      .populate('botId', 'name type');

    if (!latestPost) {
      return res.status(404).json({
        error: '해당 봇의 게시글을 찾을 수 없습니다'
      });
    }

    // 메뉴 이미지 데이터 디버그
    console.log('📸 Latest Post Menu Images:');
    if (latestPost.menuImages && latestPost.menuImages.length > 0) {
      latestPost.menuImages.forEach(menu => {
        console.log(`   ${menu.dishName}: ${menu.allAvailableImages?.length || 0} images`);
      });
    } else {
      console.log('   No menu images found in post');
    }

    res.json({
      success: true,
      post: {
        _id: latestPost._id,
        postNumber: latestPost.postNumber,
        title: latestPost.title,
        content: latestPost.content,
        author: latestPost.author,
        bot: latestPost.botId,
        createdAt: latestPost.createdAt,
        isApproved: latestPost.isApproved,
        menuImages: latestPost.menuImages || [] // 모든 메뉴 이미지 데이터
      }
    });
  } catch (error) {
    console.error('Error fetching bot latest post:', error);
    res.status(500).json({
      error: '봇 최근 게시글 조회에 실패했습니다',
      details: error.message
    });
  }
});

// 관리자 알림 목록 조회 (관리자만)
router.get('/notifications/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 20, unreadOnly = false } = req.query;
    
    const query = unreadOnly === 'true' ? { isRead: false } : {};
    
    const notifications = await AdminNotification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('botId', 'name type')
      .populate('readBy', 'username');
      
    const unreadCount = await AdminNotification.getUnreadCount();
    
    res.json({
      notifications,
      unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error('알림 조회 실패:', error);
    res.status(500).json({
      error: '알림 조회에 실패했습니다',
      details: error.message
    });
  }
});

// 알림 읽음 처리 (관리자만)
router.patch('/notifications/:notificationId/read', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await AdminNotification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: '알림을 찾을 수 없습니다' });
    }
    
    await notification.markAsRead(req.user.userId);
    const unreadCount = await AdminNotification.getUnreadCount();
    
    res.json({
      success: true,
      notification,
      unreadCount
    });
  } catch (error) {
    console.error('알림 읽음 처리 실패:', error);
    res.status(500).json({
      error: '알림 읽음 처리에 실패했습니다',
      details: error.message
    });
  }
});

// 모든 알림 읽음 처리 (관리자만)
router.patch('/notifications/read-all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await AdminNotification.updateMany(
      { isRead: false },
      {
        isRead: true,
        readAt: new Date(),
        readBy: req.user.userId
      }
    );
    
    res.json({
      success: true,
      message: '모든 알림을 읽음 처리했습니다'
    });
  } catch (error) {
    console.error('알림 읽음 처리 실패:', error);
    res.status(500).json({
      error: '알림 읽음 처리에 실패했습니다',
      details: error.message
    });
  }
});

module.exports = router;
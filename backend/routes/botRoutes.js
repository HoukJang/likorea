const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const Bot = require('../models/Bot');
const User = require('../models/User');
const BoardPost = require('../models/BoardPost');
const Anthropic = require('@anthropic-ai/sdk');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Claude 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Claude 모델 정보
const CLAUDE_MODELS = [
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet (최신)',
    description: '가장 균형잡힌 최신 모델, 우수한 성능과 합리적인 가격',
    costPer1kTokens: { input: 0.003, output: 0.015 }
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku (최신)',
    description: '가장 빠르고 경제적인 최신 모델',
    costPer1kTokens: { input: 0.0008, output: 0.004 }
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    description: '최고 성능, 복잡한 작업에 적합 (비용 높음)',
    costPer1kTokens: { input: 0.015, output: 0.075 }
  },
  {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    description: '균형잡힌 성능과 가격',
    costPer1kTokens: { input: 0.003, output: 0.015 }
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    description: '빠르고 경제적인 모델',
    costPer1kTokens: { input: 0.00025, output: 0.00125 }
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
        }
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

// 봇으로 게시글 작성 (관리자만)
router.post('/post', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { botId, task } = req.body;
    
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

    // 봇의 계정 정보 확인
    if (!bot.persona || !bot.persona.likoreaAccount) {
      return res.status(400).json({ error: '봇의 계정 정보가 설정되지 않았습니다' });
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

    // Claude를 사용하여 게시글 생성
    let generatedTitle;
    let generatedContent;

    try {
      // 봇의 페르소나와 프롬프트를 사용하여 OpenAI에 요청
      const systemPrompt = bot.prompt?.base || `당신은 ${bot.persona.age}살 ${bot.persona.occupation} ${bot.name}입니다. ${bot.persona.personality}`;
      const userPrompt = `다음 주제로 롱아일랜드 한인 커뮤니티에 게시글을 작성해주세요: ${task}
      
요구사항:
1. 제목은 40자 이내로 간결하게
2. 내용은 친근하고 자연스러운 한국어로
3. 롱아일랜드 지역 특성을 반영
4. ${bot.persona.interests ? `관심사(${bot.persona.interests.join(', ')})를 자연스럽게 반영` : ''}

응답 형식:
제목: [게시글 제목]
내용: [게시글 내용]`;

      // 추가 프롬프트 결합
      const additionalPrompt = req.body.additionalPrompt || '';
      const combinedUserPrompt = additionalPrompt ? 
        `${userPrompt}\n\n추가 지시사항: ${additionalPrompt}` : 
        userPrompt;
      
      const message = await anthropic.messages.create({
        model: bot.aiModel || "claude-3-haiku-20240307",
        max_tokens: 800,
        temperature: 0.8,
        system: systemPrompt,
        messages: [
          { role: "user", content: combinedUserPrompt }
        ],
      });

      const response = message.content[0].text;
      
      // 응답에서 제목과 내용 파싱
      const titleMatch = response.match(/제목:\s*(.+)/);
      const contentMatch = response.match(/내용:\s*([\s\S]+)/);
      
      generatedTitle = titleMatch ? titleMatch[1].trim() : task.substring(0, 50);
      generatedContent = contentMatch ? contentMatch[1].trim() : response;

      // HTML 형식으로 변환
      generatedContent = generatedContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => `<p>${line}</p>`)
        .join('\n');

      // 봇 서명 추가
      generatedContent += `\n<p><br></p>\n<p><em>- ${bot.name} (${bot.persona.age}살 ${bot.persona.occupation})</em></p>`;

    } catch (claudeError) {
      console.error('Claude API 오류:', claudeError);
      // Claude 실패 시 기본 방식으로 fallback
      generatedTitle = task.substring(0, 50) + (task.length > 50 ? '...' : '');
      generatedContent = `<p>${task}</p>\n<p><br></p>\n<p><em>- ${bot.name} (${bot.persona.age}살 ${bot.persona.occupation})</em></p>`;
    }

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
    await bot.save();

    res.json({
      success: true,
      message: '봇이 게시글을 작성했습니다 (승인 대기)',
      bot: bot.name,
      post: {
        _id: post._id,
        title: post.title,
        postNumber: post.postNumber
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
    const { name, description, basePrompt, aiModel, status } = req.body;
    
    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ error: '봇을 찾을 수 없습니다' });
    }
    
    // 업데이트할 필드
    if (name) bot.name = name;
    if (description) bot.description = description;
    if (basePrompt) bot.prompt.base = basePrompt;
    if (aiModel) bot.aiModel = aiModel;
    if (status) bot.status = status;
    
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
    const { name, description, type, aiModel, basePrompt } = req.body;
    
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
    
    // 봇 생성
    const bot = await Bot.create({
      name,
      description,
      username,
      type: type || 'poster',
      status: 'inactive',
      aiModel: aiModel || 'claude-3-haiku-20240307',
      persona: {
        likoreaAccount: {
          username,
          email,
          password // 원본 비밀번호 저장 (암호화 필요시 추가 암호화)
        }
      },
      prompt: {
        base: basePrompt || '당신은 롱아일랜드 한인 커뮤니티의 활발한 회원입니다.'
      }
    });
    
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
    const { aiModel, settings } = req.body;
    
    const updateData = {};
    if (aiModel && CLAUDE_MODELS.find(m => m.id === aiModel)) {
      updateData.aiModel = aiModel;
    }
    if (settings) {
      updateData.settings = { ...settings };
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

module.exports = router;
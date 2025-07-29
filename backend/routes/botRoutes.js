const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const Bot = require('../models/Bot');
const User = require('../models/User');
const BoardPost = require('../models/BoardPost');
const OpenAI = require('openai');

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 봇 목록 조회 (관리자만)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 로컬 DB에서 봇 목록 조회
    const bots = await Bot.find().sort({ createdAt: -1 });
    res.json({ bots });
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

    // OpenAI를 사용하여 게시글 생성
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

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 800,
      });

      const response = completion.choices[0].message.content;
      
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

    } catch (openaiError) {
      console.error('OpenAI API 오류:', openaiError);
      // OpenAI 실패 시 기본 방식으로 fallback
      generatedTitle = task.substring(0, 50) + (task.length > 50 ? '...' : '');
      generatedContent = `<p>${task}</p>\n<p><br></p>\n<p><em>- ${bot.name} (${bot.persona.age}살 ${bot.persona.occupation})</em></p>`;
    }

    // 게시글 작성
    const post = await BoardPost.create({
      title: generatedTitle,
      content: generatedContent,
      tags: {
        type: bot.settings.targetCategories[0] || '기타',
        region: '0'
      },
      author: botUser._id,
      modifiedAt: new Date()
    });

    // 봇 통계 업데이트
    bot.lastActivity = new Date();
    bot.stats.postsCreated += 1;
    bot.stats.lastPostDate = new Date();
    await bot.save();

    res.json({
      success: true,
      message: '봇이 게시글을 작성했습니다',
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

// 봇 상태 조회 (관리자만)
router.get('/:botId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { botId } = req.params;
    
    // 로컬 DB에서 봇 상태 조회
    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ error: '봇을 찾을 수 없습니다' });
    }
    
    res.json({
      id: bot._id,
      name: bot.name,
      status: bot.status,
      lastActivity: bot.lastActivity,
      stats: bot.stats
    });
  } catch (error) {
    console.error('Error fetching bot status:', error);
    res.status(500).json({ 
      error: '봇 상태를 불러오는데 실패했습니다',
      details: error.message 
    });
  }
});

// 봇 생성 (관리자만)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, type } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ error: '봇 이름과 설명은 필수입니다' });
    }
    
    const bot = await Bot.create({
      name,
      description,
      type: type || 'poster',
      status: 'inactive'
    });
    
    res.status(201).json({
      success: true,
      message: '봇이 생성되었습니다',
      bot
    });
  } catch (error) {
    console.error('Error creating bot:', error);
    res.status(500).json({ 
      error: '봇 생성에 실패했습니다',
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
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const axios = require('axios');

// 봇 목록 조회 (관리자만) - 임시로 인증 제거
router.get('/bots', async (req, res) => {
  try {
    // 봇 시스템 API 호출
    const response = await axios.get('http://localhost:5002/api/bots/list');
    res.json({ bots: response.data.bots });
  } catch (error) {
    console.error('Error fetching bots:', error);
    res.status(500).json({ 
      error: '봇 목록을 불러오는데 실패했습니다',
      details: error.message 
    });
  }
});

// 봇으로 게시글 작성 (관리자만) - 임시로 인증 제거
router.post('/bots/post', async (req, res) => {
  try {
    const { botId, task } = req.body;
    
    if (!botId || !task) {
      return res.status(400).json({ 
        error: '봇 ID와 작업 내용을 입력해주세요' 
      });
    }

    // 봇 시스템 API 호출
    const response = await axios.post('http://localhost:5002/api/bots/execute', {
      botId,
      task
    });

    res.json({
      success: true,
      result: response.data
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
router.get('/bots/:botId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { botId } = req.params;
    
    // 봇 시스템 API 호출
    const response = await axios.get(`http://localhost:5002/api/bots/${botId}/status`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching bot status:', error);
    res.status(500).json({ 
      error: '봇 상태를 불러오는데 실패했습니다',
      details: error.message 
    });
  }
});

module.exports = router;
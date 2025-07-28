const express = require('express');
const router = express.Router();

class BotWebApi {
  constructor(botManager) {
    this.botManager = botManager;
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    // 봇 목록 조회
    this.router.get('/bots/list', (req, res) => {
      try {
        const bots = this.botManager.getBotList();
        const enrichedBots = bots.map(bot => ({
          id: bot.id,
          name: bot.name,
          status: bot.settings.active ? 'active' : 'inactive',
          lastPost: new Date().toISOString().split('T')[0], // TODO: 실제 마지막 게시일 추적
          persona: bot.persona,
          settings: bot.settings
        }));
        
        res.json({ bots: enrichedBots });
      } catch (error) {
        console.error('[BotWebApi] Error fetching bot list:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // 봇 작업 실행
    this.router.post('/bots/execute', async (req, res) => {
      try {
        const { botId, task } = req.body;
        
        if (!botId || !task) {
          return res.status(400).json({ 
            error: '봇 ID와 작업 내용이 필요합니다.' 
          });
        }

        console.log(`[BotWebApi] Executing task for bot ${botId}: ${task}`);
        
        // 레스토랑 리뷰 봇 처리
        if (botId === 'bot1' && task.includes('맛집')) {
          // Google Maps URL 추출 시도
          const urlMatch = task.match(/https?:\/\/[^\s]+/);
          if (urlMatch) {
            const result = await this.botManager.executeRestaurantReview(
              botId, 
              urlMatch[0], 
              task.replace(urlMatch[0], '').trim()
            );
            return res.json(result);
          }
        }

        // 일반 작업 처리
        const result = await this.botManager.executeTask(botId, task);
        res.json(result);
      } catch (error) {
        console.error('[BotWebApi] Error executing bot task:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // 봇 상태 조회
    this.router.get('/bots/:botId/status', async (req, res) => {
      try {
        const { botId } = req.params;
        const status = await this.botManager.getBotStatus(botId);
        res.json(status);
      } catch (error) {
        console.error('[BotWebApi] Error fetching bot status:', error);
        res.status(500).json({ error: error.message });
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = BotWebApi;
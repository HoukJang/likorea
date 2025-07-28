class SlackService {
  constructor(app, botManager) {
    this.app = app;
    this.botManager = botManager;
  }

  registerCommands() {
    console.log('[SlackService] Registering slash commands...');
    this.app.command('/bot-post', async ({ command, ack, respond }) => {
      await ack();
      
      try {
        const { text } = command;
        const [botId, ...taskParts] = text.split(' ');
        const task = taskParts.join(' ');
        
        if (!botId || !task) {
          await respond('사용법: /bot-post [봇ID] [작업 내용]');
          return;
        }
        
        const result = await this.botManager.executeTask(botId, task);
        await respond(`✅ ${result.botName}이(가) 게시글을 작성했습니다!\n제목: ${result.title}`);
      } catch (error) {
        await respond(`❌ 오류: ${error.message}`);
      }
    });

    this.app.command('/bot-restaurant', async ({ command, ack, respond, say }) => {
      console.log('[/bot-restaurant] Command received:', command.text);
      
      try {
        await ack();
        console.log('[/bot-restaurant] Command acknowledged');
        
        const { text } = command;
        const match = text.match(/^(\S+)\s+(https:\/\/.*google\.com\/maps.*|https:\/\/maps\.google\.com.*|https:\/\/goo\.gl\/maps.*)(?:\s+(.+))?$/i);
        
        if (!match) {
          console.log('[/bot-restaurant] Invalid format:', text);
          await respond({
            text: '사용법: /bot-restaurant [봇ID] [Google Maps URL] [추가 설명(선택)]\n예시: /bot-restaurant bot1 https://maps.google.com/maps/place/... "친구들과 방문"',
            response_type: 'ephemeral'
          });
          return;
        }
        
        const [, botId, googleMapsUrl, additionalInfo] = match;
        console.log('[/bot-restaurant] Parsed:', { botId, googleMapsUrl, additionalInfo });
        
        // 초기 응답
        await respond({
          text: `🍴 ${botId} 봇이 맛집 정보를 수집하고 있습니다...\n이 작업은 1-2분 정도 소요될 수 있습니다.`,
          response_type: 'in_channel'
        });
        
        // 비동기 작업 실행
        setTimeout(async () => {
          try {
            const result = await this.botManager.executeRestaurantReview(botId, googleMapsUrl, additionalInfo);
            
            await say({
              text: `✅ ${result.botName}이(가) 맛집 리뷰를 작성했습니다!\n제목: ${result.title}\n\n사진 ${result.imageCount}개를 포함해 게시했습니다.`,
              channel: command.channel_id
            });
          } catch (error) {
            console.error('[/bot-restaurant] Error:', error);
            await say({
              text: `❌ 오류가 발생했습니다: ${error.message}`,
              channel: command.channel_id
            });
          }
        }, 100);
        
      } catch (error) {
        console.error('[/bot-restaurant] Fatal error:', error);
        await respond({
          text: `❌ 명령어 처리 중 오류가 발생했습니다: ${error.message}`,
          response_type: 'ephemeral'
        });
      }
    });

    this.app.command('/bot-list', async ({ ack, respond }) => {
      await ack();
      
      const bots = this.botManager.getBotList();
      const botList = bots.map(bot => 
        `• ${bot.name} (${bot.id}) - ${bot.persona.occupation}, ${bot.settings.boardType} 게시판`
      ).join('\n');
      
      await respond(`📋 활성화된 봇 목록:\n${botList}`);
    });

    this.app.command('/bot-status', async ({ command, ack, respond }) => {
      await ack();
      
      const { text: botId } = command;
      
      if (!botId) {
        await respond('사용법: /bot-status [봇ID]');
        return;
      }
      
      try {
        const status = await this.botManager.getBotStatus(botId);
        await respond(`
🤖 봇 상태: ${status.name}
- 나이: ${status.persona.age}세
- 직업: ${status.persona.occupation}
- 관심사: ${status.persona.interests.join(', ')}
- 게시판: ${status.settings.boardType}
- 활성화: ${status.settings.active ? '✅' : '❌'}
        `);
      } catch (error) {
        await respond(`❌ 오류: ${error.message}`);
      }
    });

    console.log('[SlackService] All slash commands registered');

    this.app.message(/^봇 (.+)/, async ({ message, say }) => {
      // 봇 자신의 메시지는 무시
      if (message.bot_id) {
        return;
      }
      
      console.log('[SlackService] Message received:', message.text);
      const match = message.text.match(/^봇 (.+)/);
      if (match) {
        const [, content] = match;
        console.log('[SlackService] Bot command matched:', content);
        
        try {
          const defaultBotId = 'bot1';
          console.log('[SlackService] Executing task for bot:', defaultBotId);
          const result = await this.botManager.executeTask(defaultBotId, content);
          console.log('[SlackService] Task result:', result);
          await say(`${result.botName}이(가) 말합니다: "${result.preview}"`);
        } catch (error) {
          console.error('[SlackService] Error:', error);
          await say(`오류가 발생했습니다: ${error.message}`);
        }
      }
    });
    
    // 디버그용: 모든 메시지 로그
    this.app.message(async ({ message }) => {
      if (!message.bot_id) {
        console.log('[SlackService] Any message received:', message.text);
      }
    });
    
    // 디버그용: 이벤트 리스너
    this.app.event('message', async ({ event }) => {
      if (!event.bot_id) {
        console.log('[SlackService] Message event:', event);
      }
    });
    
    // 디버그용: 앱 멘션
    this.app.event('app_mention', async ({ event, say }) => {
      console.log('[SlackService] App mentioned:', event.text);
      await say(`안녕하세요! 저는 LI Korea 봇입니다.`);
    });
  }
}

module.exports = SlackService;
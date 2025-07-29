const Bot = require('../models/Bot');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const initializeBots = async () => {
  try {
    console.log('봇 시스템 초기화 시작...');
    
    // config 파일 읽기
    const configPath = path.join(__dirname, '../config/bots.json');
    let botsConfig;
    
    try {
      const configData = fs.readFileSync(configPath, 'utf8');
      botsConfig = JSON.parse(configData);
    } catch (error) {
      console.log('봇 config 파일을 찾을 수 없어 기본 봇을 생성합니다.');
      botsConfig = null;
    }
    
    if (botsConfig && botsConfig.bots) {
      // config 파일의 봇들로 초기화
      for (const botData of botsConfig.bots) {
        const bot = {
          name: botData.name,
          description: `${botData.persona.age}살 ${botData.persona.occupation} - ${botData.persona.personality}`,
          type: 'poster',
          status: botData.settings.active ? 'active' : 'inactive',
          settings: {
            autoPost: botData.settings.active,
            postInterval: botData.settings.postFrequency === 'daily' ? 86400000 : 604800000,
            targetCategories: botData.settings.tags || []
          },
          persona: botData.persona,
          prompt: botData.prompt
        };
        
        await Bot.findOneAndUpdate(
          { name: bot.name },
          bot,
          { upsert: true, new: true }
        );
        
        // 봇의 사용자 계정도 생성
        if (botData.persona.likoreaAccount && botData.persona.likoreaAccount.username) {
          const existingUser = await User.findOne({ id: botData.persona.likoreaAccount.username });
          if (!existingUser) {
            await User.create({
              id: botData.persona.likoreaAccount.username,
              email: botData.persona.likoreaAccount.email,
              password: botData.persona.likoreaAccount.password,
              authority: 3 // 일반 사용자 권한
            });
            console.log(`봇 사용자 계정 생성: ${botData.persona.likoreaAccount.username}`);
          }
        }
      }
      
      console.log(`봇 시스템 초기화 완료! ${botsConfig.bots.length}개의 봇이 준비되었습니다.`);
    } else {
      // 기본 봇들 정의
      const defaultBots = [
        {
          name: 'PostBot',
          description: '게시글을 자동으로 작성하는 봇',
          type: 'poster',
          status: 'inactive',
          settings: {
            autoPost: false,
            postInterval: 3600000,
            targetCategories: ['기타', '생활정보']
          }
        }
      ];
      
      // 각 봇 생성 또는 업데이트
      for (const botData of defaultBots) {
        await Bot.findOneAndUpdate(
          { name: botData.name },
          botData,
          { upsert: true, new: true }
        );
      }
      
      console.log(`봇 시스템 초기화 완료! ${defaultBots.length}개의 기본 봇이 준비되었습니다.`);
    }
  } catch (error) {
    console.error('봇 시스템 초기화 실패:', error);
    throw error;
  }
};

module.exports = { initializeBots };
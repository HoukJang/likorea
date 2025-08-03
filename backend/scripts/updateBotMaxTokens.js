const mongoose = require('mongoose');
const Bot = require('../models/Bot');
require('dotenv').config();

async function updateBotMaxTokens() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB 연결 성공');

    // 모든 뉴스봇 가져오기
    const bots = await Bot.find({ type: 'news' });
    console.log(`\n📋 총 ${bots.length}개의 뉴스봇 확인 중...`);

    let updatedCount = 0;

    for (const bot of bots) {
      console.log(`\n🔄 봇 "${bot.name}" 확인 중...`);
      console.log(`   현재 maxTokens: ${bot.apiSettings?.maxTokens || '설정 없음'}`);
      
      // apiSettings가 없으면 생성
      if (!bot.apiSettings) {
        bot.apiSettings = {};
      }
      
      // maxTokens가 800 이하이거나 설정되지 않은 경우 2000으로 업데이트
      if (!bot.apiSettings.maxTokens || bot.apiSettings.maxTokens <= 800) {
        bot.apiSettings.maxTokens = 2000;
        
        // 다른 기본값도 설정
        if (!bot.apiSettings.temperature) bot.apiSettings.temperature = 0.8;
        if (!bot.apiSettings.topP) bot.apiSettings.topP = 0.95;
        if (!bot.apiSettings.topK) bot.apiSettings.topK = 0;
        if (bot.apiSettings.enableThinking === undefined) bot.apiSettings.enableThinking = false;
        
        // subType 유효성 검사 및 수정
        const validSubTypes = ['local', 'korean', 'business', 'event', 'general'];
        if (!validSubTypes.includes(bot.subType)) {
          bot.subType = 'local';
          console.log(`   ⚠️ subType을 'local'로 수정 (기존: ${bot.subType || '없음'})`);
        }
        
        await bot.save();
        console.log(`   ✅ maxTokens를 2000으로 업데이트`);
        updatedCount++;
      } else {
        console.log(`   ✨ 이미 충분한 maxTokens 설정 (${bot.apiSettings.maxTokens})`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 작업 완료!`);
    console.log(`   - 확인한 봇: ${bots.length}개`);
    console.log(`   - 업데이트한 봇: ${updatedCount}개`);
    console.log(`   - 변경 없음: ${bots.length - updatedCount}개`);

    // 업데이트 후 상태 출력
    if (updatedCount > 0) {
      console.log('\n📊 업데이트된 봇들의 현재 상태:');
      const updatedBots = await Bot.find({ type: 'news' });
      
      for (const bot of updatedBots) {
        console.log(`\n봇: ${bot.name}`);
        console.log(`  - maxTokens: ${bot.apiSettings?.maxTokens}`);
        console.log(`  - temperature: ${bot.apiSettings?.temperature}`);
        console.log(`  - topP: ${bot.apiSettings?.topP}`);
        console.log(`  - topK: ${bot.apiSettings?.topK}`);
        console.log(`  - enableThinking: ${bot.apiSettings?.enableThinking}`);
      }
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 MongoDB 연결 종료');
  }
}

// 스크립트 실행
updateBotMaxTokens();
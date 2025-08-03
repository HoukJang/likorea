const mongoose = require('mongoose');
const Bot = require('../models/Bot');
require('dotenv').config();

async function fixBotBetaHeaders() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB 연결 성공');

    // 모든 봇 가져오기
    const bots = await Bot.find({});
    console.log(`\n📋 총 ${bots.length}개의 봇 확인 중...`);

    let fixedCount = 0;

    for (const bot of bots) {
      let needsUpdate = false;
      const updates = {};

      // betaHeaders Map 확인 및 수정
      if (bot.apiSettings?.betaHeaders) {
        const newBetaHeaders = new Map();
        let hadInvalidHeader = false;

        bot.apiSettings.betaHeaders.forEach((value, key) => {
          if (key === 'anthropic-beta' && value.includes('thinking-2025-05-14')) {
            // 잘못된 thinking 헤더를 올바른 값으로 교정
            console.log(`\n🔧 봇 "${bot.name}": 잘못된 베타 헤더 발견`);
            console.log(`   기존: ${value}`);
            console.log(`   수정: interleaved-thinking-2025-05-14`);
            newBetaHeaders.set(key, 'interleaved-thinking-2025-05-14');
            hadInvalidHeader = true;
          } else if (value !== 'thinking-2025-05-14') {
            // 다른 유효한 헤더는 유지
            newBetaHeaders.set(key, value);
          }
        });

        if (hadInvalidHeader || newBetaHeaders.size !== bot.apiSettings.betaHeaders.size) {
          updates['apiSettings.betaHeaders'] = newBetaHeaders;
          needsUpdate = true;
        }
      }

      // enableThinking이 true인 경우 모델 호환성 확인
      if (bot.apiSettings?.enableThinking) {
        const isClaudeV4 = bot.aiModel?.includes('claude-opus-4') || 
                          bot.aiModel?.includes('claude-sonnet-4');
        
        if (!isClaudeV4) {
          console.log(`\n⚠️  봇 "${bot.name}": Claude 4가 아닌 모델에서 thinking 활성화됨`);
          console.log(`   모델: ${bot.aiModel}`);
          console.log(`   thinking 기능 비활성화 중...`);
          updates['apiSettings.enableThinking'] = false;
          needsUpdate = true;
        } else {
          console.log(`\n✨ 봇 "${bot.name}": Claude 4 모델에서 thinking 기능 활성화 확인`);
        }
      }

      // 업데이트 실행
      if (needsUpdate) {
        await Bot.findByIdAndUpdate(bot._id, updates);
        console.log(`✅ 봇 "${bot.name}" 업데이트 완료`);
        fixedCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 작업 완료!`);
    console.log(`   - 확인한 봇: ${bots.length}개`);
    console.log(`   - 수정한 봇: ${fixedCount}개`);
    console.log(`   - 정상 봇: ${bots.length - fixedCount}개`);

    // 수정된 봇들의 현재 상태 출력
    if (fixedCount > 0) {
      console.log('\n📊 수정된 봇들의 현재 설정:');
      const updatedBots = await Bot.find({});
      
      for (const bot of updatedBots) {
        if (bot.apiSettings?.enableThinking || bot.apiSettings?.betaHeaders?.size > 0) {
          console.log(`\n봇: ${bot.name}`);
          console.log(`  - 모델: ${bot.aiModel}`);
          console.log(`  - Thinking 활성화: ${bot.apiSettings?.enableThinking || false}`);
          
          if (bot.apiSettings?.betaHeaders?.size > 0) {
            console.log('  - Beta Headers:');
            bot.apiSettings.betaHeaders.forEach((value, key) => {
              console.log(`    ${key}: ${value}`);
            });
          }
        }
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
fixBotBetaHeaders();
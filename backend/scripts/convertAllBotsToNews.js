const mongoose = require('mongoose');
const Bot = require('../models/Bot');
require('dotenv').config();

async function convertAllBotsToNews() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB 연결 성공');

    // 모든 봇 가져오기
    const bots = await Bot.find({});
    console.log(`\n📋 총 ${bots.length}개의 봇 확인 중...`);

    let convertedCount = 0;

    for (const bot of bots) {
      if (bot.type !== 'news') {
        console.log(`\n🔄 봇 "${bot.name}" 변환 중...`);
        console.log(`   기존 타입: ${bot.type}`);
        
        // 뉴스봇으로 변환
        bot.type = 'news';
        // subType 설정 (기존 값이 유효하지 않으면 local로 설정)
        const validSubTypes = ['local', 'korean', 'business', 'event', 'general'];
        if (!validSubTypes.includes(bot.subType)) {
          bot.subType = 'local';  // 기본값으로 local 설정
        }
        
        // 시스템 프롬프트 업데이트
        if (!bot.prompt) {
          bot.prompt = {};
        }
        bot.prompt.system = `당신은 롱아일랜드 한인 커뮤니티를 위한 뉴스 요약 전문가입니다.
실제 뉴스를 바탕으로 정확하고 신뢰할 수 있는 정보만 전달합니다.

응답 형식:
제목: [게시글 제목]
내용: [게시글 내용]`;
        
        await bot.save();
        console.log(`   ✅ 뉴스봇으로 변환 완료`);
        convertedCount++;
      } else {
        console.log(`\n✨ 봇 "${bot.name}"은 이미 뉴스봇입니다`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 작업 완료!`);
    console.log(`   - 확인한 봇: ${bots.length}개`);
    console.log(`   - 변환한 봇: ${convertedCount}개`);
    console.log(`   - 기존 뉴스봇: ${bots.length - convertedCount}개`);

    // 변환 후 상태 출력
    if (convertedCount > 0) {
      console.log('\n📊 변환된 봇들의 현재 상태:');
      const updatedBots = await Bot.find({});
      
      for (const bot of updatedBots) {
        console.log(`\n봇: ${bot.name}`);
        console.log(`  - 타입: ${bot.type}`);
        console.log(`  - 서브타입: ${bot.subType}`);
        console.log(`  - 모델: ${bot.aiModel}`);
        console.log(`  - 상태: ${bot.status}`);
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
convertAllBotsToNews();
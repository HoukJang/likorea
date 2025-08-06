/**
 * 기존 뉴스봇들의 프롬프트를 템플릿 변수를 사용하는 새로운 형식으로 업데이트하는 스크립트
 * 
 * 실행 방법: node utils/updateNewsBotPrompts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Bot = require('../models/Bot');

const newSystemPrompt = `당신은 롱아일랜드 한인 커뮤니티를 위한 뉴스 요약 전문가입니다.
실제 뉴스를 바탕으로 정확하고 신뢰할 수 있는 정보만 전달합니다.

응답 형식:
제목: [게시글 제목]
내용: [게시글 내용]`;

const newUserPrompt = `【현재 시각】 {CURRENT_DATE}

【요청 지역】 {LOCATION}

【작성 요청】
아래는 {MONTH}월 {WEEK_OF_MONTH}째주 {LOCATION} 지역의 실제 뉴스입니다.
각 뉴스를 상세하고 친근하게 요약하여 한인 커뮤니티 소식지 형식으로 작성해주세요.

{NEWS_DATA}

【응답 형식 - 매우 중요】
다음 형식을 정확히 지켜주세요:

제목: {MONTH}월 {WEEK_OF_MONTH}째주 {LOCATION} 한인 커뮤니티 주요 소식
내용: [위 지침에 따라 작성된 뉴스 요약 내용]

⚠️ 주의사항:
- "제목:" 과 "내용:" 레이블은 반드시 포함해주세요
- 제목은 한 줄로 작성해주세요
- 내용은 HTML 형식으로 작성해주세요 (문단은 <p> 태그 사용)
- 각 뉴스 소개 끝에 <a href="링크" target="_blank">[원문보기]</a> 형식으로 출처 링크를 포함해주세요`;

async function updateNewsBotPrompts() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB 연결 성공');

    // 모든 뉴스봇 찾기
    const newsBots = await Bot.find({ type: 'news' });
    console.log(`📰 ${newsBots.length}개의 뉴스봇을 찾았습니다.`);

    if (newsBots.length === 0) {
      console.log('업데이트할 뉴스봇이 없습니다.');
      return;
    }

    // 각 뉴스봇 업데이트
    let updateCount = 0;
    for (const bot of newsBots) {
      try {
        // 프롬프트가 이미 템플릿 변수를 사용하고 있는지 확인
        const currentUserPrompt = bot.prompt?.user || '';
        const hasTemplateVars = currentUserPrompt.includes('{CURRENT_DATE}') || 
                               currentUserPrompt.includes('{NEWS_DATA}');

        if (hasTemplateVars) {
          console.log(`⏭️  ${bot.name} - 이미 템플릿 변수를 사용하고 있습니다. 건너뜁니다.`);
          continue;
        }

        // 프롬프트 업데이트
        bot.prompt = {
          system: newSystemPrompt,
          user: newUserPrompt
        };

        await bot.save();
        updateCount++;
        console.log(`✅ ${bot.name} 프롬프트가 업데이트되었습니다.`);
      } catch (error) {
        console.error(`❌ ${bot.name} 업데이트 실패:`, error.message);
      }
    }

    console.log(`\n📊 업데이트 완료: ${updateCount}/${newsBots.length}개의 뉴스봇이 업데이트되었습니다.`);

    // 업데이트된 봇들의 프롬프트 확인
    if (updateCount > 0) {
      console.log('\n업데이트된 봇 프롬프트 확인:');
      const updatedBots = await Bot.find({ type: 'news' });
      for (const bot of updatedBots) {
        console.log(`\n🤖 ${bot.name}:`);
        console.log('- System Prompt 길이:', bot.prompt?.system?.length || 0, '자');
        console.log('- User Prompt 길이:', bot.prompt?.user?.length || 0, '자');
        console.log('- 템플릿 변수 포함:', bot.prompt?.user?.includes('{NEWS_DATA}') ? '✅' : '❌');
      }
    }

  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류 발생:', error);
  } finally {
    // MongoDB 연결 종료
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB 연결이 종료되었습니다.');
  }
}

// 스크립트 실행
updateNewsBotPrompts().catch(console.error);
const mongoose = require('mongoose');
const Bot = require('../models/Bot');
require('dotenv').config();

async function updateBotUserPrompts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB 연결 성공\n');

    const improvedPrompt = `지금(뉴욕 Eastern Time) 날짜를 읽어 월과 (일-1)//7+1 계산으로 N번째 주차를 구하십시오.
제목은 "<월>월 <N>째주 {{주제}} 뉴스" 형식으로 작성하세요.

제공된 실제 뉴스들을 다음과 같이 정리해주세요:
1. 중요도가 높은 뉴스부터 순서대로 선택 (최대 7-10개)
2. 각 뉴스마다 한 문단(5-8줄)으로 상세히 요약
3. 뉴스 제목, 날짜, 핵심 내용을 포함
4. 각 뉴스 요약 후에는 원문 링크 포함
5. 한인 커뮤니티와의 관련성이나 영향을 언급

형식 예시:
**[뉴스 제목]** (날짜)
뉴스 내용을 5-8줄로 상세히 요약. 사건의 배경, 현재 상황, 향후 전망 등을 포함하여 독자가 충분히 이해할 수 있도록 설명.
원문: [링크]

주의사항:
- 제공된 실제 뉴스 정보만 사용 (추가 정보 창작 금지)
- 각 뉴스를 개별적으로 충실히 요약
- 한인 커뮤니티 관점에서 중요한 정보 강조`;

    // "롱알 뉴스봇" 업데이트
    const bot = await Bot.findOne({ name: '롱알 뉴스봇' });

    if (bot) {
      console.log(`📝 "${bot.name}" 프롬프트 업데이트 중...`);

      if (!bot.prompt) {
        bot.prompt = {};
      }

      console.log('\n기존 User Prompt:');
      console.log(bot.prompt.user?.substring(0, 200) || 'None');

      bot.prompt.user = improvedPrompt;

      await bot.save();
      console.log('\n✅ 프롬프트 업데이트 완료!');

      console.log('\n새로운 User Prompt:');
      console.log(bot.prompt.user.substring(0, 500) + '...');
    } else {
      console.log('❌ "롱알 뉴스봇"을 찾을 수 없습니다.');
    }

    // 다른 뉴스봇들도 업데이트할지 확인
    const otherBots = await Bot.find({
      type: 'news',
      name: { $ne: '롱알 뉴스봇' },
      'prompt.user': { $regex: '크롤링 된 주소로 가서' }
    });

    if (otherBots.length > 0) {
      console.log(`\n📋 비슷한 프롬프트를 가진 다른 봇들: ${otherBots.length}개`);

      for (const otherBot of otherBots) {
        console.log(`\n🔄 "${otherBot.name}" 업데이트 중...`);

        if (!otherBot.prompt) {
          otherBot.prompt = {};
        }

        otherBot.prompt.user = improvedPrompt;
        await otherBot.save();
        console.log(`✅ "${otherBot.name}" 업데이트 완료`);
      }
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 MongoDB 연결 종료');
  }
}

updateBotUserPrompts();
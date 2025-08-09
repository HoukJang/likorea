require('dotenv').config();
const mongoose = require('mongoose');
const Bot = require('../models/Bot');

async function updateBotModels() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB 연결 성공');

    // 모든 봇 조회
    const bots = await Bot.find({});
    console.log(`총 ${bots.length}개의 봇을 찾았습니다.\n`);

    let updatedCount = 0;

    for (const bot of bots) {
      const updates = {};
      let needsUpdate = false;

      // 1. aiModel이 OpenAI 모델인 경우 Claude 모델로 변경
      if (bot.aiModel && bot.aiModel.startsWith('gpt')) {
        updates.aiModel = 'claude-3-haiku-20240307';
        console.log(`  - ${bot.name}: OpenAI 모델 -> Claude 모델로 변경`);
        needsUpdate = true;
      }

      // 2. aiModel이 없는 경우 기본 모델 설정
      if (!bot.aiModel) {
        updates.aiModel = 'claude-3-haiku-20240307';
        console.log(`  - ${bot.name}: 기본 AI 모델 설정`);
        needsUpdate = true;
      }

      // 3. prompt 필드가 문자열이거나 구조가 올바르지 않은 경우 변환
      if (!bot.prompt || typeof bot.prompt === 'string' || !bot.prompt.system) {
        const oldPrompt = typeof bot.prompt === 'string' ? bot.prompt : '';
        updates.prompt = {
          system: oldPrompt || `당신은 롱아일랜드 한인 커뮤니티의 활발한 회원입니다.

응답 형식:
제목: [게시글 제목]
내용: [게시글 내용]`,
          user: ''
        };
        console.log(`  - ${bot.name}: 프롬프트 구조 업데이트 (system/user 분리)`);
        needsUpdate = true;
      }

      // 4. apiSettings가 없는 경우 기본값 추가
      if (!bot.apiSettings || !bot.apiSettings.maxTokens) {
        updates.apiSettings = {
          maxTokens: bot.apiSettings?.maxTokens || 800,
          temperature: bot.apiSettings?.temperature || 0.8,
          topP: bot.apiSettings?.topP || 0.95,
          topK: bot.apiSettings?.topK || 0,
          enableThinking: bot.apiSettings?.enableThinking || false,
          betaHeaders: new Map()
        };
        console.log(`  - ${bot.name}: API 설정 추가`);
        needsUpdate = true;
      }

      // 5. 뉴스봇 타입 업데이트
      if (bot.name && bot.name.includes('뉴스') && bot.type !== 'news') {
        updates.type = 'news';
        updates.subType = 'news';
        console.log(`  - ${bot.name}: 뉴스봇 타입 설정`);
        needsUpdate = true;
      }

      // 업데이트가 필요한 경우만 저장
      if (needsUpdate) {
        await Bot.updateOne({ _id: bot._id }, { $set: updates });
        updatedCount++;
        console.log(`  ✅ ${bot.name} 업데이트 완료\n`);
      }
    }

    if (updatedCount > 0) {
      console.log(`\n🎉 총 ${updatedCount}개의 봇이 성공적으로 업데이트되었습니다.`);
    } else {
      console.log('\n✨ 모든 봇이 이미 최신 상태입니다.');
    }

  } catch (error) {
    console.error('봇 모델 업데이트 중 오류 발생:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB 연결 종료');
  }
}

// 스크립트 실행
updateBotModels();
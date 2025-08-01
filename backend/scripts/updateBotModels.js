require('dotenv').config();
const mongoose = require('mongoose');
const Bot = require('../models/Bot');

async function updateBotModels() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB 연결 성공');

    // aiModel이 없는 봇들 찾기
    const botsWithoutModel = await Bot.find({ aiModel: { $exists: false } });
    
    if (botsWithoutModel.length === 0) {
      console.log('모든 봇이 이미 AI 모델이 설정되어 있습니다.');
      return;
    }

    console.log(`AI 모델이 설정되지 않은 봇 ${botsWithoutModel.length}개 발견`);

    // 각 봇에 기본 모델 설정
    for (const bot of botsWithoutModel) {
      bot.aiModel = 'claude-3-haiku-20240307';
      await bot.save();
      console.log(`봇 '${bot.name}'에 기본 모델 설정 완료`);
    }

    console.log('모든 봇의 AI 모델 업데이트 완료');

  } catch (error) {
    console.error('봇 모델 업데이트 중 오류 발생:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB 연결 종료');
  }
}

// 스크립트 실행
updateBotModels();
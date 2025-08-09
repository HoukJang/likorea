#!/usr/bin/env node

const mongoose = require('mongoose');
const path = require('path');
const Bot = require('../models/Bot');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function updateBotTypes() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB 연결 성공');

    // 뉴스봇 찾아서 type 업데이트
    const result = await Bot.updateMany(
      { name: { $regex: /뉴스/i } },  // 이름에 '뉴스'가 포함된 봇
      {
        $set: {
          type: 'news',
          subType: 'news'
        }
      }
    );

    console.log(`${result.modifiedCount}개의 뉴스봇 type이 업데이트되었습니다.`);

    // 확인
    const newsBots = await Bot.find({ type: 'news' });
    console.log('\n현재 뉴스봇 목록:');
    newsBots.forEach(bot => {
      console.log(`- ${bot.name} (type: ${bot.type}, subType: ${bot.subType})`);
    });

    await mongoose.connection.close();
    console.log('\n완료!');
  } catch (error) {
    console.error('에러 발생:', error);
    process.exit(1);
  }
}

updateBotTypes();
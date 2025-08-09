const mongoose = require('mongoose');
const Bot = require('../models/Bot');
require('dotenv').config();

async function checkBotPrompts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB 연결 성공\n');

    const bots = await Bot.find({ type: 'news' }).select('name prompt apiSettings');

    bots.forEach(bot => {
      console.log('=' .repeat(50));
      console.log(`봇: ${bot.name}`);
      console.log(`maxTokens: ${bot.apiSettings?.maxTokens || 'Not set'}`);
      console.log('\nSystem Prompt:');
      console.log(bot.prompt?.system || 'None');
      console.log('\nUser Prompt:');
      console.log(bot.prompt?.user || 'None');
      console.log('=' .repeat(50));
      console.log('\n');
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkBotPrompts();
require('dotenv').config();
const { App } = require('@slack/bolt');
const express = require('express');
const cors = require('cors');
const BotManager = require('./services/BotManager');
const SlackService = require('./services/SlackService');
const BotWebApi = require('./api/botWebApi');
const config = require('../config/bots.json');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN || config.slack.token,
  signingSecret: process.env.SLACK_SIGNING_SECRET || config.slack.signingSecret,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN || config.slack.appToken,
  logLevel: 'debug',
  developerMode: true
});

const botManager = new BotManager(config);
const slackService = new SlackService(app, botManager);

// Express 서버 설정
const webApp = express();
webApp.use(cors());
webApp.use(express.json());

// Bot Web API 설정
const botWebApi = new BotWebApi(botManager);
webApp.use('/api', botWebApi.getRouter());

async function start() {
  try {
    await app.start(process.env.PORT || 3000);
    console.log('⚡️ Bot app is running!');
    
    // 개발 중 임시로 봇 초기화 건너뛰기
    try {
      await botManager.initialize();
    } catch (error) {
      console.error('Bot initialization failed:', error.message);
      console.log('⚠️  Continuing without bot initialization...');
    }
    
    slackService.registerCommands();
    console.log('✅ All commands registered');
    
    // 등록된 명령어 목록 출력
    console.log('📋 Registered slash commands:');
    console.log('  - /bot-post');
    console.log('  - /bot-restaurant');
    console.log('  - /bot-list');
    console.log('  - /bot-status');
    
    // Express 서버 시작
    const WEB_PORT = process.env.WEB_PORT || 5002;
    webApp.listen(WEB_PORT, () => {
      console.log(`🌐 Bot Web API running on port ${WEB_PORT}`);
    });
  } catch (error) {
    console.error('Failed to start app:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await botManager.cleanup();
  process.exit(0);
});

start();
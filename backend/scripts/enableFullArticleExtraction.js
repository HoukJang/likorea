#!/usr/bin/env node

/**
 * Enable Full Article Extraction for Bots
 * 봇의 전체 기사 추출 기능 활성화
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Bot = require('../models/Bot');

async function enableFullArticleExtraction(botName) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    if (botName) {
      // 특정 봇만 업데이트
      const result = await Bot.updateOne(
        { name: botName },
        { 
          $set: { 
            'apiSettings.extractFullArticles': true,
            'apiSettings.maxFullArticles': 5  // 성능 고려하여 5개로 제한
          }
        }
      );
      
      if (result.matchedCount > 0) {
        console.log(`✅ ${botName} 봇의 전체 기사 추출이 활성화되었습니다.`);
        console.log(`   - extractFullArticles: true`);
        console.log(`   - maxFullArticles: 5`);
      } else {
        console.log(`❌ ${botName} 봇을 찾을 수 없습니다.`);
      }
    } else {
      // 모든 뉴스봇 업데이트
      const result = await Bot.updateMany(
        { type: 'news' },
        { 
          $set: { 
            'apiSettings.extractFullArticles': true,
            'apiSettings.maxFullArticles': 5
          }
        }
      );
      
      console.log(`✅ ${result.modifiedCount}개 뉴스봇의 전체 기사 추출이 활성화되었습니다.`);
    }
    
    // 현재 상태 확인
    console.log('\n=== 현재 봇 설정 ===');
    const bots = await Bot.find({}, 'name type apiSettings.extractFullArticles apiSettings.maxFullArticles');
    bots.forEach(bot => {
      console.log(`${bot.name} (${bot.type}):`);
      console.log(`  - extractFullArticles: ${bot.apiSettings?.extractFullArticles || false}`);
      console.log(`  - maxFullArticles: ${bot.apiSettings?.maxFullArticles || 7}`);
    });
    
  } catch (error) {
    console.error('오류:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// CLI 사용법
const botName = process.argv[2];
if (process.argv.length > 3) {
  console.log('사용법: node enableFullArticleExtraction.js [봇이름]');
  console.log('  - 봇이름 생략 시 모든 뉴스봇 활성화');
  process.exit(1);
}

enableFullArticleExtraction(botName);
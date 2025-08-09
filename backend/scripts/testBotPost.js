#!/usr/bin/env node

/**
 * Bot Post Test Script
 * 봇이 생성하는 게시글에 링크가 포함되지 않는지 테스트
 */

require('dotenv').config();
const mongoose = require('mongoose');
const colors = require('colors/safe');
const newsAggregatorService = require('../services/newsAggregatorService');

async function testBotPost() {
  try {
    // DB 연결
    await mongoose.connect(process.env.MONGO_URI);
    console.log(colors.green('✅ MongoDB 연결 성공'));

    // 테스트용 뉴스 수집
    console.log(colors.blue('\n📰 뉴스 수집 시작...'));
    const newsData = await newsAggregatorService.aggregateWeeklyNews('Great Neck', {
      extractFullArticles: false,
      maxFullArticles: 3
    });

    console.log(colors.green(`✅ ${newsData.totalArticles}개 뉴스 수집 완료`));

    // Claude용 프롬프트 생성
    console.log(colors.blue('\n📝 프롬프트 생성...'));
    const prompt = newsAggregatorService.formatForClaudePrompt(newsData);

    // 프롬프트에 URL이 포함되어 있는지 확인
    const urlPatterns = [
      /https?:\/\/[^\s]+/g,
      /news\.google\.com\/rss\/articles/g,
      /\[원문 링크\]/g
    ];

    let hasUrls = false;
    for (const pattern of urlPatterns) {
      const matches = prompt.match(pattern);
      if (matches) {
        console.log(colors.red(`❌ 프롬프트에 URL 발견: ${matches[0]}`));
        hasUrls = true;
      }
    }

    if (!hasUrls) {
      console.log(colors.green('✅ 프롬프트에 URL이 포함되지 않음'));
    }

    // 프롬프트 일부 출력
    console.log(colors.cyan('\n=== 프롬프트 미리보기 (첫 1000자) ==='));
    console.log(prompt.substring(0, 1000));
    console.log(colors.cyan('...'));

    // 뉴스 기사 링크 상태 확인
    console.log(colors.blue('\n🔗 뉴스 기사 링크 상태:'));
    newsData.articles.slice(0, 5).forEach((article, i) => {
      const isGoogleNews = article.originalLink?.includes('news.google.com/rss/articles/');
      const isResolved = article.link !== article.originalLink;

      console.log(`${i + 1}. ${article.title.substring(0, 50)}...`);
      if (isGoogleNews && isResolved) {
        console.log(colors.green('   ✅ Google News URL 리졸브됨'));
      } else if (isGoogleNews && !isResolved) {
        console.log(colors.yellow('   ⚠️ Google News URL 리졸브 실패'));
      } else {
        console.log(colors.gray('   - 직접 접근 가능한 URL'));
      }
    });

    console.log(colors.green('\n✅ 테스트 완료!'));

  } catch (error) {
    console.error(colors.red('❌ 테스트 실패:'), error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// 실행
testBotPost();
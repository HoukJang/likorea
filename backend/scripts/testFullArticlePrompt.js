#!/usr/bin/env node

/**
 * Test Full Article Prompt Generation
 * 전체 기사 추출이 Claude 프롬프트에 포함되는지 테스트
 */

require('dotenv').config();
const newsAggregatorService = require('../services/newsAggregatorService');

async function testFullArticlePrompt() {
  console.log('\n========================================');
  console.log('전체 기사 추출 프롬프트 테스트');
  console.log('========================================\n');
  
  // 캐시 초기화
  newsAggregatorService.clearCache();
  
  try {
    // 1. 전체 기사 추출 비활성화 테스트
    console.log('1. 전체 기사 추출 OFF (기본 RSS 요약만)');
    console.log('-'.repeat(40));
    
    const newsDataWithoutFull = await newsAggregatorService.aggregateWeeklyNews('Long Island', {
      extractFullArticles: false,
      maxFullArticles: 3
    });
    
    const promptWithoutFull = newsAggregatorService.formatForClaudePrompt(newsDataWithoutFull);
    
    console.log(`  - 전체 기사 수: ${newsDataWithoutFull.totalArticles}`);
    console.log(`  - 선택된 기사: ${newsDataWithoutFull.selectedArticles}`);
    console.log(`  - hasFullContent: ${newsDataWithoutFull.hasFullContent}`);
    console.log(`  - 프롬프트 길이: ${promptWithoutFull.length}자`);
    console.log(`  - 프롬프트 미리보기 (200자):`);
    console.log('    ' + promptWithoutFull.substring(0, 200).replace(/\n/g, '\n    '));
    
    // 2. 전체 기사 추출 활성화 테스트
    console.log('\n2. 전체 기사 추출 ON (전체 기사 내용 포함)');
    console.log('-'.repeat(40));
    
    // 캐시 초기화 (새로운 요청)
    newsAggregatorService.clearCache();
    
    const newsDataWithFull = await newsAggregatorService.aggregateWeeklyNews('Long Island', {
      extractFullArticles: true,
      maxFullArticles: 3
    });
    
    const promptWithFull = newsAggregatorService.formatForClaudePrompt(newsDataWithFull);
    
    console.log(`  - 전체 기사 수: ${newsDataWithFull.totalArticles}`);
    console.log(`  - 선택된 기사: ${newsDataWithFull.selectedArticles}`);
    console.log(`  - hasFullContent: ${newsDataWithFull.hasFullContent}`);
    console.log(`  - 프롬프트 길이: ${promptWithFull.length}자`);
    
    // 전체 기사가 포함된 개수 확인
    const articlesWithFullContent = newsDataWithFull.articles.filter(a => a.hasFullContent);
    console.log(`  - 전체 내용 포함 기사: ${articlesWithFullContent.length}개`);
    
    if (articlesWithFullContent.length > 0) {
      console.log('\n  전체 내용이 추출된 기사:');
      articlesWithFullContent.forEach((article, i) => {
        console.log(`    ${i + 1}. ${article.title}`);
        console.log(`       - 내용 길이: ${article.fullContent?.length || 0}자`);
        console.log(`       - 출처: ${article.source}`);
      });
    }
    
    console.log(`\n  - 프롬프트 미리보기 (500자):`);
    console.log('    ' + promptWithFull.substring(0, 500).replace(/\n/g, '\n    '));
    
    // 3. 비교 분석
    console.log('\n3. 비교 분석');
    console.log('-'.repeat(40));
    console.log(`  - 프롬프트 크기 증가: ${promptWithFull.length - promptWithoutFull.length}자`);
    console.log(`  - 증가율: ${((promptWithFull.length / promptWithoutFull.length - 1) * 100).toFixed(1)}%`);
    
    // 전체 기사가 실제로 포함되었는지 확인
    const hasFullArticleMarker = promptWithFull.includes('【전체 기사 내용이 포함된 주요 뉴스】');
    const hasArticleBox = promptWithFull.includes('╔════════════');
    
    console.log(`  - 전체 기사 마커 포함: ${hasFullArticleMarker ? '✅' : '❌'}`);
    console.log(`  - 기사 박스 포맷 포함: ${hasArticleBox ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  }
  
  console.log('\n========================================');
  console.log('테스트 완료');
  console.log('========================================\n');
}

// 실행
testFullArticlePrompt().catch(console.error);
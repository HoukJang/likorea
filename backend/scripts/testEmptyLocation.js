#!/usr/bin/env node

/**
 * Empty Location Test Script
 * 빈 지역으로 뉴스 생성 테스트
 */

require('dotenv').config({ path: '../.env' });
const newsAggregatorService = require('../services/newsAggregatorService');

async function testEmptyLocation() {
  console.log('\n========================================');
  console.log('빈 지역 뉴스 생성 테스트');
  console.log('========================================\n');
  
  const testCases = [
    { location: '', label: '빈 문자열' },
    { location: null, label: 'null' },
    { location: undefined, label: 'undefined' },
    { location: '   ', label: '공백만' },
    { location: [], label: '빈 배열' },
    { location: [''], label: '빈 문자열 배열' },
    { location: 'Long Island', label: '정상 케이스 (Long Island)' },
    { location: 'Great Neck/Manhasset', label: '여러 지역' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n테스트: ${testCase.label}`);
    console.log(`입력값:`, testCase.location);
    console.log('-'.repeat(40));
    
    try {
      const newsData = await newsAggregatorService.aggregateWeeklyNews(testCase.location, {
        extractFullArticles: false,
        maxFullArticles: 3
      });
      
      console.log(`✅ 성공!`);
      console.log(`  - 전체 기사: ${newsData.totalArticles}개`);
      console.log(`  - 선택된 기사: ${newsData.selectedArticles}개`);
      
      // 첫 번째 기사 제목 출력
      if (newsData.articles && newsData.articles.length > 0) {
        console.log(`  - 첫 기사: ${newsData.articles[0].title.substring(0, 50)}...`);
      }
      
    } catch (error) {
      console.log(`❌ 실패: ${error.message}`);
    }
  }
  
  console.log('\n========================================');
  console.log('테스트 완료');
  console.log('========================================\n');
}

// 실행
testEmptyLocation().catch(console.error);
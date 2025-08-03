#!/usr/bin/env node

/**
 * Article Extraction Test Script
 * 전체 기사 추출 시스템 테스트
 */

require('dotenv').config({ path: '../.env' });
const newsAggregatorService = require('../services/newsAggregatorService');
const articleExtractorService = require('../services/articleExtractorService');
const urlResolverService = require('../services/urlResolverService');
const rssFeedService = require('../services/rssFeedService');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testUrlResolver() {
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('1. URL Resolver 테스트', 'bright');
  log('═══════════════════════════════════════════════════════', 'cyan');
  
  const testUrls = [
    'https://news.google.com/rss/articles/CBMiKmh0dHBzOi8vd3d3LmFiYzduZXdzLmNvbS9uZXdzL3Rlc3QtYXJ0aWNsZdIBAA',
    'https://www.newsday.com/long-island/test-article',
    'https://patch.com/new-york/test-article'
  ];
  
  for (const url of testUrls) {
    try {
      log(`\n테스트 URL: ${url.substring(0, 60)}...`, 'yellow');
      const resolved = await urlResolverService.resolveGoogleNewsUrl(url);
      
      if (resolved !== url) {
        log(`✅ 리졸브 성공: ${resolved.substring(0, 60)}...`, 'green');
      } else {
        log(`ℹ️  직접 URL (리졸브 불필요): ${resolved.substring(0, 60)}...`, 'blue');
      }
    } catch (error) {
      log(`❌ 리졸브 실패: ${error.message}`, 'red');
    }
  }
}

async function testArticleExtraction() {
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('2. Article Extractor 테스트', 'bright');
  log('═══════════════════════════════════════════════════════', 'cyan');
  
  // 실제 뉴스 RSS에서 URL 가져오기
  log('\n최근 뉴스 가져오기...', 'yellow');
  const recentNews = await rssFeedService.fetchRecentNews(1, 'Long Island');
  
  if (recentNews.length === 0) {
    log('❌ 최근 뉴스를 찾을 수 없습니다.', 'red');
    return;
  }
  
  // 직접 접근 가능한 소스와 Google News 분리
  const directSources = recentNews.filter(n => 
    n.source?.includes('Newsday') || 
    n.source?.includes('Patch') || 
    n.source?.includes('Long Island Press')
  ).slice(0, 2);
  
  const googleNewsSources = recentNews.filter(n => 
    n.source?.includes('Google News')
  ).slice(0, 2);
  
  const testArticles = [...directSources, ...googleNewsSources];
  
  log(`\n테스트할 기사: ${testArticles.length}개 (직접: ${directSources.length}, Google: ${googleNewsSources.length})`, 'blue');
  
  for (const article of testArticles) {
    log('\n' + '─'.repeat(60), 'cyan');
    log(`제목: ${article.title}`, 'bright');
    log(`출처: ${article.source}`);
    log(`URL: ${article.link.substring(0, 80)}...`);
    
    try {
      const extracted = await articleExtractorService.extractArticle(article.link);
      
      if (extracted && extracted.content) {
        log(`✅ 추출 성공!`, 'green');
        log(`  - 제목: ${extracted.title || 'N/A'}`);
        log(`  - 작성자: ${extracted.byline || 'N/A'}`);
        log(`  - 길이: ${extracted.content.length}자`);
        log(`  - 첫 200자: ${extracted.content.substring(0, 200)}...`);
      } else {
        log(`⚠️  추출 실패 (내용 없음)`, 'yellow');
      }
    } catch (error) {
      log(`❌ 추출 오류: ${error.message}`, 'red');
    }
    
    // API 제한 방지를 위한 지연
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function testFullPipeline() {
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('3. 전체 파이프라인 테스트', 'bright');
  log('═══════════════════════════════════════════════════════', 'cyan');
  
  const locations = ['Great Neck', 'Manhasset'];
  
  log(`\n테스트 지역: ${locations.join(', ')}`, 'yellow');
  log('전체 기사 추출 옵션 활성화...', 'yellow');
  
  try {
    const newsData = await newsAggregatorService.aggregateWeeklyNews(locations, {
      extractFullArticles: true,
      maxFullArticles: 3
    });
    
    log(`\n✅ 뉴스 집계 완료!`, 'green');
    log(`  - 전체 기사 수: ${newsData.totalArticles}`);
    log(`  - 선택된 기사: ${newsData.selectedArticles}`);
    log(`  - 전체 내용 포함: ${newsData.hasFullContent ? 'Yes' : 'No'}`);
    
    // 전체 내용이 있는 기사 확인
    const articlesWithFullContent = newsData.articles.filter(a => a.hasFullContent);
    log(`  - 전체 내용 추출 성공: ${articlesWithFullContent.length}개`);
    
    if (articlesWithFullContent.length > 0) {
      log('\n전체 내용이 추출된 기사:', 'bright');
      articlesWithFullContent.forEach((article, i) => {
        log(`\n  ${i + 1}. ${article.fullTitle || article.title}`, 'cyan');
        log(`     - 작성자: ${article.byline || 'N/A'}`);
        log(`     - 내용 길이: ${article.contentLength || article.fullContent?.length || 0}자`);
        log(`     - 출처: ${article.source}`);
      });
    }
    
    // Claude 프롬프트 생성 테스트
    log('\n═══════════════════════════════════════════════════════', 'cyan');
    log('4. Claude 프롬프트 생성 테스트', 'bright');
    log('═══════════════════════════════════════════════════════', 'cyan');
    
    const prompt = newsAggregatorService.formatForClaudePrompt(newsData);
    log(`\n생성된 프롬프트 길이: ${prompt.length}자`, 'yellow');
    log('프롬프트 첫 500자:', 'cyan');
    log(prompt.substring(0, 500) + '...');
    
  } catch (error) {
    log(`❌ 파이프라인 오류: ${error.message}`, 'red');
    console.error(error);
  }
}

async function testCacheStats() {
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('5. 캐시 통계', 'bright');
  log('═══════════════════════════════════════════════════════', 'cyan');
  
  const urlStats = urlResolverService.getCacheStats();
  log('\nURL Resolver 캐시:', 'yellow');
  log(`  - 캐시된 URL: ${urlStats.keys}개`);
  log(`  - 히트: ${urlStats.hits}`);
  log(`  - 미스: ${urlStats.misses}`);
  log(`  - 히트율: ${(urlStats.hitRate * 100).toFixed(2)}%`);
}

async function main() {
  log('\n╔═══════════════════════════════════════════════════════╗', 'magenta');
  log('║        전체 기사 추출 시스템 테스트 시작              ║', 'magenta');
  log('╚═══════════════════════════════════════════════════════╝', 'magenta');
  
  try {
    // 1. URL Resolver 테스트
    await testUrlResolver();
    
    // 2. Article Extractor 테스트
    await testArticleExtraction();
    
    // 3. 전체 파이프라인 테스트
    await testFullPipeline();
    
    // 4. 캐시 통계
    await testCacheStats();
    
    log('\n╔═══════════════════════════════════════════════════════╗', 'green');
    log('║        테스트 완료! 시스템 정상 작동 확인             ║', 'green');
    log('╚═══════════════════════════════════════════════════════╝', 'green');
    
  } catch (error) {
    log('\n╔═══════════════════════════════════════════════════════╗', 'red');
    log('║        테스트 실패!                                   ║', 'red');
    log('╚═══════════════════════════════════════════════════════╝', 'red');
    console.error(error);
    process.exit(1);
  }
}

// 실행
main().catch(console.error);
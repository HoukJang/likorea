const rssFeedService = require('../services/rssFeedService');
const newsAggregatorService = require('../services/newsAggregatorService');

async function testMultipleLocations() {
  console.log('🧪 다중 지역 뉴스 크롤링 테스트 시작\n');
  console.log('=' .repeat(50));

  // 테스트 케이스들
  const testCases = [
    {
      name: '단일 지역',
      input: 'Great Neck',
      expected: ['Great Neck']
    },
    {
      name: '여러 지역 (슬래시 구분)',
      input: 'Great Neck/Flushing/Manhasset',
      expected: ['Great Neck', 'Flushing', 'Manhasset']
    },
    {
      name: '공백 포함',
      input: ' Great Neck / Flushing / Manhasset ',
      expected: ['Great Neck', 'Flushing', 'Manhasset']
    },
    {
      name: '빈 문자열',
      input: '',
      expected: ['Long Island']
    },
    {
      name: '배열 직접 전달',
      input: ['Great Neck', 'Flushing'],
      expected: ['Great Neck', 'Flushing']
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📍 테스트: ${testCase.name}`);
    console.log(`   입력: "${testCase.input}"`);
    console.log(`   예상: ${testCase.expected.join(', ')}`);
    
    try {
      // rssFeedService 테스트
      let locations = testCase.input;
      if (typeof locations === 'string' && locations.includes('/')) {
        locations = locations.split('/').map(loc => loc.trim()).filter(loc => loc);
      }
      
      rssFeedService.setLocationFeeds(locations);
      console.log(`   ✅ RSS 피드 설정 성공`);
      console.log(`   피드 수: ${rssFeedService.feedSources.length}개`);
      
      // 처음 3개 피드만 표시
      rssFeedService.feedSources.slice(0, 3).forEach(feed => {
        console.log(`      - ${feed.name}`);
      });
      
      // newsAggregatorService 테스트 (실제 크롤링은 하지 않음)
      console.log(`   📰 뉴스 집계 서비스 테스트...`);
      
      // 캐시 키 생성 테스트
      const locationArray = Array.isArray(locations) ? locations : [locations];
      const validLocations = locationArray.filter(loc => loc && loc.trim()).map(loc => loc.trim());
      const targetLocations = validLocations.length > 0 ? validLocations : ['Long Island'];
      const locationKey = targetLocations.join('_').replace(/\s+/g, '_');
      const cacheKey = `weekly_${locationKey}_${new Date().toISOString().split('T')[0]}`;
      
      console.log(`   캐시 키: ${cacheKey}`);
      console.log(`   대상 지역: ${targetLocations.join(', ')}`);
      
    } catch (error) {
      console.error(`   ❌ 오류 발생: ${error.message}`);
    }
    
    console.log('-'.repeat(50));
  }

  // 실제 크롤링 테스트 (선택적)
  const doRealCrawl = process.argv.includes('--real');
  
  if (doRealCrawl) {
    console.log('\n🌐 실제 크롤링 테스트 시작...');
    console.log('=' .repeat(50));
    
    const testLocation = 'Great Neck/Flushing';
    console.log(`테스트 지역: ${testLocation}`);
    
    try {
      const locations = testLocation.split('/').map(loc => loc.trim()).filter(loc => loc);
      const newsData = await newsAggregatorService.aggregateWeeklyNews(locations);
      
      console.log(`\n📊 크롤링 결과:`);
      console.log(`   - 전체 기사 수: ${newsData.totalArticles}개`);
      console.log(`   - 선택된 기사 수: ${newsData.selectedArticles}개`);
      console.log(`   - 생성 시간: ${newsData.generatedAt}`);
      
      console.log(`\n📰 카테고리별 분류:`);
      Object.entries(newsData.categorized).forEach(([category, articles]) => {
        console.log(`   - ${category}: ${articles.length}개`);
      });
      
      console.log(`\n🔝 상위 3개 뉴스:`);
      newsData.articles.slice(0, 3).forEach((article, i) => {
        console.log(`\n   ${i + 1}. ${article.title}`);
        console.log(`      점수: ${article.relevanceScore}점`);
        console.log(`      출처: ${article.source}`);
        console.log(`      날짜: ${new Date(article.pubDate).toLocaleDateString('ko-KR')}`);
      });
      
    } catch (error) {
      console.error(`❌ 크롤링 실패: ${error.message}`);
    }
  } else {
    console.log('\n💡 팁: --real 옵션을 추가하면 실제 크롤링을 테스트합니다');
    console.log('   예: node scripts/testMultipleLocations.js --real');
  }

  console.log('\n✅ 테스트 완료!');
}

// 스크립트 실행
testMultipleLocations().catch(console.error);
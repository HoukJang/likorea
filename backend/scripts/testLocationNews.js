const newsAggregatorService = require('../services/newsAggregatorService');

async function testLocationBasedNews() {
  console.log('🚀 지역별 뉴스 크롤링 테스트\n');
  console.log('=' .repeat(50));

  // 테스트할 지역 목록
  const locations = [
    'Great Neck',
    'Manhasset',
    'Flushing',
    'Port Washington',
    'Roslyn'
  ];

  try {
    for (const location of locations) {
      console.log(`\n📍 테스트 지역: ${location}`);
      console.log('-'.repeat(50));

      // 캐시 초기화 (각 지역별로 새로 크롤링)
      newsAggregatorService.clearCache();

      // 해당 지역 뉴스 수집
      const newsData = await newsAggregatorService.aggregateWeeklyNews(location);

      console.log(`✅ ${location} 뉴스 수집 완료`);
      console.log(`   ├─ 전체 기사: ${newsData.totalArticles}개`);
      console.log(`   └─ 선택된 기사: ${newsData.selectedArticles}개`);

      // 카테고리별 분포
      console.log('\n📂 카테고리별 분류:');
      Object.entries(newsData.categorized).forEach(([category, articles]) => {
        if (articles.length > 0) {
          console.log(`   ├─ ${category}: ${articles.length}개`);
        }
      });

      // 상위 3개 뉴스 제목
      console.log('\n📰 주요 뉴스 TOP 3:');
      newsData.articles.slice(0, 3).forEach((article, i) => {
        console.log(`${i + 1}. [점수: ${article.relevanceScore}] ${article.title.substring(0, 50)}...`);
      });

      // 이벤트/행사 관련 뉴스 확인
      const eventNews = newsData.articles.filter(article => {
        const text = `${article.title} ${article.description}`.toLowerCase();
        return text.match(/(event|festival|concert|performance|exhibition|competition|tournament|celebration|ceremony|show|conference|workshop|fair)/);
      });

      if (eventNews.length > 0) {
        console.log(`\n🎉 이벤트/행사 뉴스: ${eventNews.length}개 발견`);
        eventNews.slice(0, 2).forEach((article, i) => {
          console.log(`   ${i + 1}. ${article.title.substring(0, 60)}...`);
        });
      }

      // 잠시 대기 (API 부하 방지)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(50));
    console.log('✨ 모든 지역 테스트 완료!\n');

    console.log('📌 사용 방법:');
    console.log('1. 봇 관리 페이지에서 뉴스봇 생성');
    console.log('2. "작업" 필드에 원하는 지역명 입력');
    console.log('   예: "Great Neck", "Flushing", "Manhasset"');
    console.log('3. 해당 지역의 뉴스가 자동으로 크롤링됨');
    console.log('\n💡 팁: "뉴스" 단어는 자동으로 제거되므로');
    console.log('   "Great Neck 뉴스" 또는 "Great Neck" 모두 가능');

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    console.error('상세 오류:', error.stack);
  }
}

// 테스트 실행
testLocationBasedNews();
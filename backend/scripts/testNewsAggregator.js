const rssFeedService = require('../services/rssFeedService');
const newsAggregatorService = require('../services/newsAggregatorService');

async function testNewsAggregator() {
  console.log('🚀 뉴스 집계 시스템 테스트 시작\n');
  console.log('=' .repeat(50));

  try {
    // 1. RSS 피드 소스 테스트
    console.log('\n📡 [1/4] RSS 피드 소스 연결 테스트');
    console.log('-'.repeat(50));
    const sourcesHealth = await newsAggregatorService.checkSourcesHealth();

    sourcesHealth.forEach(source => {
      const icon = source.status === 'active' ? '✅' : '❌';
      console.log(`${icon} ${source.name}`);
      if (source.status === 'active') {
        console.log(`   └─ ${source.articleCount}개 기사 수집 가능`);
      } else {
        console.log(`   └─ 오류: ${source.error}`);
      }
    });

    const activeCount = sourcesHealth.filter(s => s.status === 'active').length;
    console.log(`\n📊 결과: ${activeCount}/${sourcesHealth.length} 소스 활성화`);

    // 2. 뉴스 크롤링 테스트
    console.log('\n🔍 [2/4] 뉴스 크롤링 테스트');
    console.log('-'.repeat(50));
    const allNews = await rssFeedService.fetchAllNews();
    console.log(`✅ 총 ${allNews.length}개 기사 수집 완료`);

    // 언어별 분류
    const koreanNews = allNews.filter(n => n.language === 'ko');
    const englishNews = allNews.filter(n => n.language === 'en');
    console.log(`   ├─ 한국어 뉴스: ${koreanNews.length}개`);
    console.log(`   └─ 영어 뉴스: ${englishNews.length}개`);

    // 최신 뉴스 5개 출력
    console.log('\n📰 최신 뉴스 TOP 5:');
    allNews.slice(0, 5).forEach((article, i) => {
      const date = new Date(article.pubDate).toLocaleDateString('ko-KR');
      console.log(`${i + 1}. [${date}] ${article.title.substring(0, 60)}...`);
      console.log(`   출처: ${article.source}`);
    });

    // 3. 뉴스 집계 및 점수화 테스트
    console.log('\n📊 [3/4] 뉴스 집계 및 중요도 분석');
    console.log('-'.repeat(50));
    const aggregated = await newsAggregatorService.aggregateWeeklyNews();

    console.log('✅ 주간 뉴스 집계 완료');
    console.log(`   ├─ 전체 기사: ${aggregated.totalArticles}개`);
    console.log(`   └─ 선택된 중요 기사: ${aggregated.selectedArticles}개`);

    // 카테고리별 분포
    console.log('\n📂 카테고리별 분류:');
    Object.entries(aggregated.categorized).forEach(([category, articles]) => {
      if (articles.length > 0) {
        console.log(`   ├─ ${category}: ${articles.length}개`);
      }
    });

    // 상위 점수 뉴스
    console.log('\n⭐ 중요도 TOP 5 뉴스:');
    aggregated.articles.slice(0, 5).forEach((article, i) => {
      console.log(`${i + 1}. [점수: ${article.relevanceScore}] ${article.title.substring(0, 50)}...`);
    });

    // 4. Claude 프롬프트 생성 테스트
    console.log('\n🤖 [4/4] Claude 프롬프트 생성 테스트');
    console.log('-'.repeat(50));
    const prompt = newsAggregatorService.formatForClaudePrompt(aggregated);

    console.log('✅ Claude용 프롬프트 생성 완료');
    console.log(`   └─ 프롬프트 길이: ${prompt.length}자`);

    // 프롬프트 미리보기 (처음 500자)
    console.log('\n📝 프롬프트 미리보기:');
    console.log('-'.repeat(50));
    console.log(prompt.substring(0, 500) + '...\n');

    // 캐시 상태
    console.log('💾 캐시 정보:');
    console.log('   ├─ RSS 캐시: 30분 TTL');
    console.log('   └─ 집계 캐시: 1시간 TTL');

    // 테스트 완료
    console.log('\n' + '='.repeat(50));
    console.log('✨ 모든 테스트 완료!');
    console.log('\n📌 다음 단계:');
    console.log('1. 봇 관리 페이지에서 뉴스봇 생성');
    console.log('2. 봇 타입을 "news"로 설정');
    console.log('3. "게시글 생성" 버튼 클릭하여 실제 뉴스 기반 게시글 생성');

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    console.error('상세 오류:', error.stack);
  }
}

// 테스트 실행
testNewsAggregator();
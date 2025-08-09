const articleExtractorService = require('../services/articleExtractorService');
const newsAggregatorService = require('../services/newsAggregatorService');

/**
 * Article Extractor 테스트 스크립트
 * 전체 기사 추출 기능을 테스트합니다.
 */
async function testArticleExtractor() {
  console.log('🧪 Article Extractor 테스트 시작\n');
  console.log('=' .repeat(70));

  // 테스트 URL들 (다양한 뉴스 사이트)
  const testUrls = [
    'https://www.newsday.com/long-island',
    'https://patch.com/new-york/great-neck',
    'https://www.nbcnewyork.com',
    'https://abc7ny.com',
    'https://qns.com/queens'
  ];

  console.log('\n📋 단일 기사 추출 테스트');
  console.log('-'.repeat(70));

  // 테스트 가능한 실제 기사 URL (예시)
  const sampleArticleUrl = 'https://patch.com/new-york/great-neck';

  try {
    console.log(`\n🔍 테스트 URL: ${sampleArticleUrl}`);
    const article = await articleExtractorService.extractArticle(sampleArticleUrl);

    if (article) {
      console.log('\n✅ 기사 추출 성공!');
      console.log(`📰 제목: ${article.title || 'No title'}`);
      console.log(`✍️ 작성자: ${article.byline || 'Unknown'}`);
      console.log(`📏 길이: ${article.length || 0}자`);
      console.log(`🌐 사이트: ${article.siteName || 'Unknown'}`);
      console.log(`📅 추출 시간: ${article.extractedAt}`);
      console.log('\n📝 내용 미리보기 (처음 500자):');
      console.log(article.content?.substring(0, 500) + '...');
    } else {
      console.log('❌ 기사 추출 실패');
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }

  console.log('\n' + '=' .repeat(70));
  console.log('📋 뉴스 집계 with 전체 기사 추출 테스트');
  console.log('-'.repeat(70));

  try {
    console.log('\n📰 뉴스 집계 시작 (전체 기사 추출 활성화)...');

    // 뉴스 집계 (전체 기사 추출 옵션 활성화)
    const newsData = await newsAggregatorService.aggregateWeeklyNews('Great Neck', {
      extractFullArticles: true,
      maxFullArticles: 3  // 테스트를 위해 3개만
    });

    console.log('\n📊 집계 결과:');
    console.log(`   - 전체 수집 뉴스: ${newsData.totalArticles}개`);
    console.log(`   - 선택된 뉴스: ${newsData.selectedArticles}개`);
    console.log(`   - 전체 기사 추출 여부: ${newsData.hasFullContent ? '✅' : '❌'}`);

    // 전체 기사가 추출된 뉴스 확인
    const articlesWithFullContent = newsData.articles.filter(a => a.hasFullContent);
    console.log(`   - 전체 기사 추출 성공: ${articlesWithFullContent.length}개`);

    if (articlesWithFullContent.length > 0) {
      console.log('\n📄 전체 기사가 추출된 뉴스들:');
      articlesWithFullContent.forEach((article, i) => {
        console.log(`\n   ${i + 1}. ${article.fullTitle || article.title}`);
        console.log(`      - 원본 길이: ${article.description?.length || 0}자`);
        console.log(`      - 전체 기사 길이: ${article.contentLength || 0}자`);
        console.log(`      - 작성자: ${article.byline || 'Unknown'}`);
        if (article.fullContent) {
          console.log(`      - 내용 미리보기: ${article.fullContent.substring(0, 200)}...`);
        }
      });
    }

    // Claude 프롬프트 생성 테스트
    console.log('\n' + '=' .repeat(70));
    console.log('📋 Claude 프롬프트 생성 테스트');
    console.log('-'.repeat(70));

    const prompt = newsAggregatorService.formatForClaudePrompt(newsData);
    console.log('\n생성된 프롬프트 길이:', prompt.length, '자');
    console.log('\n프롬프트 미리보기 (처음 1000자):');
    console.log('-'.repeat(70));
    console.log(prompt.substring(0, 1000));
    console.log('...[생략]...');

  } catch (error) {
    console.error('❌ 뉴스 집계 오류:', error.message);
    console.error(error.stack);
  }

  console.log('\n' + '=' .repeat(70));
  console.log('✅ 테스트 완료!');

  // 팁 출력
  console.log('\n💡 사용 팁:');
  console.log('1. 전체 기사 추출은 시간이 오래 걸릴 수 있습니다 (기사당 2-5초)');
  console.log('2. 일부 사이트는 봇 차단 정책이 있어 추출이 실패할 수 있습니다');
  console.log('3. 프로덕션에서는 extractFullArticles를 신중하게 활성화하세요');
  console.log('4. maxFullArticles를 조절하여 성능과 품질의 균형을 맞추세요');
}

// 스크립트 실행
testArticleExtractor().catch(console.error);
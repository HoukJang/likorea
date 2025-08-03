const rssFeedService = require('./rssFeedService');
const articleExtractorService = require('./articleExtractorService');
const NodeCache = require('node-cache');

// 집계된 뉴스 캐시 (TTL: 1시간)
const aggregatedCache = new NodeCache({ stdTTL: 3600 });

/**
 * News Aggregator Service
 * 뉴스를 수집, 필터링, 점수화하여 Claude에게 전달할 데이터 준비
 */
class NewsAggregatorService {
  constructor() {
    // 중요 키워드 (가중치 포함)
    this.importantKeywords = {
      // 지역 관련 (높은 가중치)
      'great neck': 10,
      'manhasset': 10,
      'long island': 8,
      'nassau county': 7,
      'port washington': 6,
      'roslyn': 6,
      'lake success': 6,
      'flushing': 7,
      'queens': 6,
      
      // 한인 커뮤니티 관련
      'korean': 9,
      'korean american': 10,
      '한인': 10,
      '한국': 8,
      '코리안': 8,
      
      // 중요 이벤트
      'emergency': 10,
      'breaking': 9,
      'accident': 8,
      'fire': 8,
      'police': 7,
      'school': 7,
      'election': 7,
      'covid': 7,
      
      // 비즈니스/생활
      'business': 6,
      'restaurant': 6,
      'store': 5,
      'opening': 6,
      'closing': 6,
      
      // 이벤트/행사 (추가됨)
      'event': 7,
      'festival': 8,
      'concert': 8,
      'performance': 7,
      'exhibition': 7,
      'competition': 7,
      'tournament': 7,
      'celebration': 7,
      'ceremony': 6,
      'show': 6,
      'conference': 6,
      'workshop': 5,
      'fair': 6,
      '축제': 8,
      '콘서트': 8,
      '공연': 7,
      '대회': 7,
      '행사': 7,
      
      // 커뮤니티
      'community': 5,
      'church': 5,
      'meeting': 4
    };
    
    // 제외 키워드 (노이즈 필터링)
    this.excludeKeywords = [
      'advertisement',
      'sponsored',
      'promoted',
      '광고',
      '홍보'
    ];
  }

  /**
   * 뉴스 중요도 점수 계산
   */
  calculateRelevanceScore(article) {
    let score = 0;
    const text = `${article.title} ${article.description}`.toLowerCase();
    
    // 키워드 기반 점수
    for (const [keyword, weight] of Object.entries(this.importantKeywords)) {
      if (text.includes(keyword.toLowerCase())) {
        score += weight;
      }
    }
    
    // 제외 키워드가 있으면 점수 감소
    for (const keyword of this.excludeKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        score -= 10;
      }
    }
    
    // 날짜 기반 점수 (최신일수록 높음)
    const ageInDays = (Date.now() - new Date(article.pubDate)) / (1000 * 60 * 60 * 24);
    if (ageInDays < 1) score += 5;
    else if (ageInDays < 3) score += 3;
    else if (ageInDays < 7) score += 1;
    
    // 언어 보너스 (한국어 뉴스)
    if (article.language === 'ko') {
      score += 3;
    }
    
    // 우선순위 점수
    score += (5 - article.priority) * 2;
    
    return Math.max(0, score);
  }

  /**
   * 주간 뉴스 집계
   * @param {string|Array} locations - 크롤링할 지역명 또는 지역명 배열 (예: "Great Neck", ["Great Neck", "Manhasset", "Flushing"])
   * @param {Object} options - 추가 옵션
   * @param {boolean} options.extractFullArticles - 전체 기사 추출 여부 (기본: false)
   * @param {number} options.maxFullArticles - 전체 기사 추출 최대 개수 (기본: 7)
   */
  async aggregateWeeklyNews(locations, options = {}) {
    // locations를 배열로 변환하고 "/" 구분자 처리
    let locationArray;
    if (Array.isArray(locations)) {
      locationArray = locations;
    } else if (typeof locations === 'string' && locations.includes('/')) {
      // "/" 구분자로 분리
      locationArray = locations.split('/').map(loc => loc.trim()).filter(loc => loc);
    } else {
      locationArray = [locations];
    }
    
    const validLocations = locationArray.filter(loc => loc && loc.trim()).map(loc => loc.trim());
    
    // location이 없으면 기본값 사용
    const targetLocations = validLocations.length > 0 ? validLocations : ['Long Island'];
    
    // 캐시 키 생성 (여러 지역을 하나의 키로 관리)
    const locationKey = targetLocations.join('_').replace(/\s+/g, '_');
    const cacheKey = `weekly_${locationKey}_${new Date().toISOString().split('T')[0]}`;
    const cached = aggregatedCache.get(cacheKey);
    
    if (cached) {
      console.log(`📦 캐시된 주간 뉴스 사용: ${targetLocations.join(', ')}`);
      return cached;
    }
    
    try {
      // 최근 7일간 뉴스 가져오기 (지역 파라미터 전달)
      console.log(`📰 주간 뉴스 수집 시작... (지역: ${targetLocations.join(', ')})`);
      const recentNews = await rssFeedService.fetchRecentNews(7, targetLocations);
      
      // 점수 계산 및 정렬
      const scoredNews = recentNews.map(article => ({
        ...article,
        relevanceScore: this.calculateRelevanceScore(article)
      }));
      
      // 중요도순 정렬
      scoredNews.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      // 상위 뉴스만 선택 (최대 20개)
      let topNews = scoredNews.slice(0, 20);
      
      // 전체 기사 추출 옵션이 활성화된 경우
      if (options.extractFullArticles) {
        const maxArticles = options.maxFullArticles || 7;
        console.log(`📄 상위 ${maxArticles}개 뉴스의 전체 기사 추출 시작...`);
        
        // 직접 접근 가능한 소스 우선 처리
        const directAccessNews = topNews.filter(article => {
          // 직접 접근 가능한 소스 확인
          return article.source?.includes('Newsday') || 
                 article.source?.includes('Patch') || 
                 article.source?.includes('Long Island Press') ||
                 article.source?.includes('Korea Times');
        });
        
        const googleNews = topNews.filter(article => {
          return article.source?.includes('Google News');
        });
        
        // 직접 접근 가능한 기사 우선, 그 다음 Google News
        const prioritizedNews = [...directAccessNews, ...googleNews];
        
        // 상위 N개 기사의 URL 추출
        const articleUrls = prioritizedNews.slice(0, maxArticles).map(article => article.link);
        
        console.log(`📊 추출 대상: 직접 접근 ${directAccessNews.length}개, Google News ${googleNews.length}개`);
        
        // 전체 기사 내용 추출
        const fullArticles = await articleExtractorService.extractMultipleArticles(articleUrls, 2);
        
        // 추출된 전체 기사를 원본 뉴스 데이터와 병합
        topNews = topNews.map(article => {
          const fullArticle = fullArticles.find(fa => fa && fa.url === article.link);
          if (fullArticle) {
            return {
              ...article,
              fullContent: fullArticle.content,
              fullTitle: fullArticle.title || article.title,
              byline: fullArticle.byline,
              contentLength: fullArticle.length,
              hasFullContent: true
            };
          }
          return {
            ...article,
            hasFullContent: false
          };
        });
        
        console.log(`✅ 전체 기사 추출 완료: ${fullArticles.length}/${maxArticles}개 성공`);
      }
      
      // 카테고리별 분류
      const categorizedNews = this.categorizeNews(topNews);
      
      const result = {
        totalArticles: recentNews.length,
        selectedArticles: topNews.length,
        categorized: categorizedNews,
        articles: topNews,
        hasFullContent: options.extractFullArticles || false,
        generatedAt: new Date().toISOString()
      };
      
      aggregatedCache.set(cacheKey, result);
      console.log(`✅ 주간 뉴스 집계 완료: ${topNews.length}개 선택 (전체 ${recentNews.length}개)`);
      
      return result;
    } catch (error) {
      console.error('❌ 뉴스 집계 실패:', error);
      throw error;
    }
  }

  /**
   * 뉴스 카테고리 분류
   */
  categorizeNews(articles) {
    const categories = {
      emergency: [],    // 긴급/사고
      community: [],    // 커뮤니티/행사
      business: [],     // 비즈니스/경제
      education: [],    // 교육
      politics: [],     // 정치/행정
      other: []        // 기타
    };
    
    articles.forEach(article => {
      const text = `${article.title} ${article.description}`.toLowerCase();
      
      if (text.match(/(emergency|accident|fire|police|crime|arrest)/)) {
        categories.emergency.push(article);
      } else if (text.match(/(school|education|student|university|college)/)) {
        categories.education.push(article);
      } else if (text.match(/(business|economy|store|restaurant|company|market)/)) {
        categories.business.push(article);
      } else if (text.match(/(community|event|festival|church|gathering)/)) {
        categories.community.push(article);
      } else if (text.match(/(election|politics|government|mayor|council)/)) {
        categories.politics.push(article);
      } else {
        categories.other.push(article);
      }
    });
    
    return categories;
  }

  /**
   * Claude용 프롬프트 생성
   */
  formatForClaudePrompt(aggregatedData) {
    const { articles, categorized, hasFullContent } = aggregatedData;
    
    let prompt = '';
    
    if (hasFullContent) {
      // 전체 기사가 있는 경우
      const articlesWithFullContent = articles.filter(a => a.hasFullContent);
      const articlesWithoutFullContent = articles.filter(a => !a.hasFullContent);
      
      prompt = `다음은 실제로 크롤링된 뉴스입니다. ${articlesWithFullContent.length}개는 전체 기사 내용이 포함되어 있고, ${articlesWithoutFullContent.length}개는 요약만 제공됩니다.\n\n`;
      
      // 전체 기사가 있는 뉴스들 (최대 7개)
      if (articlesWithFullContent.length > 0) {
        prompt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        prompt += '【전체 기사 내용이 포함된 주요 뉴스】\n';
        prompt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        
        articlesWithFullContent.slice(0, 7).forEach((article, i) => {
          prompt += this.formatFullArticle(article, i + 1);
        });
      }
      
      // 요약만 있는 뉴스들
      if (articlesWithoutFullContent.length > 0) {
        prompt += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        prompt += '【추가 뉴스 (요약)】\n';
        prompt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        
        articlesWithoutFullContent.slice(0, 10).forEach((article, i) => {
          prompt += this.formatSingleArticle(article, articlesWithFullContent.length + i + 1);
        });
      }
      
      prompt += '\n\n📝 작성 지침:\n';
      prompt += '1. 전체 기사가 제공된 뉴스는 구체적인 내용을 바탕으로 상세히 설명해주세요.\n';
      prompt += '2. 각 뉴스마다 한 문단(7-10줄)으로 충실하게 요약해주세요.\n';
      prompt += '3. 한인 커뮤니티와의 관련성이나 영향을 언급해주세요.\n';
      prompt += '4. 사실 관계를 정확히 전달하고, 추측은 피해주세요.';
      
    } else {
      // 기존 방식 (요약만 있는 경우)
      prompt = `다음은 실제로 크롤링된 뉴스 ${articles.length}개입니다. 각 뉴스의 제목과 내용 요약이 제공됩니다:\n\n`;
      
      // 카테고리별로 뉴스 정리
      if (categorized.emergency.length > 0) {
        prompt += '【긴급/사고 뉴스】\n';
        categorized.emergency.slice(0, 3).forEach((article, i) => {
          prompt += this.formatSingleArticle(article, i + 1);
        });
        prompt += '\n';
      }
      
      if (categorized.community.length > 0) {
        prompt += '【커뮤니티/행사 뉴스】\n';
        categorized.community.slice(0, 3).forEach((article, i) => {
          prompt += this.formatSingleArticle(article, i + 1);
        });
        prompt += '\n';
      }
      
      if (categorized.business.length > 0) {
        prompt += '【비즈니스/경제 뉴스】\n';
        categorized.business.slice(0, 3).forEach((article, i) => {
          prompt += this.formatSingleArticle(article, i + 1);
        });
        prompt += '\n';
      }
      
      if (categorized.education.length > 0) {
        prompt += '【교육 뉴스】\n';
        categorized.education.slice(0, 2).forEach((article, i) => {
          prompt += this.formatSingleArticle(article, i + 1);
        });
        prompt += '\n';
      }
      
      prompt += '\n위 뉴스들의 제목과 요약 내용을 바탕으로, 각 뉴스를 한 문단(5-8줄)씩 상세하게 설명해주세요.';
    }
    
    return prompt;
  }

  /**
   * 전체 기사 포맷팅 (전체 내용 포함)
   */
  formatFullArticle(article, index) {
    const date = new Date(article.pubDate).toLocaleDateString('ko-KR', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // 전체 기사 내용을 토큰 제한에 맞게 요약
    const maxContentLength = 2000; // 각 기사당 최대 2000자
    let content = article.fullContent || article.description;
    
    if (content.length > maxContentLength) {
      // articleExtractorService의 요약 메서드 활용
      content = articleExtractorService.summarizeForTokenLimit(content, maxContentLength);
    }
    
    return `
╔════════════════════════════════════════════════════════════════════
║ 뉴스 #${index}: ${article.fullTitle || article.title}
╠════════════════════════════════════════════════════════════════════
║ 📅 날짜: ${date}
║ 📰 출처: ${article.source}
║ ✍️ 작성자: ${article.byline || '미상'}
║ 🔗 원문: ${article.link}
║ 📊 중요도: ${article.relevanceScore || 0}점
╠════════════════════════════════════════════════════════════════════
║ 【기사 전문】
╟────────────────────────────────────────────────────────────────────
${content.split('\n').map(line => '║ ' + line).join('\n')}
╚════════════════════════════════════════════════════════════════════

`;
  }

  /**
   * 단일 기사 포맷팅
   */
  formatSingleArticle(article, index) {
    const date = new Date(article.pubDate).toLocaleDateString('ko-KR', {
      timeZone: 'America/New_York',
      month: 'numeric',
      day: 'numeric'
    });
    
    // 설명이 너무 짧으면 전체 표시, 길면 잘라서 표시
    const descriptionLength = article.description.length;
    const description = descriptionLength > 300 
      ? article.description.substring(0, 300) + '...'
      : article.description;
    
    return `${index}. [${date}] ${article.title}
   - 내용: ${description}
   - 출처: ${article.source}
   - 링크: ${article.link}
   - 중요도 점수: ${article.relevanceScore || 0}점
`;
  }

  /**
   * 뉴스 소스 상태 확인
   */
  async checkSourcesHealth() {
    const results = [];
    for (const source of rssFeedService.feedSources) {
      try {
        const articles = await rssFeedService.parseFeed(source);
        results.push({
          name: source.name,
          status: 'active',
          articleCount: articles.length,
          lastChecked: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          name: source.name,
          status: 'error',
          error: error.message,
          lastChecked: new Date().toISOString()
        });
      }
    }
    return results;
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    aggregatedCache.flushAll();
    rssFeedService.clearCache();
    console.log('✨ 모든 뉴스 캐시 초기화 완료');
  }
}

module.exports = new NewsAggregatorService();
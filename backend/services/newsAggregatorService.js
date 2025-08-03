const rssFeedService = require('./rssFeedService');
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
   */
  async aggregateWeeklyNews(locations) {
    // locations를 배열로 변환
    const locationArray = Array.isArray(locations) ? locations : [locations];
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
      const topNews = scoredNews.slice(0, 20);
      
      // 카테고리별 분류
      const categorizedNews = this.categorizeNews(topNews);
      
      const result = {
        totalArticles: recentNews.length,
        selectedArticles: topNews.length,
        categorized: categorizedNews,
        articles: topNews,
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
    const { articles, categorized } = aggregatedData;
    
    let prompt = `다음은 실제로 크롤링된 뉴스 ${articles.length}개입니다. 각 뉴스의 제목과 내용 요약이 제공됩니다:\n\n`;
    
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
    
    return prompt;
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
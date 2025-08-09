const rssFeedService = require('./rssFeedService');
const articleExtractorService = require('./articleExtractorService');
const urlResolverService = require('./urlResolverService');
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
      'korean church': 10,
      'korean school': 9,
      'korean community': 9,
      'korean market': 8,
      'korean restaurant': 8,
      'h-mart': 8,
      'h mart': 8,
      'kimchi': 7,
      'k-pop': 7,
      'kpop': 7,
      '한인': 10,
      '한국': 8,
      '코리안': 8,
      '한인회': 10,
      '한국학교': 9,
      '한인마켓': 8,

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
   * @param {Object} article - 뉴스 기사
   * @param {Array} targetLocations - 요청된 지역 배열
   */
  calculateRelevanceScore(article, targetLocations = []) {
    let score = 0;
    const text = `${article.title} ${article.description}`.toLowerCase();

    // 요청된 지역에 대한 동적 가중치 부여
    if (targetLocations && targetLocations.length > 0) {
      for (const location of targetLocations) {
        const locationLower = location.toLowerCase();
        // 제목에 포함되면 15점, 내용에 포함되면 10점
        if (article.title.toLowerCase().includes(locationLower)) {
          score += 15;
        } else if (text.includes(locationLower)) {
          score += 10;
        }
      }
    }

    // 기본 키워드 기반 점수
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

      // 점수 계산 및 정렬 (요청된 지역 정보 전달)
      const scoredNews = recentNews.map(article => ({
        ...article,
        relevanceScore: this.calculateRelevanceScore(article, targetLocations)
      }));

      // 중요도순 정렬
      scoredNews.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // 상위 뉴스만 선택 (최대 20개)
      let topNews = scoredNews.slice(0, 20);

      // Google News URL 리졸브
      console.log('🔗 Google News URL 리졸브 시작...');
      for (const article of topNews) {
        if (article.link && article.link.includes('news.google.com/rss/articles/')) {
          try {
            const resolvedUrl = await urlResolverService.resolveGoogleNewsUrl(article.link);
            article.originalLink = article.link; // 원본 보관
            article.link = resolvedUrl;
          } catch (error) {
            console.warn(`⚠️ URL 리졸브 실패: ${article.title}`);
            // 실패시 원본 URL 유지
          }
        }
      }

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
   * 뉴스 카테고리 분류 (더 세밀한 분류)
   */
  categorizeNews(articles) {
    const categories = {
      emergency: [],        // 긴급/사고/안전
      koreanCommunity: [],  // 한인 커뮤니티
      koreanBusiness: [],   // 한인 비즈니스
      koreanEducation: [],  // 한인 교육 (추가)
      community: [],        // 일반 커뮤니티/행사
      business: [],         // 일반 비즈니스/경제
      education: [],        // 일반 교육
      health: [],          // 건강/의료 (추가)
      culture: [],          // 문화/K-POP/엔터테인먼트
      sports: [],          // 스포츠 (추가)
      realEstate: [],      // 부동산 (추가)
      transportation: [],   // 교통/인프라 (추가)
      politics: [],         // 정치/행정
      weather: [],         // 날씨/기상 (추가)
      other: []            // 기타
    };

    articles.forEach(article => {
      const text = `${article.title} ${article.description}`.toLowerCase();
      let categorized = false;

      // 1. 긴급/사고/안전 뉴스 최우선 확인
      if (text.match(/(emergency|breaking|urgent|accident|fire|police|crime|arrest|safety|alert|warning|closure|storm|disaster|flood|evacuation)/)) {
        categories.emergency.push(article);
        categorized = true;
      }

      // 2. 한인 관련 뉴스 세분화
      if (!categorized && text.match(/(korean|한인|한국|코리안|k-|korean american)/)) {
        if (text.match(/(school|교육|학교|학원|academy|education|sat|college|admission|scholarship|한글학교|태권도)/)) {
          categories.koreanEducation.push(article);
          categorized = true;
        } else if (text.match(/(business|store|restaurant|market|h-mart|한인마켓|가게|식당|한식당|미용실|여행사|보험|부동산)/)) {
          categories.koreanBusiness.push(article);
          categorized = true;
        } else if (text.match(/(church|community|커뮤니티|한인회|gathering|event|meeting|festival|celebration|바자회|음악회|봉사|donation)/)) {
          categories.koreanCommunity.push(article);
          categorized = true;
        } else if (text.match(/(k-pop|kpop|k-drama|korean drama|culture|concert|한류|bts|blackpink)/)) {
          categories.culture.push(article);
          categorized = true;
        } else {
          // 기타 한인 관련은 커뮤니티로 분류
          categories.koreanCommunity.push(article);
          categorized = true;
        }
      }

      // 3. 건강/의료 뉴스
      if (!categorized && text.match(/(health|hospital|clinic|doctor|medical|medicare|insurance|vaccination|covid|flu|dental|pharmacy|wellness|senior|elderly|nursing)/)) {
        categories.health.push(article);
        categorized = true;
      }

      // 4. 부동산 뉴스
      if (!categorized && text.match(/(real estate|housing|apartment|condo|rent|sale|mortgage|property|development|zoning|construction|하우스|아파트|렌트|매매)/)) {
        categories.realEstate.push(article);
        categorized = true;
      }

      // 5. 교통/인프라 뉴스
      if (!categorized && text.match(/(traffic|lirr|subway|bus|road|highway|parking|construction|infrastructure|transportation|commute|train|airport)/)) {
        categories.transportation.push(article);
        categorized = true;
      }

      // 6. 스포츠 뉴스
      if (!categorized && text.match(/(sports|baseball|basketball|football|soccer|tennis|golf|game|team|player|championship|tournament|olympic|athlete)/)) {
        categories.sports.push(article);
        categorized = true;
      }

      // 7. 날씨/기상 뉴스
      if (!categorized && text.match(/(weather|storm|snow|rain|temperature|forecast|hurricane|tornado|flood|heat|cold|climate)/)) {
        categories.weather.push(article);
        categorized = true;
      }

      // 8. 일반 교육 뉴스
      if (!categorized && text.match(/(school|education|student|teacher|university|college|campus|graduation|curriculum|board of education)/)) {
        categories.education.push(article);
        categorized = true;
      }

      // 9. 일반 비즈니스/경제
      if (!categorized && text.match(/(business|economy|store|restaurant|company|market|employment|job|hiring|opening|closing|retail|mall|shopping)/)) {
        categories.business.push(article);
        categorized = true;
      }

      // 10. 문화/엔터테인먼트
      if (!categorized && text.match(/(culture|art|music|concert|festival|entertainment|theater|movie|exhibition|museum|library|performance|show)/)) {
        categories.culture.push(article);
        categorized = true;
      }

      // 11. 정치/행정
      if (!categorized && text.match(/(election|politics|government|mayor|council|governor|vote|voting|candidate|democrat|republican|policy|law|legislation)/)) {
        categories.politics.push(article);
        categorized = true;
      }

      // 12. 커뮤니티 일반
      if (!categorized && text.match(/(community|event|gathering|meeting|volunteer|charity|fundraising|parade|fair|bazaar)/)) {
        categories.community.push(article);
        categorized = true;
      }

      // 13. 분류되지 않은 기타 뉴스
      if (!categorized) {
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

      prompt += '\n\n📝 작성 지침:\n\n';

      prompt += '【필수 작성 원칙】\n';
      prompt += '1. **사실 기반 작성**: 제공된 기사 내용만을 바탕으로 작성하고, 추측이나 가정은 절대 하지 마세요.\n';
      prompt += '2. **충실한 요약**: 각 뉴스마다 상세하고 구체적인 요약을 작성해주세요:\n';
      prompt += '   - 중요 뉴스(전체 기사 제공): 15-20줄의 심층 분석\n';
      prompt += '   - 일반 뉴스(요약만 제공): 10-15줄의 상세 요약\n';
      prompt += '   - 단순 나열이 아닌 스토리텔링 방식으로 작성\n';
      prompt += '\n';

      prompt += '【한인 커뮤니티 연관성 - 매우 중요】\n';
      prompt += '각 뉴스마다 다음 내용을 반드시 포함해주세요:\n';
      prompt += '1. 한인들에게 미치는 직접적인 영향 (구체적으로)\n';
      prompt += '2. 한인 가정/비즈니스/학생들이 알아야 할 중요 정보\n';
      prompt += '3. 대응 방법이나 참여 방법 (있다면)\n';
      prompt += '4. 관련 한인 단체, 교회, 학교, 비즈니스 언급 (해당하는 경우)\n';
      prompt += '5. 한인 밀집 지역에 미치는 구체적 영향\n';
      prompt += '\n';

      prompt += '【실용적 정보 포함】\n';
      prompt += '- 정확한 날짜, 시간, 장소 정보\n';
      prompt += '- 영향받는 구체적 거리명, 지역명\n';
      prompt += '- 문의처 전화번호나 이메일 (있다면)\n';
      prompt += '- 신청 방법이나 참여 절차 (해당하는 경우)\n';
      prompt += '- 비용이나 요금 정보 (언급된 경우)\n';
      prompt += '\n';

      prompt += '【작성 스타일】\n';
      prompt += '- 딱딱한 뉴스 보도가 아닌 커뮤니티 소식지 스타일\n';
      prompt += '- 독자와 대화하듯 친근한 어조\n';
      prompt += '- 중요한 정보는 **굵은 글씨**로 강조\n';
      prompt += '- 각 뉴스 사이에 자연스러운 연결과 전환\n';
      prompt += '\n';

      prompt += '【금지 사항】\n';
      prompt += '- 추측성 내용이나 확인되지 않은 정보 금지\n';
      prompt += '- 일반적인 조언이나 당연한 이야기 금지\n';
      prompt += '- "이 기사에 따르면", "보도에 의하면" 같은 표현 금지\n';

      prompt += '\n【출처 링크 포함 방법 - 매우 중요】\n';
      prompt += '- 각 뉴스 소개 문단 끝에 바로 [원문보기] 링크 추가\n';
      prompt += '- 형식: ... 관련 내용입니다. <a href="URL" target="_blank" style="color: #0066cc; text-decoration: none;">[원문보기]</a></p>\n';
      prompt += '- 각 뉴스마다 해당하는 링크를 정확히 매칭해서 포함\n';
      prompt += '- 절대 모든 링크를 마지막에 몰아서 넣지 마세요\n';
      prompt += '\n';

      prompt += '【마무리】\n';
      prompt += '- 전체 내용을 간단히 정리하는 마무리 문단 추가\n';
      prompt += '- 다음 주 예상되는 중요 일정이나 행사 언급 (있다면)\n';
      prompt += '- 한인 커뮤니티에 도움이 되는 따뜻한 메시지로 마무리';

    } else {
      // 기존 방식 (요약만 있는 경우)
      prompt = `다음은 실제로 크롤링된 뉴스 ${articles.length}개입니다. 각 뉴스의 제목과 내용 요약이 제공됩니다:\n\n`;

      // 카테고리별로 뉴스 정리
      let articleIndex = 1;

      if (categorized.emergency.length > 0) {
        prompt += '【🚨 긴급/사고 뉴스】\n';
        categorized.emergency.slice(0, 2).forEach(article => {
          prompt += this.formatSingleArticle(article, articleIndex++);
        });
        prompt += '\n';
      }

      if (categorized.koreanCommunity.length > 0) {
        prompt += '【🇰🇷 한인 커뮤니티 뉴스】\n';
        categorized.koreanCommunity.slice(0, 3).forEach(article => {
          prompt += this.formatSingleArticle(article, articleIndex++);
        });
        prompt += '\n';
      }

      if (categorized.koreanBusiness.length > 0) {
        prompt += '【💼 한인 비즈니스 뉴스】\n';
        categorized.koreanBusiness.slice(0, 2).forEach(article => {
          prompt += this.formatSingleArticle(article, articleIndex++);
        });
        prompt += '\n';
      }

      if (categorized.community.length > 0) {
        prompt += '【🏘️ 지역 커뮤니티 뉴스】\n';
        categorized.community.slice(0, 2).forEach(article => {
          prompt += this.formatSingleArticle(article, articleIndex++);
        });
        prompt += '\n';
      }

      if (categorized.business.length > 0) {
        prompt += '【📈 비즈니스/경제 뉴스】\n';
        categorized.business.slice(0, 2).forEach(article => {
          prompt += this.formatSingleArticle(article, articleIndex++);
        });
        prompt += '\n';
      }

      if (categorized.education.length > 0) {
        prompt += '【🎓 교육 뉴스】\n';
        categorized.education.slice(0, 2).forEach(article => {
          prompt += this.formatSingleArticle(article, articleIndex++);
        });
        prompt += '\n';
      }

      if (categorized.culture.length > 0) {
        prompt += '【🎭 문화/K-POP 뉴스】\n';
        categorized.culture.slice(0, 2).forEach(article => {
          prompt += this.formatSingleArticle(article, articleIndex++);
        });
        prompt += '\n';
      }

      prompt += '\n\n📝 작성 지침:\n\n';

      prompt += '【필수 작성 원칙】\n';
      prompt += '1. **사실 기반 작성**: 제공된 뉴스 제목과 요약만을 바탕으로 작성\n';
      prompt += '2. **충실한 요약**: 각 뉴스마다 10-15줄의 상세한 설명\n';
      prompt += '3. **스토리텔링**: 단순 나열이 아닌 자연스러운 이야기 형식\n';
      prompt += '\n';

      prompt += '【한인 커뮤니티 연관성 필수】\n';
      prompt += '각 뉴스마다 반드시 포함:\n';
      prompt += '- 한인들에게 미치는 구체적 영향\n';
      prompt += '- 한인 가정/비즈니스/학생 관련 정보\n';
      prompt += '- 관련 한인 단체나 장소 언급\n';
      prompt += '\n';

      prompt += '【실용 정보】\n';
      prompt += '- 정확한 날짜, 시간, 장소\n';
      prompt += '- 영향받는 구체적 지역\n';
      prompt += '- 참여/대응 방법\n';
      prompt += '\n';

      prompt += '【금지 사항】\n';
      prompt += '- 추측성 내용 금지\n';
      prompt += '- 일반론적 조언 금지\n';

      prompt += '\n\n【출처 링크 포함 방법】\n';
      prompt += '- 각 뉴스 소개 바로 뒤에 [원문보기] 링크 추가\n';
      prompt += '- 형식: <a href="URL" target="_blank" style="color: #0066cc;">[원문보기]</a>\n';
      prompt += '- 각 뉴스의 정확한 링크를 매칭해서 포함';
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
║ 🔗 링크: ${article.link}
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
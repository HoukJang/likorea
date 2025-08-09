const Parser = require('rss-parser');
const axios = require('axios');
const NodeCache = require('node-cache');

// RSS 파서 초기화
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['media:thumbnail', 'thumbnail'],
      ['description', 'description'],
      ['content:encoded', 'content']
    ]
  }
});

// 캐시 설정 (TTL: 30분)
const cache = new NodeCache({ stdTTL: 1800 });

/**
 * RSS Feed Service
 * Long Island 지역 뉴스를 RSS 피드로부터 수집
 */
class RSSFeedService {
  constructor() {
    // 기본 RSS 피드 소스 (지역 무관)
    this.defaultFeedSources = [
      // 직접 접근 가능한 로컬 뉴스 소스
      // Note: Some RSS feeds may be temporarily unavailable
      // {
      //   name: 'Newsday - Long Island',
      //   url: 'https://www.newsday.com/feed/',
      //   language: 'en',
      //   priority: 1,
      //   directAccess: true
      // },
      // {
      //   name: 'Patch - Great Neck',
      //   url: 'https://patch.com/new-york/greatneck/rss',
      //   language: 'en',
      //   priority: 2,
      //   directAccess: true
      // },
      // {
      //   name: 'Patch - Manhasset',
      //   url: 'https://patch.com/new-york/manhasset/rss',
      //   language: 'en',
      //   priority: 2,
      //   directAccess: true
      // },
      {
        name: 'Long Island Press',
        url: 'https://longislandpress.com/feed/',
        language: 'en',
        priority: 2,
        directAccess: true
      },
      // Google News 피드 (리졸브 필요)
      {
        name: 'Google News - Long Island',
        url: 'https://news.google.com/rss/search?q=Long+Island+New+York&hl=en-US&gl=US&ceid=US:en',
        language: 'en',
        priority: 3,
        directAccess: false
      },
      {
        name: 'Google News - Nassau County',
        url: 'https://news.google.com/rss/search?q=Nassau+County+New+York&hl=en-US&gl=US&ceid=US:en',
        language: 'en',
        priority: 4,
        directAccess: false
      },
      // 한국어 뉴스 소스 (한인 커뮤니티 관련)
      {
        name: 'Korea Times NY',
        url: 'https://www.koreatimes.com/rss',
        language: 'ko',
        priority: 1,
        directAccess: true
      },
      {
        name: 'Google News - 롱아일랜드 한인',
        url: 'https://news.google.com/rss/search?q=' + encodeURIComponent('롱아일랜드 한인') + '&hl=ko&gl=US&ceid=US:ko',
        language: 'ko',
        priority: 3,
        directAccess: false
      },
      {
        name: 'Google News - 뉴욕 한인',
        url: 'https://news.google.com/rss/search?q=' + encodeURIComponent('뉴욕 한인') + '&hl=ko&gl=US&ceid=US:ko',
        language: 'ko',
        priority: 4,
        directAccess: false
      }
    ];

    // 현재 활성화된 피드 소스
    this.feedSources = [...this.defaultFeedSources];
  }

  /**
   * 지역 기반 동적 피드 소스 생성
   * @param {string|Array} locations - 검색할 지역명 또는 지역명 배열 (예: "Great Neck", ["Great Neck", "Manhasset", "Flushing"])
   */
  setLocationFeeds(locations) {
    // 기본 피드 복사
    this.feedSources = [...this.defaultFeedSources];

    // locations를 배열로 변환
    const locationArray = Array.isArray(locations) ? locations : [locations];

    // 비어있거나 유효하지 않은 경우 기본 피드만 사용
    const validLocations = locationArray.filter(loc => loc && loc.trim());
    if (validLocations.length === 0) {
      return;
    }

    // 각 지역에 대한 피드 추가
    const locationFeeds = [];

    for (const location of validLocations) {
      const cleanLocation = location.trim();

      // 영어 뉴스
      locationFeeds.push({
        name: `Google News - ${cleanLocation}`,
        url: `https://news.google.com/rss/search?q=${encodeURIComponent(cleanLocation + ' New York')}&hl=en-US&gl=US&ceid=US:en`,
        language: 'en',
        priority: 1
      });

      // 한국어 뉴스 (지역 + 한인)
      locationFeeds.push({
        name: `Google News - ${cleanLocation} 한인`,
        url: `https://news.google.com/rss/search?q=${encodeURIComponent(cleanLocation + ' 한인')}&hl=ko&gl=US&ceid=US:ko`,
        language: 'ko',
        priority: 1
      });

      // 비즈니스 뉴스
      locationFeeds.push({
        name: `Google News - ${cleanLocation} Business`,
        url: `https://news.google.com/rss/search?q=${encodeURIComponent(cleanLocation + ' business restaurant store')}&hl=en-US&gl=US&ceid=US:en`,
        language: 'en',
        priority: 2
      });

      // 학교/교육 뉴스
      locationFeeds.push({
        name: `Google News - ${cleanLocation} School`,
        url: `https://news.google.com/rss/search?q=${encodeURIComponent(cleanLocation + ' school education')}&hl=en-US&gl=US&ceid=US:en`,
        language: 'en',
        priority: 2
      });
    }

    // 피드 소스 앞부분에 추가 (우선순위 높음)
    this.feedSources = [...locationFeeds, ...this.defaultFeedSources];

    console.log(`📍 지역 설정: ${validLocations.join(', ')} (${locationFeeds.length}개 피드 추가)`);
  }

  /**
   * 단일 RSS 피드 파싱
   */
  async parseFeed(feedSource) {
    const cacheKey = `rss_${feedSource.name}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      console.log(`📦 캐시에서 로드: ${feedSource.name}`);
      return cached;
    }

    try {
      console.log(`🔄 RSS 피드 가져오기: ${feedSource.name}`);
      const feed = await parser.parseURL(feedSource.url);

      const articles = feed.items.map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        description: item.contentSnippet || item.description,
        source: feedSource.name,
        language: feedSource.language,
        priority: feedSource.priority,
        guid: item.guid || item.link
      }));

      cache.set(cacheKey, articles);
      return articles;
    } catch (error) {
      console.error(`❌ RSS 피드 파싱 실패 (${feedSource.name}):`, error.message);
      return [];
    }
  }

  /**
   * 모든 피드에서 뉴스 수집
   * @param {string} location - 선택적 지역 파라미터
   */
  async fetchAllNews(location) {
    // 지역이 지정되면 피드 소스 업데이트
    if (location) {
      this.setLocationFeeds(location);
    }

    const allArticles = [];

    // 병렬로 모든 피드 파싱
    const promises = this.feedSources.map(source => this.parseFeed(source));
    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        allArticles.push(...result.value);
      } else {
        console.warn(`⚠️ 피드 수집 실패: ${this.feedSources[index].name}`);
      }
    });

    // 중복 제거 (같은 제목 또는 같은 링크)
    const uniqueArticles = this.removeDuplicates(allArticles);

    // 날짜순 정렬 (최신순)
    uniqueArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    return uniqueArticles;
  }

  /**
   * 특정 기간의 뉴스만 필터링
   * @param {number} days - 최근 며칠간의 뉴스
   * @param {string} location - 선택적 지역 파라미터
   */
  async fetchRecentNews(days = 7, location) {
    const allNews = await this.fetchAllNews(location);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return allNews.filter(article => {
      const articleDate = new Date(article.pubDate);
      return articleDate >= cutoffDate;
    });
  }

  /**
   * 키워드 기반 뉴스 필터링
   */
  filterNewsByKeywords(articles, keywords) {
    if (!keywords || keywords.length === 0) return articles;

    return articles.filter(article => {
      const text = `${article.title} ${article.description}`.toLowerCase();
      return keywords.some(keyword => text.includes(keyword.toLowerCase()));
    });
  }

  /**
   * 중복 제거
   */
  removeDuplicates(articles) {
    const seen = new Set();
    return articles.filter(article => {
      // 제목과 링크를 기준으로 중복 체크
      const key = `${article.title.toLowerCase().trim()}`;
      const linkKey = article.link;

      if (seen.has(key) || seen.has(linkKey)) {
        return false;
      }

      seen.add(key);
      seen.add(linkKey);
      return true;
    });
  }

  /**
   * 뉴스 요약을 위한 포맷팅
   */
  formatForClaude(articles, maxArticles = 10) {
    const limitedArticles = articles.slice(0, maxArticles);

    return limitedArticles.map((article, index) => {
      const date = new Date(article.pubDate).toLocaleDateString('ko-KR', {
        timeZone: 'America/New_York',
        month: 'long',
        day: 'numeric'
      });

      return `[뉴스 ${index + 1}]
제목: ${article.title}
날짜: ${date}
요약: ${article.description}
출처: ${article.source}
링크: ${article.link}
언어: ${article.language === 'ko' ? '한국어' : '영어'}`;
    }).join('\n\n');
  }

  /**
   * 캐시 클리어
   */
  clearCache() {
    cache.flushAll();
    console.log('✨ RSS 캐시 초기화 완료');
  }

  /**
   * 특정 소스 추가
   */
  addFeedSource(name, url, language = 'en', priority = 5) {
    this.feedSources.push({
      name,
      url,
      language,
      priority
    });
  }
}

module.exports = new RSSFeedService();
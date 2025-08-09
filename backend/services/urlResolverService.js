const axios = require('axios');
const NodeCache = require('node-cache');

// URL 리졸브 캐시 (TTL: 24시간)
const urlCache = new NodeCache({ stdTTL: 86400 });

/**
 * URL Resolver Service
 * Google News 등의 리다이렉트 URL을 실제 기사 URL로 변환
 */
class UrlResolverService {
  constructor() {
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
  }

  /**
   * Google News URL을 실제 기사 URL로 변환
   * @param {string} googleNewsUrl - Google News RSS URL
   * @returns {string} 실제 기사 URL
   */
  async resolveGoogleNewsUrl(googleNewsUrl) {
    // 캐시 확인
    const cached = urlCache.get(googleNewsUrl);
    if (cached) {
      console.log(`📦 캐시된 URL 사용: ${cached.substring(0, 50)}...`);
      return cached;
    }

    try {
      // Google News URL 패턴 확인
      if (!googleNewsUrl.includes('news.google.com/rss/articles/')) {
        return googleNewsUrl; // 이미 실제 URL인 경우
      }

      console.log('🔄 Google News URL 리졸빙 시도...');

      // 방법 1: HEAD 요청으로 리다이렉트 추적
      try {
        const response = await axios.head(googleNewsUrl, {
          headers: this.headers,
          maxRedirects: 0, // 리다이렉트를 수동으로 처리
          validateStatus: (status) => status >= 200 && status < 400
        });

        if (response.headers.location) {
          const resolvedUrl = response.headers.location;
          urlCache.set(googleNewsUrl, resolvedUrl);
          console.log(`✅ URL 리졸브 성공 (HEAD): ${resolvedUrl.substring(0, 50)}...`);
          return resolvedUrl;
        }
      } catch (headError) {
        // HEAD 실패시 GET 시도
      }

      // 방법 2: GET 요청으로 최종 URL 확인
      const response = await axios.get(googleNewsUrl, {
        headers: this.headers,
        maxRedirects: 10,
        timeout: 5000
      });

      // 최종 URL 추출
      const finalUrl = response.request?.res?.responseUrl ||
                      response.request?.path ||
                      response.config?.url ||
                      googleNewsUrl;

      if (finalUrl !== googleNewsUrl) {
        urlCache.set(googleNewsUrl, finalUrl);
        console.log(`✅ URL 리졸브 성공 (GET): ${finalUrl.substring(0, 50)}...`);
        return finalUrl;
      }

      // 방법 3: HTML 내에서 canonical URL 찾기
      if (response.data && typeof response.data === 'string') {
        const canonicalMatch = response.data.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
        if (canonicalMatch && canonicalMatch[1]) {
          const canonicalUrl = canonicalMatch[1];
          urlCache.set(googleNewsUrl, canonicalUrl);
          console.log(`✅ URL 리졸브 성공 (Canonical): ${canonicalUrl.substring(0, 50)}...`);
          return canonicalUrl;
        }

        // meta refresh 태그 확인
        const refreshMatch = response.data.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["']\d+;url=([^"']+)["']/i);
        if (refreshMatch && refreshMatch[1]) {
          const refreshUrl = refreshMatch[1];
          urlCache.set(googleNewsUrl, refreshUrl);
          console.log(`✅ URL 리졸브 성공 (Meta Refresh): ${refreshUrl.substring(0, 50)}...`);
          return refreshUrl;
        }
      }

      console.log('⚠️ URL 리졸브 실패, 원본 URL 사용');
      return googleNewsUrl;

    } catch (error) {
      console.error(`❌ URL 리졸브 오류: ${error.message}`);
      return googleNewsUrl; // 실패시 원본 URL 반환
    }
  }

  /**
   * 여러 URL 일괄 리졸브
   * @param {Array<string>} urls - URL 배열
   * @returns {Array<string>} 리졸브된 URL 배열
   */
  async resolveMultipleUrls(urls) {
    const resolved = [];

    for (const url of urls) {
      try {
        const resolvedUrl = await this.resolveGoogleNewsUrl(url);
        resolved.push(resolvedUrl);

        // 요청 간 지연 (봇 차단 방지)
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`URL 리졸브 실패: ${url}`);
        resolved.push(url); // 실패시 원본 URL 사용
      }
    }

    return resolved;
  }

  /**
   * URL이 접근 가능한지 확인
   * @param {string} url - 확인할 URL
   * @returns {boolean} 접근 가능 여부
   */
  async isUrlAccessible(url) {
    try {
      const response = await axios.head(url, {
        headers: this.headers,
        timeout: 3000,
        validateStatus: (status) => status < 400
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    urlCache.flushAll();
    console.log('✨ URL 리졸버 캐시 초기화 완료');
  }

  /**
   * 캐시 통계
   */
  getCacheStats() {
    return {
      keys: urlCache.keys().length,
      hits: urlCache.getStats().hits,
      misses: urlCache.getStats().misses,
      hitRate: urlCache.getStats().hits / (urlCache.getStats().hits + urlCache.getStats().misses) || 0
    };
  }
}

module.exports = new UrlResolverService();
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

/**
 * Web Search Service
 * 다양한 검색 API를 통합하여 웹 검색 기능 제공
 */
class WebSearchService {
  constructor() {
    // API 키 설정 (환경 변수에서 가져오기)
    this.googleApiKey = process.env.GOOGLE_API_KEY;
    this.googleCx = process.env.GOOGLE_CUSTOM_SEARCH_ID;
    this.bingApiKey = process.env.BING_API_KEY;
    this.serpApiKey = process.env.SERPAPI_KEY;
  }

  /**
   * Google Custom Search API
   * 무료: 100 queries/day
   */
  async googleSearch(query, options = {}) {
    if (!this.googleApiKey || !this.googleCx) {
      console.log('⚠️ Google Search API 키가 설정되지 않았습니다');
      return [];
    }

    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: this.googleApiKey,
          cx: this.googleCx,
          q: query,
          num: options.num || 10,
          dateRestrict: options.dateRestrict || 'd7', // 최근 7일
          lr: options.language || 'lang_en|lang_ko' // 영어 또는 한국어
        }
      });

      return response.data.items?.map(item => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        source: 'Google Search'
      })) || [];
    } catch (error) {
      console.error('Google Search API 오류:', error.message);
      return [];
    }
  }

  /**
   * Bing Search API
   * 유료 (Azure Cognitive Services)
   */
  async bingSearch(query, options = {}) {
    if (!this.bingApiKey) {
      console.log('⚠️ Bing Search API 키가 설정되지 않았습니다');
      return [];
    }

    try {
      const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
        headers: {
          'Ocp-Apim-Subscription-Key': this.bingApiKey
        },
        params: {
          q: query,
          count: options.count || 10,
          freshness: options.freshness || 'Week', // Day, Week, Month
          mkt: options.market || 'en-US',
          safeSearch: 'Moderate'
        }
      });

      return response.data.webPages?.value?.map(page => ({
        title: page.name,
        link: page.url,
        snippet: page.snippet,
        source: 'Bing Search'
      })) || [];
    } catch (error) {
      console.error('Bing Search API 오류:', error.message);
      return [];
    }
  }

  /**
   * SerpAPI - Google 검색 결과
   * 유료 (월 $50부터)
   */
  async serpApiSearch(query, options = {}) {
    if (!this.serpApiKey) {
      console.log('⚠️ SerpAPI 키가 설정되지 않았습니다');
      return [];
    }

    try {
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          api_key: this.serpApiKey,
          q: query,
          location: options.location || 'Long Island, New York',
          hl: options.language || 'en',
          gl: options.country || 'us',
          num: options.num || 10,
          tbs: options.timeRange || 'qdr:w' // 최근 1주일
        }
      });

      return response.data.organic_results?.map(result => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet,
        source: 'SerpAPI'
      })) || [];
    } catch (error) {
      console.error('SerpAPI 오류:', error.message);
      return [];
    }
  }

  /**
   * DuckDuckGo HTML 스크래핑 (무료, 제한적)
   * API 없이 HTML 파싱
   */
  async duckDuckGoSearch(query, options = {}) {
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const results = [];

      $('.result').each((i, elem) => {
        if (i >= (options.num || 10)) return false;

        const title = $(elem).find('.result__title').text().trim();
        const link = $(elem).find('.result__url').attr('href');
        const snippet = $(elem).find('.result__snippet').text().trim();

        if (title && link) {
          results.push({
            title,
            link,
            snippet,
            source: 'DuckDuckGo'
          });
        }
      });

      return results;
    } catch (error) {
      console.error('DuckDuckGo 검색 오류:', error.message);
      return [];
    }
  }

  /**
   * 통합 검색 - 사용 가능한 API로 자동 검색
   */
  async search(query, options = {}) {
    console.log(`🔍 웹 검색 시작: "${query}"`);

    // 우선순위에 따라 시도
    let results = [];

    // 1. Google Custom Search 시도
    if (this.googleApiKey) {
      results = await this.googleSearch(query, options);
      if (results.length > 0) return results;
    }

    // 2. Bing Search 시도
    if (this.bingApiKey) {
      results = await this.bingSearch(query, options);
      if (results.length > 0) return results;
    }

    // 3. SerpAPI 시도
    if (this.serpApiKey) {
      results = await this.serpApiSearch(query, options);
      if (results.length > 0) return results;
    }

    // 4. 모든 유료 API가 없으면 DuckDuckGo 사용
    console.log('ℹ️ 유료 API가 설정되지 않아 DuckDuckGo를 사용합니다');
    results = await this.duckDuckGoSearch(query, options);

    return results;
  }

  /**
   * 뉴스 특화 검색
   */
  async searchNews(location, options = {}) {
    const queries = [
      `${location} news today`,
      `${location} Korean community news`,
      `${location} 한인 뉴스`,
      `${location} events this week`
    ];

    const allResults = [];

    for (const query of queries) {
      const results = await this.search(query, {
        ...options,
        num: 5 // 각 쿼리당 5개씩
      });
      allResults.push(...results);
    }

    // 중복 제거
    const uniqueResults = [];
    const seenUrls = new Set();

    for (const result of allResults) {
      if (!seenUrls.has(result.link)) {
        seenUrls.add(result.link);
        uniqueResults.push(result);
      }
    }

    return uniqueResults;
  }
}

module.exports = new WebSearchService();
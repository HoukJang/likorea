const axios = require('axios');
const cheerio = require('cheerio');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const NodeCache = require('node-cache');
const urlResolverService = require('./urlResolverService');

// 기사 캐시 (TTL: 2시간)
const articleCache = new NodeCache({ stdTTL: 7200 });

/**
 * Article Extractor Service
 * 웹 페이지에서 기사 전문을 추출하는 서비스
 */
class ArticleExtractorService {
  constructor() {
    // User-Agent 설정 (봇 차단 방지)
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
    
    // 신뢰할 수 있는 뉴스 도메인별 선택자
    this.siteSelectors = {
      'nytimes.com': 'article section.meteredContent',
      'cnn.com': 'div.article__content',
      'bbc.com': 'article div[data-component="text-block"]',
      'newsday.com': 'div.article-body',
      'patch.com': 'div.article-content',
      'nbcnewyork.com': 'div.article-content',
      'abc7ny.com': 'div.article-body',
      'cbsnews.com': 'section.content__body',
      'foxnews.com': 'div.article-body',
      'pix11.com': 'div.article-content',
      'ny1.com': 'div.article-text',
      'qns.com': 'div.entry-content',
      'default': 'article, main, [role="main"], .article-body, .article-content, .entry-content'
    };

    // 제거해야 할 요소들
    this.removeSelectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      '.advertisement',
      '.ads',
      '.social-share',
      '.related-articles',
      '.comments',
      '.newsletter-signup',
      '[class*="promo"]',
      '[class*="banner"]',
      '[id*="ad-"]',
      '[class*="ad-"]'
    ];
  }

  /**
   * URL에서 기사 전문 추출
   * @param {string} url - 기사 URL
   * @returns {Object} 추출된 기사 정보
   */
  async extractArticle(url) {
    // Google News URL인 경우 실제 URL로 리졸브
    let targetUrl = url;
    if (url.includes('news.google.com/rss/articles/')) {
      targetUrl = await urlResolverService.resolveGoogleNewsUrl(url);
      console.log(`🔗 URL 리졸브: ${url.substring(0, 30)}... → ${targetUrl.substring(0, 50)}...`);
    }
    
    // 캐시 확인 (리졸브된 URL 기준)
    const cacheKey = `article_${targetUrl}`;
    const cached = articleCache.get(cacheKey);
    if (cached) {
      console.log(`📦 캐시에서 기사 로드: ${targetUrl.substring(0, 50)}...`);
      return cached;
    }

    try {
      console.log(`🔄 기사 추출 시작: ${targetUrl.substring(0, 50)}...`);
      
      // 1. HTML 가져오기
      const response = await axios.get(targetUrl, {
        headers: this.headers,
        timeout: 10000,
        maxRedirects: 5
      });

      const html = response.data;

      // 2. Mozilla Readability 사용하여 기사 추출
      const article = this.extractWithReadability(html, targetUrl);
      
      // 3. Readability가 실패하면 사이트별 선택자 사용
      if (!article || !article.content || article.content.length < 500) {
        console.log('⚠️ Readability 추출 실패, 사이트별 선택자 시도...');
        const fallbackArticle = this.extractWithSelectors(html, targetUrl);
        if (fallbackArticle && fallbackArticle.content.length > article?.content?.length) {
          return fallbackArticle;
        }
      }

      // 4. 결과 캐싱
      if (article && article.content) {
        articleCache.set(cacheKey, article);
        console.log(`✅ 기사 추출 성공: ${article.title || 'No title'}`);
      }

      return article;

    } catch (error) {
      console.error(`❌ 기사 추출 실패 (${url}):`, error.message);
      
      // Google 캐시 시도
      if (!url.includes('webcache.googleusercontent.com')) {
        console.log('🔄 Google 캐시 시도...');
        return this.extractFromGoogleCache(url);
      }
      
      return null;
    }
  }

  /**
   * Mozilla Readability를 사용한 추출
   */
  extractWithReadability(html, url) {
    try {
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (article) {
        // HTML 태그 제거하고 텍스트만 추출
        const $ = cheerio.load(article.content);
        const textContent = $.text().trim();
        
        return {
          title: article.title,
          content: textContent,
          excerpt: article.excerpt,
          byline: article.byline,
          length: article.length,
          siteName: article.siteName,
          url: url,
          extractedAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Readability 파싱 오류:', error.message);
    }
    return null;
  }

  /**
   * 사이트별 선택자를 사용한 추출
   */
  extractWithSelectors(html, url) {
    try {
      const $ = cheerio.load(html);
      
      // 제거할 요소들 삭제
      this.removeSelectors.forEach(selector => {
        $(selector).remove();
      });

      // 도메인 추출
      const domain = new URL(url).hostname.replace('www.', '');
      const siteKey = Object.keys(this.siteSelectors).find(key => domain.includes(key));
      const selector = this.siteSelectors[siteKey] || this.siteSelectors.default;

      // 기사 본문 추출
      const articleElement = $(selector).first();
      let content = '';
      
      if (articleElement.length) {
        // 모든 단락 추출
        articleElement.find('p').each((i, elem) => {
          const text = $(elem).text().trim();
          if (text.length > 30) { // 짧은 단락 제외
            content += text + '\n\n';
          }
        });

        // 단락이 없으면 전체 텍스트 추출
        if (!content) {
          content = articleElement.text().trim();
        }
      }

      // 제목 추출
      const title = $('h1').first().text().trim() || 
                   $('title').text().trim() || 
                   'No title';

      // 저자 추출
      const byline = $('[class*="author"], [class*="byline"], [rel="author"]').first().text().trim();

      if (content && content.length > 200) {
        return {
          title,
          content,
          byline,
          length: content.length,
          url,
          extractedAt: new Date().toISOString()
        };
      }

    } catch (error) {
      console.error('선택자 기반 추출 오류:', error.message);
    }
    return null;
  }

  /**
   * Google 캐시에서 기사 추출 시도
   */
  async extractFromGoogleCache(originalUrl) {
    try {
      const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(originalUrl)}`;
      return await this.extractArticle(cacheUrl);
    } catch (error) {
      console.error('Google 캐시 추출 실패:', error.message);
      return null;
    }
  }

  /**
   * 여러 기사 일괄 추출
   */
  async extractMultipleArticles(urls, maxConcurrent = 3) {
    const results = [];
    
    // 동시 실행 제한을 위한 배치 처리
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      const batch = urls.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(url => 
        this.extractArticle(url).catch(err => {
          console.error(`기사 추출 실패: ${url}`, err.message);
          return null;
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // 요청 간 지연 (봇 차단 방지)
      if (i + maxConcurrent < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results.filter(article => article !== null);
  }

  /**
   * 기사 내용 요약 (토큰 제한 대응)
   */
  summarizeForTokenLimit(content, maxLength = 3000) {
    if (!content || content.length <= maxLength) {
      return content;
    }

    // 문장 단위로 자르기
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    let summary = '';
    let currentLength = 0;

    // 처음과 끝 부분을 균형있게 포함
    const importantSentences = [
      ...sentences.slice(0, Math.floor(sentences.length * 0.3)), // 처음 30%
      ...sentences.slice(Math.floor(sentences.length * 0.7))      // 마지막 30%
    ];

    for (const sentence of importantSentences) {
      if (currentLength + sentence.length > maxLength) {
        break;
      }
      summary += sentence + ' ';
      currentLength += sentence.length;
    }

    // 중간 부분도 일부 포함
    if (currentLength < maxLength * 0.8) {
      const middleSentences = sentences.slice(
        Math.floor(sentences.length * 0.3),
        Math.floor(sentences.length * 0.7)
      );
      
      for (const sentence of middleSentences) {
        if (currentLength + sentence.length > maxLength) {
          break;
        }
        summary += sentence + ' ';
        currentLength += sentence.length;
      }
    }

    return summary.trim() + '...';
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    articleCache.flushAll();
    console.log('✨ 기사 캐시 초기화 완료');
  }
}

module.exports = new ArticleExtractorService();
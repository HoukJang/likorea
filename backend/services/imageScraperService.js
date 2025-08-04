const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Stealth 플러그인 추가 (봇 감지 우회)
puppeteer.use(StealthPlugin());

/**
 * 이미지 스크레이핑 서비스
 * API 키 없이 이미지를 수집하는 다양한 방법들
 */
class ImageScraperService {
  constructor() {
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
  }

  /**
   * 방법 1: Google 이미지 검색 (Simple HTML Parsing)
   * 제한적이지만 빠름
   */
  async scrapeGoogleImagesSimple(query) {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&hl=ko&gl=us`;
      
      const response = await axios.get(searchUrl, {
        headers: this.headers,
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      const images = [];
      
      // Google 이미지 검색 결과에서 이미지 URL 추출
      // 주의: Google은 HTML 구조를 자주 변경함
      $('img').each((index, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && src.startsWith('http') && !src.includes('google.com')) {
          images.push(src);
        }
      });
      
      // base64 인코딩된 썸네일도 추출 가능
      const scriptTags = $('script').text();
      const base64Images = scriptTags.match(/data:image\/[^;]+;base64,[^"]+/g) || [];
      
      console.log(`✅ Google 이미지 검색: ${images.length}개 발견`);
      return images.slice(0, 5); // 상위 5개만
      
    } catch (error) {
      console.error('Google 이미지 스크레이핑 실패:', error.message);
      return [];
    }
  }

  /**
   * 방법 2: DuckDuckGo 이미지 검색 (더 간단함)
   * API 키 불필요, 봇 감지 덜 엄격
   */
  async scrapeDuckDuckGoImages(query) {
    try {
      // DuckDuckGo는 JSON API를 제공 (비공식)
      const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iar=images&iax=images&ia=images`;
      
      const response = await axios.get(searchUrl, {
        headers: this.headers,
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      const images = [];
      
      // DuckDuckGo 이미지 추출
      $('.tile--img__img').each((index, element) => {
        const src = $(element).attr('data-src') || $(element).attr('src');
        if (src && src.startsWith('http')) {
          images.push(src);
        }
      });
      
      // JavaScript에서 로드되는 이미지들을 위한 대체 방법
      const vqd = response.data.match(/vqd=([\d-]+)/);
      if (vqd && vqd[1]) {
        // DuckDuckGo의 이미지 API 엔드포인트 (비공식)
        const imageApiUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd[1]}&f=,,,&p=1`;
        
        try {
          const imageResponse = await axios.get(imageApiUrl, {
            headers: this.headers,
            timeout: 5000
          });
          
          if (imageResponse.data && imageResponse.data.results) {
            imageResponse.data.results.forEach(result => {
              if (result.image) {
                images.push(result.image);
              }
            });
          }
        } catch (apiError) {
          console.log('DuckDuckGo API 호출 실패, HTML 파싱 결과만 사용');
        }
      }
      
      console.log(`✅ DuckDuckGo 이미지 검색: ${images.length}개 발견`);
      return images.slice(0, 5);
      
    } catch (error) {
      console.error('DuckDuckGo 이미지 스크레이핑 실패:', error.message);
      return [];
    }
  }

  /**
   * 방법 3: Bing 이미지 검색 스크레이핑
   * 상대적으로 스크레이핑하기 쉬움
   */
  async scrapeBingImages(query) {
    try {
      const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1&tsc=ImageBasicHover`;
      
      const response = await axios.get(searchUrl, {
        headers: this.headers,
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      const images = [];
      
      // Bing 이미지 URL 추출
      $('.mimg, .iusc').each((index, element) => {
        // mimg 클래스의 src 또는 data-src
        let src = $(element).attr('src') || $(element).attr('data-src');
        
        // iusc의 경우 m 속성에 JSON 데이터가 있음
        const m = $(element).attr('m');
        if (m) {
          try {
            const mData = JSON.parse(m);
            if (mData.murl) {
              src = mData.murl;
            }
          } catch (e) {
            // JSON 파싱 실패 무시
          }
        }
        
        if (src && src.startsWith('http')) {
          images.push(src);
        }
      });
      
      console.log(`✅ Bing 이미지 검색: ${images.length}개 발견`);
      return images.slice(0, 5);
      
    } catch (error) {
      console.error('Bing 이미지 스크레이핑 실패:', error.message);
      return [];
    }
  }

  /**
   * 방법 4: Puppeteer를 사용한 동적 스크레이핑 (가장 강력)
   * JavaScript 렌더링 후 이미지 추출
   */
  async scrapeDynamicImages(query, source = 'google') {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();
      
      // 모바일 User Agent 설정 (간단한 레이아웃)
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1');
      await page.setViewport({ width: 375, height: 667 });
      
      let searchUrl;
      if (source === 'google') {
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`;
      } else if (source === 'bing') {
        searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
      } else {
        searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iar=images&iax=images&ia=images`;
      }
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // 스크롤하여 더 많은 이미지 로드
      await page.evaluate(() => {
        return new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            
            if(totalHeight >= scrollHeight){
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });
      
      // 이미지 URL 추출
      const images = await page.evaluate(() => {
        const imgs = [];
        document.querySelectorAll('img').forEach(img => {
          const src = img.src || img.dataset.src || img.dataset.srcRetina;
          if (src && src.startsWith('http') && !src.includes('google.com') && !src.includes('bing.com')) {
            imgs.push(src);
          }
        });
        return imgs;
      });
      
      console.log(`✅ Puppeteer ${source} 이미지 검색: ${images.length}개 발견`);
      return images.slice(0, 10);
      
    } catch (error) {
      console.error('Puppeteer 이미지 스크레이핑 실패:', error.message);
      return [];
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * 방법 5: 레스토랑 웹사이트 직접 스크레이핑
   * 레스토랑 자체 웹사이트에서 이미지 추출
   */
  async scrapeRestaurantWebsite(restaurantName, location) {
    try {
      // 1. 레스토랑 웹사이트 찾기 (Google 검색)
      const searchQuery = `${restaurantName} ${location} restaurant website`;
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      
      const searchResponse = await axios.get(searchUrl, {
        headers: this.headers,
        timeout: 10000
      });
      
      const $ = cheerio.load(searchResponse.data);
      let websiteUrl = null;
      
      // 검색 결과에서 웹사이트 URL 추출
      $('a').each((index, element) => {
        const href = $(element).attr('href');
        if (href && href.includes('http') && !href.includes('google') && !href.includes('yelp')) {
          const match = href.match(/url\?q=(https?:\/\/[^&]+)/);
          if (match) {
            websiteUrl = decodeURIComponent(match[1]);
            return false; // break
          }
        }
      });
      
      if (!websiteUrl) {
        console.log('레스토랑 웹사이트를 찾을 수 없음');
        return [];
      }
      
      console.log(`🌐 레스토랑 웹사이트 발견: ${websiteUrl}`);
      
      // 2. 웹사이트에서 이미지 추출
      const websiteResponse = await axios.get(websiteUrl, {
        headers: this.headers,
        timeout: 10000
      });
      
      const $$ = cheerio.load(websiteResponse.data);
      const images = [];
      
      $$('img').each((index, element) => {
        let src = $$(element).attr('src') || $$(element).attr('data-src');
        
        // 상대 경로를 절대 경로로 변환
        if (src && !src.startsWith('http')) {
          const baseUrl = new URL(websiteUrl);
          src = new URL(src, baseUrl.origin).href;
        }
        
        // 의미있는 크기의 이미지만 (아이콘 제외)
        const width = $$(element).attr('width');
        const height = $$(element).attr('height');
        
        if (src && src.startsWith('http') && 
            (!width || parseInt(width) > 100) && 
            (!height || parseInt(height) > 100)) {
          images.push(src);
        }
      });
      
      console.log(`✅ 레스토랑 웹사이트에서 ${images.length}개 이미지 발견`);
      return images.slice(0, 10);
      
    } catch (error) {
      console.error('레스토랑 웹사이트 스크레이핑 실패:', error.message);
      return [];
    }
  }

  /**
   * 통합 이미지 검색 함수
   * 여러 소스에서 이미지를 수집하고 최적의 결과 반환
   */
  async searchImages(restaurantName, dishName, location = '') {
    const query = `${restaurantName} ${location} ${dishName} food`;
    console.log(`🔍 이미지 검색 시작: "${query}"`);
    
    const results = {
      google: [],
      bing: [],
      duckduckgo: [],
      website: []
    };
    
    // 병렬로 여러 소스에서 검색
    const [googleImages, bingImages, duckImages, websiteImages] = await Promise.allSettled([
      this.scrapeGoogleImagesSimple(query),
      this.scrapeBingImages(query),
      this.scrapeDuckDuckGoImages(query),
      this.scrapeRestaurantWebsite(restaurantName, location)
    ]);
    
    if (googleImages.status === 'fulfilled') results.google = googleImages.value;
    if (bingImages.status === 'fulfilled') results.bing = bingImages.value;
    if (duckImages.status === 'fulfilled') results.duckduckgo = duckImages.value;
    if (websiteImages.status === 'fulfilled') results.website = websiteImages.value;
    
    // 결과 통합 및 중복 제거
    const allImages = [
      ...results.website,  // 레스토랑 웹사이트 우선
      ...results.google,
      ...results.bing,
      ...results.duckduckgo
    ];
    
    const uniqueImages = [...new Set(allImages)];
    
    console.log(`📊 통합 검색 결과:`);
    console.log(`  - Google: ${results.google.length}개`);
    console.log(`  - Bing: ${results.bing.length}개`);
    console.log(`  - DuckDuckGo: ${results.duckduckgo.length}개`);
    console.log(`  - Website: ${results.website.length}개`);
    console.log(`  - 총 고유 이미지: ${uniqueImages.length}개`);
    
    return {
      images: uniqueImages.slice(0, 5),
      sources: results,
      isReference: results.website.length === 0  // 웹사이트 이미지가 없으면 참고 이미지
    };
  }
}

module.exports = new ImageScraperService();
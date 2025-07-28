const puppeteer = require('puppeteer');
const axios = require('axios');

class GoogleMapsService {
  constructor() {
    this.browser = null;
  }

  async initialize() {
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      console.log('[GoogleMapsService] Browser initialized');
    } catch (error) {
      console.error('[GoogleMapsService] Failed to initialize browser:', error);
      throw error;
    }
  }

  async scrapeRestaurantInfo(restaurantUrl) {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser.newPage();
    
    try {
      await page.goto(restaurantUrl, { waitUntil: 'networkidle2' });
      
      // 레스토랑 이름 추출
      const name = await page.$eval('h1[class*="fontHeadlineLarge"]', el => el.textContent).catch(() => null);
      
      // 평점 추출
      const rating = await page.$eval('div[class*="fontDisplayLarge"]', el => el.textContent).catch(() => null);
      
      // 주소 추출
      const address = await page.$eval('button[data-item-id="address"]', el => el.textContent).catch(() => null);
      
      // 이미지 URL 추출 (최대 5개)
      const images = await page.$$eval('button[jsaction*="pane.heroHeaderImage"] img', imgs => 
        imgs.slice(0, 5).map(img => img.src)
      ).catch(() => []);
      
      // 인기 시간대 정보
      const popularTimes = await page.$eval('div[aria-label*="popular times"]', el => el.textContent).catch(() => null);
      
      // 리뷰 샘플 (상위 3개)
      const reviews = await page.$$eval('div[class*="review-text"]', reviews => 
        reviews.slice(0, 3).map(review => review.textContent)
      ).catch(() => []);
      
      return {
        name,
        rating,
        address,
        images,
        popularTimes,
        reviews,
        url: restaurantUrl
      };
    } catch (error) {
      console.error('Error scraping restaurant info:', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  async searchNearbyRestaurants(location, cuisine = '한식') {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser.newPage();
    
    try {
      const searchQuery = `${cuisine} ${location}`;
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      
      // 검색 결과 대기
      await page.waitForSelector('div[role="article"]', { timeout: 10000 });
      
      // 상위 5개 레스토랑 정보 추출
      const restaurants = await page.$$eval('div[role="article"]', articles => {
        return articles.slice(0, 5).map(article => {
          const name = article.querySelector('h3')?.textContent || '';
          const rating = article.querySelector('span[role="img"]')?.textContent || '';
          const priceLevel = article.querySelector('span[aria-label*="Price"]')?.textContent || '';
          
          return { name, rating, priceLevel };
        });
      });
      
      return restaurants;
    } catch (error) {
      console.error('Error searching restaurants:', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  async downloadImage(imageUrl, index) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });
      
      const buffer = Buffer.from(response.data, 'binary');
      return {
        buffer,
        contentType: response.headers['content-type'],
        filename: `restaurant_image_${index}.jpg`
      };
    } catch (error) {
      console.error(`Error downloading image ${index}:`, error);
      return null;
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = GoogleMapsService;
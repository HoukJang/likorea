const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

// 레스토랑 정보 캐시 (TTL: 24시간)
const restaurantCache = new NodeCache({ stdTTL: 86400 });

/**
 * Restaurant Scraper Service
 * 다양한 소스에서 레스토랑 정보를 수집하고 분석
 */
class RestaurantScraperService {
  constructor() {
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive'
    };
  }

  /**
   * 레스토랑 정보 수집 메인 함수
   * @param {string} restaurantName - 레스토랑 이름
   * @param {string} address - 레스토랑 주소
   * @returns {Object} 수집된 레스토랑 정보
   */
  async collectRestaurantData(restaurantName, address) {
    const cacheKey = `${restaurantName}_${address}`.replace(/\s+/g, '_');
    const cached = restaurantCache.get(cacheKey);
    
    if (cached) {
      console.log(`📦 캐시된 레스토랑 정보 사용: ${restaurantName}`);
      return cached;
    }

    console.log(`🍽️ 레스토랑 정보 수집 시작: ${restaurantName}`);
    
    const data = {
      name: restaurantName,
      address: address,
      sources: {},
      reviews: [],
      menu: [],
      images: [],
      ratings: {},
      details: {}
    };

    // 병렬로 여러 소스에서 데이터 수집
    const [googleData, yelpData, grubhubData] = await Promise.allSettled([
      this.scrapeGoogleMaps(restaurantName, address),
      this.scrapeYelp(restaurantName, address),
      this.scrapeGrubhub(restaurantName, address)
    ]);

    // 데이터 통합
    if (googleData.status === 'fulfilled' && googleData.value) {
      data.sources.google = googleData.value;
      data.reviews.push(...(googleData.value.reviews || []));
      data.images.push(...(googleData.value.images || []));
      data.ratings.google = googleData.value.rating;
      Object.assign(data.details, googleData.value.details || {});
    }

    if (yelpData.status === 'fulfilled' && yelpData.value) {
      data.sources.yelp = yelpData.value;
      data.reviews.push(...(yelpData.value.reviews || []));
      data.menu.push(...(yelpData.value.menu || []));
      data.images.push(...(yelpData.value.images || []));
      data.ratings.yelp = yelpData.value.rating;
    }

    if (grubhubData.status === 'fulfilled' && grubhubData.value) {
      data.sources.grubhub = grubhubData.value;
      data.menu.push(...(grubhubData.value.menu || []));
    }

    // 중복 제거
    data.images = [...new Set(data.images)];
    data.menu = this.deduplicateMenu(data.menu);

    restaurantCache.set(cacheKey, data);
    console.log(`✅ 레스토랑 정보 수집 완료: ${restaurantName}`);
    
    return data;
  }

  /**
   * Google Maps 정보 수집
   */
  async scrapeGoogleMaps(restaurantName, address) {
    try {
      console.log(`🔍 Google Maps 검색: ${restaurantName}`);
      
      // Google Maps 검색 URL 생성
      const searchQuery = encodeURIComponent(`${restaurantName} ${address}`);
      const searchUrl = `https://www.google.com/maps/search/${searchQuery}`;
      
      // 실제 구현에서는 Puppeteer나 Playwright를 사용해야 함
      // 여기서는 간단한 구조만 제공
      const mockData = {
        rating: 4.2,
        reviewCount: 156,
        priceLevel: '$$',
        reviews: [
          {
            text: 'Great authentic Sichuan food!',
            rating: 5,
            author: 'John D.'
          },
          {
            text: 'Spicy and delicious. The mapo tofu is amazing.',
            rating: 4,
            author: 'Sarah L.'
          }
        ],
        images: [
          'https://example.com/sichuan-garden-1.jpg',
          'https://example.com/sichuan-garden-2.jpg'
        ],
        details: {
          hours: 'Mon-Sun: 11:00 AM - 10:00 PM',
          phone: '(631) 123-4567',
          parking: 'Free parking available'
        }
      };
      
      return mockData;
    } catch (error) {
      console.error(`❌ Google Maps 크롤링 실패: ${error.message}`);
      return null;
    }
  }

  /**
   * Yelp 정보 수집
   */
  async scrapeYelp(restaurantName, address) {
    try {
      console.log(`🔍 Yelp 검색: ${restaurantName}`);
      
      // Yelp 검색 구현
      // 실제로는 Yelp Fusion API 사용 권장
      const mockData = {
        rating: 4.0,
        reviewCount: 89,
        priceLevel: '$$',
        reviews: [
          {
            text: 'Best Chinese food in Stony Brook area!',
            rating: 5,
            author: 'Mike R.'
          }
        ],
        menu: [
          {
            name: 'Mapo Tofu',
            price: '$12.95',
            description: 'Silky tofu in spicy Sichuan sauce',
            popular: true
          },
          {
            name: 'Kung Pao Chicken',
            price: '$13.95',
            description: 'Diced chicken with peanuts and dried chilies',
            popular: true
          },
          {
            name: 'Dan Dan Noodles',
            price: '$10.95',
            description: 'Noodles in spicy sesame sauce',
            popular: false
          }
        ],
        images: [
          'https://example.com/yelp-sichuan-1.jpg'
        ],
        categories: ['Sichuan', 'Chinese', 'Spicy']
      };
      
      return mockData;
    } catch (error) {
      console.error(`❌ Yelp 크롤링 실패: ${error.message}`);
      return null;
    }
  }

  /**
   * Grubhub 메뉴 정보 수집
   */
  async scrapeGrubhub(restaurantName, address) {
    try {
      console.log(`🔍 Grubhub 메뉴 검색: ${restaurantName}`);
      
      // Grubhub 메뉴 크롤링
      const mockData = {
        menu: [
          {
            name: 'Fish with Chili Oil',
            price: '$25.95',
            description: 'Fresh fish fillets in Sichuan chili oil',
            category: 'Chef Special'
          },
          {
            name: 'Twice Cooked Pork',
            price: '$14.95',
            description: 'Pork belly with cabbage and peppers',
            category: 'Pork'
          }
        ],
        popularItems: ['Mapo Tofu', 'Fish with Chili Oil', 'Kung Pao Chicken']
      };
      
      return mockData;
    } catch (error) {
      console.error(`❌ Grubhub 크롤링 실패: ${error.message}`);
      return null;
    }
  }

  /**
   * 메뉴 아이템 이미지 검색
   * @param {string} restaurantName - 레스토랑 이름
   * @param {string} dishName - 요리 이름
   */
  async searchDishImage(restaurantName, dishName) {
    try {
      // Google 이미지 검색 또는 레스토랑 웹사이트에서 이미지 수집
      const searchQuery = encodeURIComponent(`${restaurantName} ${dishName}`);
      console.log(`📸 이미지 검색: ${dishName}`);
      
      // 실제 구현에서는 Google Custom Search API 사용
      // 또는 Puppeteer로 이미지 크롤링
      return `https://example.com/dish-image-${dishName.replace(/\s+/g, '-')}.jpg`;
    } catch (error) {
      console.error(`❌ 이미지 검색 실패: ${error.message}`);
      return null;
    }
  }

  /**
   * 메뉴 중복 제거
   */
  deduplicateMenu(menuItems) {
    const seen = new Set();
    return menuItems.filter(item => {
      const key = item.name.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Claude용 프롬프트 생성
   */
  formatForClaudeAnalysis(restaurantData) {
    let prompt = `다음은 "${restaurantData.name}" 레스토랑에 대한 정보입니다.\n\n`;
    prompt += `📍 주소: ${restaurantData.address}\n\n`;
    
    // 평점 정보
    if (Object.keys(restaurantData.ratings).length > 0) {
      prompt += '⭐ 평점:\n';
      for (const [source, rating] of Object.entries(restaurantData.ratings)) {
        prompt += `- ${source}: ${rating}\n`;
      }
      prompt += '\n';
    }
    
    // 리뷰 요약
    if (restaurantData.reviews.length > 0) {
      prompt += '📝 주요 리뷰:\n';
      restaurantData.reviews.slice(0, 5).forEach(review => {
        prompt += `- "${review.text}" (${review.rating}★)\n`;
      });
      prompt += '\n';
    }
    
    // 메뉴 정보
    if (restaurantData.menu.length > 0) {
      prompt += '🍽️ 메뉴:\n';
      restaurantData.menu.slice(0, 10).forEach(item => {
        prompt += `- ${item.name}: ${item.price}`;
        if (item.description) {
          prompt += ` - ${item.description}`;
        }
        if (item.popular) {
          prompt += ' (인기메뉴)';
        }
        prompt += '\n';
      });
      prompt += '\n';
    }
    
    // 상세 정보
    if (Object.keys(restaurantData.details).length > 0) {
      prompt += '📋 상세 정보:\n';
      for (const [key, value] of Object.entries(restaurantData.details)) {
        prompt += `- ${key}: ${value}\n`;
      }
    }
    
    prompt += '\n위 정보를 바탕으로 이 레스토랑의 특징과 추천 메뉴 3가지를 선정해주세요.';
    prompt += '\n추천 메뉴는 리뷰에서 자주 언급되거나 인기 있는 메뉴를 우선으로 선택해주세요.';
    
    return prompt;
  }

  /**
   * 이미지 분석용 프롬프트 생성
   */
  formatForImageAnalysis(dishName, imageUrl) {
    return {
      prompt: `이 이미지는 "${dishName}"라는 요리입니다. 이미지를 보고 다음을 설명해주세요:
1. 요리의 비주얼과 구성
2. 예상되는 맛과 식감
3. 이 요리를 좋아할 만한 사람의 특징`,
      imageUrl: imageUrl
    };
  }
}

module.exports = new RestaurantScraperService();
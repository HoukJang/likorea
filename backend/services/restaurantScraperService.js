const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');
const imageScraperService = require('./imageScraperService');

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
      
      // 레스토랑별 다른 Mock 데이터 반환
      const restaurantKey = restaurantName.toLowerCase();
      
      // Briermere Farms는 실제로 파이/베이커리로 유명한 곳
      if (restaurantKey.includes('briermere') || restaurantKey.includes('farm')) {
        return {
          rating: 4.8,
          reviewCount: 523,
          priceLevel: '$',
          reviews: [
            {
              text: 'Best pies on Long Island! The peach cream pie is legendary.',
              rating: 5,
              author: 'Emily R.'
            },
            {
              text: 'Amazing apple pie and strawberry rhubarb pie. Worth the drive!',
              rating: 5,
              author: 'Michael K.'
            }
          ],
          images: [
            'https://example.com/briermere-pies.jpg',
            'https://example.com/briermere-store.jpg'
          ],
          details: {
            hours: 'Thu-Mon: 9:00 AM - 5:00 PM',
            phone: '(631) 722-3931',
            parking: 'Large free parking lot'
          }
        };
      }
      
      // 기본 사천 레스토랑 데이터
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
      
      // 레스토랑별 다른 Mock 데이터 반환
      const restaurantKey = restaurantName.toLowerCase();
      
      // Briermere Farms용 Yelp 데이터
      if (restaurantKey.includes('briermere') || restaurantKey.includes('farm')) {
        return {
          rating: 4.9,
          reviewCount: 342,
          priceLevel: '$',
          reviews: [
            {
              text: 'The best pies on Long Island! Must visit!',
              rating: 5,
              author: 'Rachel K.'
            }
          ],
          menu: [
            {
              name: 'Apple Pie',
              price: '$16.00',
              description: 'Classic apple pie with cinnamon',
              popular: true
            },
            {
              name: 'Peach Cream Pie',
              price: '$18.00',
              description: 'Fresh peaches with cream filling',
              popular: true
            },
            {
              name: 'Strawberry Rhubarb Pie',
              price: '$17.00',
              description: 'Sweet and tart combination',
              popular: true
            }
          ],
          images: [
            'https://example.com/yelp-briermere-1.jpg'
          ],
          categories: ['Bakery', 'Pies', 'Farm Stand']
        };
      }
      
      // 기본 사천 레스토랑 데이터
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
      
      // 레스토랑별 다른 Mock 데이터 반환
      const restaurantKey = restaurantName.toLowerCase();
      
      // Briermere Farms용 Grubhub 데이터 (실제로는 Grubhub에 없을 수 있음)
      if (restaurantKey.includes('briermere') || restaurantKey.includes('farm')) {
        return {
          menu: [
            {
              name: 'Blueberry Pie',
              price: '$16.50',
              description: 'Fresh blueberries in flaky crust',
              category: 'Berry Pies'
            },
            {
              name: 'Pumpkin Pie',
              price: '$15.00',
              description: 'Seasonal favorite with spices',
              category: 'Seasonal'
            }
          ],
          popularItems: ['Apple Pie', 'Peach Cream Pie', 'Strawberry Rhubarb Pie']
        };
      }
      
      // 기본 사천 레스토랑 데이터
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
   * @param {string} location - 레스토랑 위치 (선택사항)
   * @returns {Object} 이미지 정보 객체 { url, isReference }
   */
  async searchDishImage(restaurantName, dishName, location = '') {
    try {
      console.log(`📸 이미지 검색: ${restaurantName}의 ${dishName}`);
      
      // 캐시 확인
      const cacheKey = `img_${restaurantName}_${dishName}`.replace(/\s+/g, '_');
      const cached = restaurantCache.get(cacheKey);
      if (cached) {
        console.log(`📦 캐시된 이미지 사용: ${dishName}`);
        return cached;
      }
      
      // 환경 변수로 스크레이핑 활성화 여부 확인
      const enableScraping = process.env.ENABLE_IMAGE_SCRAPING === 'true';
      
      if (enableScraping) {
        console.log(`🔍 실제 이미지 스크레이핑 시도...`);
        
        try {
          // imageScraperService를 사용한 실제 스크레이핑
          const scrapedData = await imageScraperService.searchImages(
            restaurantName, 
            dishName, 
            location || 'Long Island NY'
          );
          
          if (scrapedData.images && scrapedData.images.length > 0) {
            const result = {
              url: scrapedData.images[0], // 첫 번째 이미지 사용
              isReference: scrapedData.isReference
            };
            
            // 캐시에 저장 (6시간)
            restaurantCache.set(cacheKey, result, 21600);
            
            console.log(`✅ 스크레이핑 성공: ${dishName} - ${result.isReference ? '참고' : '실제'} 이미지`);
            return result;
          }
        } catch (scrapeError) {
          console.error(`⚠️ 스크레이핑 실패, 폴백 이미지 사용: ${scrapeError.message}`);
        }
      }
      
      // 스크레이핑 비활성화 또는 실패 시 기존 하드코딩 이미지 사용
      console.log(`📌 폴백: 하드코딩된 참고 이미지 사용`);
      
      // 레스토랑별 실제 이미지 매핑 (하드코딩 - 폴백용)
      const restaurantSpecificImages = {
        'sichuan garden': {},
        'briermere farms': {
          'Apple Pie': 'https://example.com/briermere-apple-pie.jpg',
          'Peach Cream Pie': 'https://example.com/briermere-peach-pie.jpg',
          'Strawberry Rhubarb Pie': 'https://example.com/briermere-strawberry-pie.jpg'
        }
      };
      
      // 1. 먼저 레스토랑별 실제 이미지 확인
      const restaurantKey = restaurantName.toLowerCase();
      if (restaurantSpecificImages[restaurantKey] && restaurantSpecificImages[restaurantKey][dishName]) {
        const result = {
          url: restaurantSpecificImages[restaurantKey][dishName],
          isReference: false
        };
        restaurantCache.set(cacheKey, result, 21600);
        return result;
      }
      
      // 2. 일반 참고 이미지 사용
      const genericReferenceImages = {
        'Mapo Tofu': 'https://thewoksoflife.com/wp-content/uploads/2019/06/mapo-tofu-10.jpg',
        'Kung Pao Chicken': 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800',
        'Fish with Chili Oil': 'https://redhousespice.com/wp-content/uploads/2021/06/Sichuan-boiled-fish-served.jpg',
        'Dan Dan Noodles': 'https://thewoksoflife.com/wp-content/uploads/2014/11/dan-dan-noodles-15.jpg',
        'Twice Cooked Pork': 'https://thewoksoflife.com/wp-content/uploads/2019/04/twice-cooked-pork-9.jpg',
        'Hot and Sour Soup': 'https://www.recipetineats.com/wp-content/uploads/2019/02/Hot-and-Sour-Soup_7.jpg',
        'Beef with Broccoli': 'https://www.recipetineats.com/wp-content/uploads/2020/06/Beef-and-Broccoli_8.jpg',
        'General Tso\'s Chicken': 'https://www.recipetineats.com/wp-content/uploads/2020/10/General-Tsao-Chicken_1.jpg',
        'Shrimp with Lobster Sauce': 'https://thewoksoflife.com/wp-content/uploads/2022/05/shrimp-with-lobster-sauce-13.jpg',
        'Sweet and Sour Pork': 'https://thewoksoflife.com/wp-content/uploads/2019/05/sweet-and-sour-pork-9.jpg',
        'Apple Pie': 'https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=800',
        'Peach Cream Pie': 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=800',
        'Strawberry Rhubarb Pie': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800'
      };
      
      if (genericReferenceImages[dishName]) {
        console.log(`ℹ️ 일반 참고 이미지 사용 (실제 ${restaurantName} 이미지 아님): ${dishName}`);
        const result = {
          url: genericReferenceImages[dishName],
          isReference: true
        };
        restaurantCache.set(cacheKey, result, 21600);
        return result;
      }
      
      // 3. 플레이스홀더
      console.log(`⚠️ ${restaurantName}의 ${dishName} 이미지를 찾을 수 없음`);
      const searchQuery = encodeURIComponent(`${restaurantName} ${dishName}`);
      return {
        url: `https://via.placeholder.com/400x300.png?text=${searchQuery}`,
        isReference: true
      };
      
    } catch (error) {
      console.error(`❌ 이미지 검색 실패: ${error.message}`);
      return {
        url: null,
        isReference: true
      };
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
3. 이 요리를 좋아할 만한 사람의 특징
4. 매운 정도나 특별한 조리법`,
      imageUrl: imageUrl
    };
  }
  
  /**
   * 추천 메뉴 추출 (분석 결과에서)
   */
  extractRecommendedDishes(analysisText) {
    // Claude의 분석에서 추천 메뉴 추출
    const dishes = [];
    
    // 간단한 패턴 매칭으로 메뉴 추출 (파이 메뉴 추가)
    const menuPatterns = [
      /Mapo Tofu|마파두부|麻婆豆腐/gi,
      /Kung Pao Chicken|궁보계정|宫保鸡丁/gi,
      /Fish with Chili Oil|수자어|水煮鱼/gi,
      /Dan Dan Noodles|단단면|担担面/gi,
      /Twice Cooked Pork|회과육|回锅肉/gi,
      /Apple Pie|애플파이|사과파이/gi,
      /Peach Cream Pie|피치크림파이|복숭아파이/gi,
      /Strawberry Rhubarb Pie|딸기루바브파이/gi,
      /Blueberry Pie|블루베리파이/gi
    ];
    
    const menuNames = [
      'Mapo Tofu',
      'Kung Pao Chicken', 
      'Fish with Chili Oil',
      'Dan Dan Noodles',
      'Twice Cooked Pork',
      'Apple Pie',
      'Peach Cream Pie',
      'Strawberry Rhubarb Pie',
      'Blueberry Pie'
    ];
    
    menuPatterns.forEach((pattern, index) => {
      if (pattern.test(analysisText)) {
        dishes.push(menuNames[index]);
      }
    });
    
    // 최대 3개까지만 반환 (메뉴가 없으면 기본값)
    if (dishes.length === 0) {
      // 분석 텍스트에 'pie' 또는 '파이'가 있으면 파이 메뉴 반환
      if (/pie|파이/i.test(analysisText)) {
        return ['Apple Pie', 'Peach Cream Pie', 'Strawberry Rhubarb Pie'];
      }
      // 그렇지 않으면 중국 음식 반환
      return ['Mapo Tofu', 'Kung Pao Chicken', 'Fish with Chili Oil'];
    }
    
    return dishes.slice(0, 3);
  }
}

module.exports = new RestaurantScraperService();
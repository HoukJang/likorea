const { Client } = require('@googlemaps/google-maps-services-js');

/**
 * Google Places API Service
 * 실제 레스토랑 정보를 Google Places API에서 가져오기
 */
class GooglePlacesService {
  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!this.apiKey) {
      console.warn('⚠️ GOOGLE_PLACES_API_KEY가 설정되지 않았습니다.');
    }
  }

  /**
   * 레스토랑 검색 (Enhanced with contextualContent)
   * @param {string} restaurantName - 레스토랑 이름
   * @param {string} address - 주소 또는 지역
   * @param {string} dishQuery - 특정 메뉴 검색 (선택사항)
   * @returns {Object} 레스토랑 정보
   */
  async searchRestaurant(restaurantName, address, dishQuery = null) {
    if (!this.apiKey) {
      console.error('❌ Google Places API 키가 없습니다.');
      return null;
    }

    try {
      // 메뉴 관련 검색인 경우 쿼리 조정
      const searchQuery = dishQuery
        ? `${restaurantName} ${dishQuery} ${address}`
        : `${restaurantName} restaurant ${address}`;

      console.log(`🔍 Google Places 검색: ${searchQuery}`);

      // 1단계: Place Search로 레스토랑 찾기
      const searchResponse = await this.client.textSearch({
        params: {
          query: searchQuery,
          key: this.apiKey,
          language: 'ko' // 한국어 결과 우선
          // fields 파라미터는 textSearch에서 지원하지 않음
        }
      });

      if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
        console.log('⚠️ 검색 결과가 없습니다.');
        return null;
      }

      const place = searchResponse.data.results[0];
      const placeId = place.place_id;

      console.log(`✅ 레스토랑 발견: ${place.name} (${place.formatted_address})`);

      // 2단계: Place Details로 상세 정보 가져오기
      const detailsResponse = await this.client.placeDetails({
        params: {
          place_id: placeId,
          key: this.apiKey,
          language: 'ko',
          fields: [
            'name',
            'formatted_address',
            'formatted_phone_number',
            'opening_hours',
            'website',
            'rating',
            'user_ratings_total',
            'reviews',
            'photos',
            'types',
            'price_level',
            'url', // Google Maps URL
            'vicinity',
            'business_status',
            'serves_breakfast',
            'serves_lunch',
            'serves_dinner',
            'serves_vegetarian_food',
            'delivery',
            'dine_in',
            'takeout'
          ]
        }
      });

      const details = detailsResponse.data.result;

      // 음식 종류 추론
      const cuisine = this.detectCuisineFromTypes(details.types || []);

      // 리뷰 정리
      const reviews = (details.reviews || []).map(review => ({
        text: review.text,
        rating: review.rating,
        author: review.author_name,
        time: new Date(review.time * 1000).toLocaleDateString('ko-KR')
      }));

      // 영업시간 정리
      const hours = details.opening_hours ?
        details.opening_hours.weekday_text.join('\n') :
        '영업시간 정보 없음';

      // 사진 URL 생성 (최대 10개, 메뉴 사진 포함 가능)
      const photos = (details.photos || []).slice(0, 10).map(photo => ({
        url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${this.apiKey}`,
        attributions: photo.html_attributions || [],
        width: photo.width,
        height: photo.height
      }));

      // contextualContent가 있으면 관련 사진 추가
      const contextualPhotos = searchResponse.data.results[0]?.contextualContents?.photos || [];

      return {
        name: details.name,
        address: details.formatted_address,
        phone: details.formatted_phone_number,
        website: details.website,
        googleMapsUrl: details.url,
        rating: details.rating,
        reviewCount: details.user_ratings_total,
        priceLevel: this.getPriceLevel(details.price_level),
        cuisine: cuisine,
        hours: hours,
        reviews: reviews,
        photos: photos,
        contextualPhotos: contextualPhotos, // 검색 쿼리 관련 사진
        isOpen: details.opening_hours?.open_now,
        businessStatus: details.business_status,
        vicinity: details.vicinity,
        // 추가 서비스 정보
        services: {
          servesBreakfast: details.serves_breakfast,
          servesLunch: details.serves_lunch,
          servesDinner: details.serves_dinner,
          servesVegetarianFood: details.serves_vegetarian_food,
          delivery: details.delivery,
          dineIn: details.dine_in,
          takeout: details.takeout
        }
      };

    } catch (error) {
      console.error(`❌ Google Places API 오류: ${error.message}`);
      if (error.response) {
        console.error('응답 상태:', error.response.status);
        console.error('오류 메시지:', error.response.data.error_message);
      }
      return null;
    }
  }

  /**
   * 근처 레스토랑 검색
   * @param {number} lat - 위도
   * @param {number} lng - 경도
   * @param {number} radius - 반경 (미터)
   * @param {string} type - 레스토랑 타입 (선택사항)
   */
  async searchNearbyRestaurants(lat, lng, radius = 5000, type = null) {
    if (!this.apiKey) {
      console.error('❌ Google Places API 키가 없습니다.');
      return [];
    }

    try {
      const params = {
        location: { lat, lng },
        radius: radius,
        type: 'restaurant',
        key: this.apiKey,
        language: 'ko'
      };

      if (type) {
        params.keyword = type; // 예: 'korean', 'italian', 'sushi'
      }

      const response = await this.client.placesNearby({
        params: params
      });

      return response.data.results.map(place => ({
        name: place.name,
        placeId: place.place_id,
        address: place.vicinity,
        rating: place.rating,
        priceLevel: this.getPriceLevel(place.price_level),
        isOpen: place.opening_hours?.open_now,
        types: place.types,
        distance: this.calculateDistance(lat, lng,
          place.geometry.location.lat,
          place.geometry.location.lng)
      }));

    } catch (error) {
      console.error(`❌ Nearby search 오류: ${error.message}`);
      return [];
    }
  }

  /**
   * Place ID로 상세 정보 가져오기
   */
  async getPlaceDetails(placeId) {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          key: this.apiKey,
          language: 'ko',
          fields: ['name', 'rating', 'formatted_address', 'reviews', 'photos', 'opening_hours']
        }
      });

      return response.data.result;
    } catch (error) {
      console.error(`❌ Place details 오류: ${error.message}`);
      return null;
    }
  }

  /**
   * 음식 종류 감지 (Google Places types 기반)
   */
  detectCuisineFromTypes(types) {
    const cuisineMap = {
      'italian_restaurant': 'Italian',
      'chinese_restaurant': 'Chinese',
      'japanese_restaurant': 'Japanese',
      'korean_restaurant': 'Korean',
      'mexican_restaurant': 'Mexican',
      'thai_restaurant': 'Thai',
      'indian_restaurant': 'Indian',
      'vietnamese_restaurant': 'Vietnamese',
      'french_restaurant': 'French',
      'greek_restaurant': 'Greek',
      'spanish_restaurant': 'Spanish',
      'american_restaurant': 'American',
      'seafood_restaurant': 'Seafood',
      'sushi_restaurant': 'Japanese',
      'pizza_restaurant': 'Italian',
      'hamburger_restaurant': 'American',
      'bbq_restaurant': 'BBQ',
      'cafe': 'Cafe',
      'bakery': 'Bakery'
    };

    for (const type of types) {
      if (cuisineMap[type]) {
        return cuisineMap[type];
      }
    }

    // restaurant 타입만 있으면 null 반환
    if (types.includes('restaurant')) {
      return null;
    }

    return null;
  }

  /**
   * 가격 수준 변환
   */
  getPriceLevel(level) {
    const levels = {
      0: '무료',
      1: '$',
      2: '$$',
      3: '$$$',
      4: '$$$$'
    };
    return levels[level] || '정보 없음';
  }

  /**
   * 거리 계산 (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 지구 반경 (km)
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // 거리 (km)
    return Math.round(d * 10) / 10; // 소수점 1자리
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * API 사용량 체크 (선택사항)
   */
  async checkQuota() {
    // Google Cloud Console에서 확인하는 것이 더 정확
    console.log('📊 API 사용량은 Google Cloud Console에서 확인하세요:');
    console.log('https://console.cloud.google.com/apis/api/places-backend.googleapis.com/metrics');
  }
}

module.exports = new GooglePlacesService();
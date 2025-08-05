# Google Places API Integration Guide

## 📋 목차
- [개요](#개요)
- [API 설정 가이드](#api-설정-가이드)
- [기능 및 제한사항](#기능-및-제한사항)
- [구현된 서비스](#구현된-서비스)
- [테스트 스크립트](#테스트-스크립트)
- [비용 및 최적화](#비용-및-최적화)
- [향후 개선 방향](#향후-개선-방향)

## 개요

Google Places API는 레스토랑 정보를 실시간으로 가져오기 위한 서비스입니다. 현재 프로젝트에서는 맛집봇 시스템의 데이터 품질 향상을 위해 통합되었습니다.

### 현재 상태
- ✅ Google Places API 서비스 구현 완료 (`/backend/services/googlePlacesService.js`)
- ✅ 테스트 스크립트 작성 완료
- ⏳ 프로덕션 통합 대기 중 (API 키 필요)

## API 설정 가이드

### 1. Google Cloud Console 설정

#### 계정 생성 및 프로젝트 설정
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 결제 계정 설정 (월 $200 무료 크레딧 제공)

#### API 활성화
```bash
# 필요한 API들
- Places API (New)
- Maps JavaScript API (선택사항)
- Geocoding API (선택사항)
```

### 2. API 키 생성 및 보안 설정

#### API 키 생성
1. APIs & Services > Credentials 이동
2. "+ CREATE CREDENTIALS" > API key 선택
3. 생성된 API 키 복사

#### 보안 설정 (중요!)
```javascript
// API 키 제한 설정
1. Application restrictions:
   - HTTP referrers (웹사이트용)
   - IP addresses (서버용) ← 백엔드는 이것 선택
   
2. Website restrictions (프론트엔드용):
   - https://likorea.com/*
   - http://localhost:3000/* (개발용)
   
3. API restrictions:
   - Places API (New) 만 선택
   
4. 사용량 할당량 설정:
   - 일일 요청 제한: 1,000
   - 분당 요청 제한: 100
```

### 3. 환경 변수 설정

```bash
# backend/.env
GOOGLE_PLACES_API_KEY=your_actual_api_key_here
ENABLE_GOOGLE_PLACES=true  # Google Places 사용 여부
GOOGLE_PLACES_CACHE_TTL=3600  # 캐시 시간 (초)
```

## 기능 및 제한사항

### ✅ Google Places API (New)가 제공하는 것

#### 1. 레스토랑 기본 정보
- 이름, 주소, 전화번호
- 영업시간 및 현재 영업 상태
- 평점 및 리뷰 수
- 가격대 정보 ($-$$$$)
- Google Maps URL
- 웹사이트 URL

#### 2. 사진 기능
- **Place Photos (New)**: 레스토랑당 최대 10장의 고품질 사진
- **사용자/오너 업로드 사진**: 음식, 인테리어, 외관 사진 포함
- **ContextualContent**: AI 기반 검색어 관련 사진 필터링
  ```javascript
  // 예: "seafood pasta"로 검색하면 해산물 파스타 사진 우선 표시
  searchRestaurant("Ocean", "Bayville NY", "seafood pasta")
  ```

#### 3. 리뷰 및 평가
- 최근 리뷰 5개
- 리뷰어 이름, 평점, 작성 시간
- 리뷰 텍스트 (메뉴 언급 포함 가능)

#### 4. 서비스 정보
```javascript
{
  serves_breakfast: true,    // 아침 제공
  serves_lunch: true,        // 점심 제공
  serves_dinner: true,       // 저녁 제공
  serves_vegetarian_food: true,  // 채식 메뉴
  delivery: true,            // 배달 가능
  dine_in: true,            // 매장 식사
  takeout: true             // 포장 가능
}
```

#### 5. 음식 종류 감지
- Google Places types 기반 자동 감지
- 지원 종류: Italian, Chinese, Japanese, Korean, Mexican, Thai, Indian 등

### ❌ Google Places API의 제한사항

#### 구조화된 메뉴 데이터 없음
- ❌ 개별 메뉴 아이템 정보
- ❌ 메뉴 가격 정보
- ❌ 메뉴 설명 및 재료 정보
- ❌ 메뉴 카테고리 분류
- ❌ 메뉴별 사진 매칭

#### 사진 관련 제한
- 음식 사진은 있지만 "어떤 메뉴의 사진인지" 구분 불가
- 메뉴판 사진이 있어도 OCR 처리 필요
- 사진 품질과 관련성 보장 없음

## 구현된 서비스

### `/backend/services/googlePlacesService.js`

```javascript
class GooglePlacesService {
  // 레스토랑 검색 (contextualContent 지원)
  async searchRestaurant(restaurantName, address, dishQuery = null)
  
  // 근처 레스토랑 검색
  async searchNearbyRestaurants(lat, lng, radius = 5000, type = null)
  
  // Place ID로 상세 정보 가져오기
  async getPlaceDetails(placeId)
  
  // 음식 종류 감지
  detectCuisineFromTypes(types)
  
  // 거리 계산
  calculateDistance(lat1, lon1, lat2, lon2)
}
```

### 주요 기능 설명

#### 1. 향상된 레스토랑 검색
```javascript
// 기본 검색
const result = await googlePlacesService.searchRestaurant(
  "Ocean", 
  "333 Bayville Ave, Bayville, NY"
);

// 메뉴 특화 검색 (contextualContent 활용)
const result = await googlePlacesService.searchRestaurant(
  "Ocean",
  "Bayville, NY",
  "seafood pasta"  // 특정 메뉴 검색
);
```

#### 2. 근처 레스토랑 검색
```javascript
// 5km 반경 내 한식당 검색
const koreanRestaurants = await googlePlacesService.searchNearbyRestaurants(
  40.9126,  // 위도
  -73.1234, // 경도
  5000,     // 반경 (미터)
  'korean'  // 음식 종류
);
```

## 테스트 스크립트

### 1. 기본 테스트
```bash
cd backend
node scripts/testGooglePlaces.js
```

### 2. 메뉴 사진 기능 테스트
```bash
cd backend
node scripts/testGooglePlacesWithDishes.js
```

### 테스트 내용
- API 키 설정 확인
- 레스토랑 검색 기능
- 메뉴 관련 사진 검색
- 근처 레스토랑 검색
- 서비스 정보 확인

## 비용 및 최적화

### 가격 정책 (2024년 기준)
```
Text Search: $32 per 1,000 requests
Place Details: $17 per 1,000 requests
Place Photos: $7 per 1,000 requests
Nearby Search: $32 per 1,000 requests

월 $200 무료 크레딧 = 약 6,000번의 Text Search 가능
```

### 최적화 전략

#### 1. 캐싱 전략
```javascript
// NodeCache를 활용한 결과 캐싱
const cache = new NodeCache({ stdTTL: 3600 }); // 1시간 캐시

// 캐시 키: restaurantName_address
const cacheKey = `${restaurantName}_${address}`;
const cached = cache.get(cacheKey);
if (cached) return cached;
```

#### 2. 필드 최적화
```javascript
// 필요한 필드만 요청하여 비용 절감
fields: ['name', 'rating', 'photos']  // 필수 필드만
```

#### 3. 배치 처리
```javascript
// 여러 레스토랑을 한 번에 검색
const nearbySearch = await searchNearbyRestaurants(lat, lng);
// 개별 검색보다 효율적
```

## 향후 개선 방향

### 1. 하이브리드 접근법
```javascript
// Google Places (실제 정보) + 웹 스크래핑 (메뉴 정보)
const placeInfo = await googlePlacesService.searchRestaurant(name, address);
const menuInfo = await restaurantScraperService.scrapeMenu(name, address);
return { ...placeInfo, menu: menuInfo };
```

### 2. Google My Business API 통합
- 비즈니스 오너가 직접 등록한 메뉴 정보 활용
- 구조화된 메뉴 데이터 접근 가능
- 단, 개별 비즈니스 권한 필요

### 3. 이미지 인식 활용
```javascript
// Google Vision API로 메뉴판 사진 OCR
const menuPhoto = placeInfo.photos.find(p => /* 메뉴판 감지 */);
const menuText = await visionAPI.detectText(menuPhoto);
const structuredMenu = parseMenuText(menuText);
```

### 4. 사용자 기여 시스템
- 사용자가 메뉴 정보 추가/수정
- 커뮤니티 기반 데이터 보완
- 신뢰도 점수 시스템

## 문제 해결

### API 키 오류
```bash
# 오류: "The provided API key is invalid"
해결: API 키 확인 및 API 활성화 상태 확인

# 오류: "You have exceeded your daily request quota"
해결: 할당량 증가 또는 캐싱 강화
```

### CORS 오류 (프론트엔드)
```javascript
// 백엔드 프록시 사용
app.get('/api/places/search', async (req, res) => {
  const result = await googlePlacesService.searchRestaurant(
    req.query.name,
    req.query.address
  );
  res.json(result);
});
```

## 참고 자료

- [Google Places API (New) 공식 문서](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Place Photos (New) 가이드](https://developers.google.com/maps/documentation/places/web-service/place-photos)
- [가격 정책](https://developers.google.com/maps/billing/gmp-billing)
- [API 키 보안 가이드](https://developers.google.com/maps/api-security-best-practices)
- [contextualContent 기능](https://mapsplatform.google.com/resources/blog/how-to-get-started-with-new-gemini-model-capabilities-for-places-api/)

## 관련 파일

- 구현: `/backend/services/googlePlacesService.js`
- 테스트: `/backend/scripts/testGooglePlaces.js`
- 메뉴 테스트: `/backend/scripts/testGooglePlacesWithDishes.js`
- 환경 변수: `/backend/.env.example`
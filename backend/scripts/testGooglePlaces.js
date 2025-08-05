#!/usr/bin/env node

/**
 * Google Places API 테스트 스크립트
 * API 키 설정 후 실행하여 테스트
 */

require('dotenv').config();
const googlePlacesService = require('../services/googlePlacesService');

async function testGooglePlaces() {
  console.log('🧪 Google Places API 테스트\n');
  console.log('=' .repeat(50));

  // API 키 확인
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.error('❌ GOOGLE_PLACES_API_KEY가 .env 파일에 설정되지 않았습니다.');
    console.log('\n📝 설정 방법:');
    console.log('1. backend/.env 파일 열기');
    console.log('2. 다음 줄 추가:');
    console.log('   GOOGLE_PLACES_API_KEY=your_actual_api_key_here');
    console.log('3. 파일 저장 후 다시 실행');
    return;
  }

  console.log('✅ API 키가 설정되어 있습니다.\n');

  // 테스트 케이스들
  const testCases = [
    {
      name: 'Ocean',
      address: '333 Bayville Ave, Bayville, NY 11709'
    },
    {
      name: 'Olive Garden',
      address: 'Huntington, NY'
    },
    {
      name: 'P.F. Chang\'s',
      address: 'Walt Whitman Mall, Huntington Station, NY'
    }
  ];

  for (const test of testCases) {
    console.log(`\n📍 테스트: ${test.name}`);
    console.log('-'.repeat(50));

    try {
      const result = await googlePlacesService.searchRestaurant(test.name, test.address);
      
      if (result) {
        console.log('\n📊 검색 결과:');
        console.log(`  이름: ${result.name}`);
        console.log(`  주소: ${result.address}`);
        console.log(`  음식 종류: ${result.cuisine || '미확인'}`);
        console.log(`  평점: ${result.rating} (${result.reviewCount}개 리뷰)`);
        console.log(`  가격대: ${result.priceLevel}`);
        console.log(`  전화: ${result.phone || '정보 없음'}`);
        console.log(`  웹사이트: ${result.website || '정보 없음'}`);
        console.log(`  현재 영업: ${result.isOpen ? '영업 중' : '영업 종료'}`);
        console.log(`  Google Maps: ${result.googleMapsUrl}`);
        
        if (result.reviews && result.reviews.length > 0) {
          console.log('\n  📝 최근 리뷰:');
          result.reviews.slice(0, 2).forEach(review => {
            console.log(`    - "${review.text.substring(0, 100)}..." (${review.rating}★)`);
          });
        }
        
        if (result.photos && result.photos.length > 0) {
          console.log(`\n  📸 사진: ${result.photos.length}장 있음`);
        }
        
        console.log('\n  ⏰ 영업시간:');
        console.log('    ' + result.hours.split('\n').join('\n    '));
        
      } else {
        console.log('  ❌ 검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error(`  ❌ 오류 발생: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(50));
  }

  // 근처 레스토랑 검색 테스트 (선택사항)
  console.log('\n📍 근처 한식당 검색 테스트 (Stony Brook 기준)');
  console.log('-'.repeat(50));
  
  try {
    // Stony Brook University 좌표
    const lat = 40.9126;
    const lng = -73.1234;
    
    const nearbyRestaurants = await googlePlacesService.searchNearbyRestaurants(
      lat, lng, 5000, 'korean'
    );
    
    if (nearbyRestaurants.length > 0) {
      console.log(`\n✅ ${nearbyRestaurants.length}개 한식당 발견:`);
      nearbyRestaurants.slice(0, 5).forEach(restaurant => {
        console.log(`  - ${restaurant.name} (${restaurant.distance}km)`);
        console.log(`    평점: ${restaurant.rating}, 가격: ${restaurant.priceLevel}`);
      });
    } else {
      console.log('  근처에 한식당이 없습니다.');
    }
  } catch (error) {
    console.error(`  ❌ 근처 검색 오류: ${error.message}`);
  }

  console.log('\n✅ 테스트 완료!');
  console.log('\n💡 팁:');
  console.log('- API 사용량 확인: https://console.cloud.google.com/apis/dashboard');
  console.log('- 월 $200 무료 크레딧 내에서 사용하세요');
  console.log('- 프로덕션에서는 결과를 캐싱하여 API 호출을 줄이세요');
}

// 테스트 실행
testGooglePlaces().catch(console.error);
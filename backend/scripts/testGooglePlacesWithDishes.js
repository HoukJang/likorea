#!/usr/bin/env node

/**
 * Google Places API (New) 테스트 - 메뉴 및 음식 사진 기능 포함
 * contextualContent와 향상된 사진 기능 테스트
 */

require('dotenv').config();
const googlePlacesService = require('../services/googlePlacesService');

async function testGooglePlacesWithDishes() {
  console.log('🍽️ Google Places API (New) - 메뉴 및 음식 사진 테스트\n');
  console.log('=' .repeat(50));

  // API 키 확인
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.error('❌ GOOGLE_PLACES_API_KEY가 설정되지 않았습니다.');
    return;
  }

  console.log('✅ API 키가 설정되어 있습니다.\n');

  // 테스트 케이스들 - 특정 메뉴를 함께 검색
  const testCases = [
    {
      name: 'Ocean',
      address: '333 Bayville Ave, Bayville, NY',
      dishQuery: 'seafood pasta', // 특정 메뉴 검색
      description: '해산물 파스타가 있는 Ocean 레스토랑'
    },
    {
      name: 'Olive Garden',
      address: 'Huntington, NY',
      dishQuery: 'chicken alfredo', // 특정 메뉴 검색
      description: '치킨 알프레도가 유명한 Olive Garden'
    },
    {
      name: 'P.F. Chang\'s',
      address: 'Huntington Station, NY',
      dishQuery: 'lettuce wraps', // 특정 메뉴 검색
      description: 'Lettuce Wraps가 있는 P.F. Chang\'s'
    },
    {
      name: 'Korean restaurant',
      address: 'Flushing, NY',
      dishQuery: '김치찌개', // 한국 음식 검색
      description: '김치찌개가 맛있는 한식당'
    }
  ];

  for (const test of testCases) {
    console.log(`\n📍 테스트: ${test.description}`);
    console.log('-'.repeat(50));

    try {
      // 메뉴 관련 검색 포함
      const result = await googlePlacesService.searchRestaurant(
        test.name, 
        test.address,
        test.dishQuery // 특정 메뉴 검색어 추가
      );
      
      if (result) {
        console.log('\n📊 검색 결과:');
        console.log(`  이름: ${result.name}`);
        console.log(`  주소: ${result.address}`);
        console.log(`  음식 종류: ${result.cuisine || '미확인'}`);
        console.log(`  평점: ${result.rating} (${result.reviewCount}개 리뷰)`);
        
        // 서비스 정보
        if (result.services) {
          console.log('\n  🍴 서비스 정보:');
          console.log(`    아침: ${result.services.servesBreakfast ? '제공' : '미제공'}`);
          console.log(`    점심: ${result.services.servesLunch ? '제공' : '미제공'}`);
          console.log(`    저녁: ${result.services.servesDinner ? '제공' : '미제공'}`);
          console.log(`    채식: ${result.services.servesVegetarianFood ? '가능' : '불가'}`);
          console.log(`    배달: ${result.services.delivery ? '가능' : '불가'}`);
        }
        
        // 일반 사진
        if (result.photos && result.photos.length > 0) {
          console.log(`\n  📸 일반 사진: ${result.photos.length}장`);
          result.photos.slice(0, 3).forEach((photo, idx) => {
            console.log(`    ${idx + 1}. ${photo.width}x${photo.height} - ${photo.url.substring(0, 50)}...`);
          });
        }
        
        // contextual 사진 (메뉴 관련 가능성)
        if (result.contextualPhotos && result.contextualPhotos.length > 0) {
          console.log(`\n  🍽️ 메뉴 관련 사진: ${result.contextualPhotos.length}장`);
          console.log('    (검색어와 관련된 음식 사진일 가능성이 높음)');
        }
        
        // 리뷰에서 메뉴 언급 찾기
        if (result.reviews && result.reviews.length > 0) {
          console.log('\n  📝 메뉴 관련 리뷰:');
          const menuRelatedReviews = result.reviews.filter(review => 
            test.dishQuery && review.text.toLowerCase().includes(test.dishQuery.toLowerCase())
          );
          
          if (menuRelatedReviews.length > 0) {
            menuRelatedReviews.slice(0, 2).forEach(review => {
              console.log(`    - "${review.text.substring(0, 100)}..." (${review.rating}★)`);
            });
          } else {
            console.log('    메뉴 관련 리뷰를 찾지 못했습니다.');
          }
        }
        
      } else {
        console.log('  ❌ 검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error(`  ❌ 오류 발생: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(50));
  }

  // Google Places API (New)의 한계점 설명
  console.log('\n📚 Google Places API (New) 메뉴 사진 기능 요약:');
  console.log('-'.repeat(50));
  console.log('✅ 가능한 것:');
  console.log('  • 레스토랑의 일반 사진 (최대 10장)');
  console.log('  • 사용자/오너가 올린 음식 사진 (구분 없이 포함)');
  console.log('  • contextualContent로 검색어 관련 사진 필터링');
  console.log('  • 리뷰에서 메뉴 언급 찾기');
  console.log('  • 서비스 정보 (아침/점심/저녁, 채식, 배달 등)');
  
  console.log('\n❌ 제한사항:');
  console.log('  • 구조화된 메뉴 데이터 없음');
  console.log('  • 개별 메뉴 아이템별 사진 구분 불가');
  console.log('  • 메뉴 가격 정보 없음');
  console.log('  • 메뉴 설명이나 재료 정보 없음');
  
  console.log('\n💡 추천 접근법:');
  console.log('  1. Google Places로 레스토랑 기본 정보 수집');
  console.log('  2. contextualContent로 메뉴 관련 사진 필터링');
  console.log('  3. 추가 메뉴 정보는 웹 스크래핑으로 보완');
  console.log('  4. Google My Business API (비즈니스 오너용) 활용');
  
  console.log('\n✅ 테스트 완료!');
}

// 테스트 실행
testGooglePlacesWithDishes().catch(console.error);
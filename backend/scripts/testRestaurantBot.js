#!/usr/bin/env node

/**
 * Restaurant Bot Test Script
 * Sichuan Garden 리뷰 테스트
 */

require('dotenv').config();
const mongoose = require('mongoose');
const colors = require('colors/safe');
const restaurantScraperService = require('../services/restaurantScraperService');
const Anthropic = require('@anthropic-ai/sdk');

// Claude 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function testRestaurantBot() {
  try {
    // MongoDB 연결 (캐싱을 위해)
    await mongoose.connect(process.env.MONGO_URI);
    console.log(colors.green('✅ MongoDB 연결 성공'));
    
    // 테스트 레스토랑 정보
    const restaurantName = 'Sichuan Garden';
    const restaurantAddress = '2077 Nesconset Hwy, Stony Brook, NY';
    
    console.log(colors.cyan('\n=== Sichuan Garden 테스트 시작 ==='));
    console.log(`🍽️ 레스토랑: ${restaurantName}`);
    console.log(`📍 주소: ${restaurantAddress}`);
    
    // 1단계: 레스토랑 정보 수집
    console.log(colors.blue('\n📊 1단계: 레스토랑 정보 수집...'));
    const restaurantData = await restaurantScraperService.collectRestaurantData(restaurantName, restaurantAddress);
    
    console.log(colors.green('✅ 수집된 정보:'));
    console.log(`- 리뷰 수: ${restaurantData.reviews.length}`);
    console.log(`- 메뉴 아이템: ${restaurantData.menu.length}`);
    console.log(`- 이미지: ${restaurantData.images.length}`);
    console.log(`- 평점: Google ${restaurantData.ratings.google || 'N/A'}, Yelp ${restaurantData.ratings.yelp || 'N/A'}`);
    
    // 2단계: Claude로 분석
    console.log(colors.blue('\n🤖 2단계: Claude AI 분석...'));
    const analysisPrompt = restaurantScraperService.formatForClaudeAnalysis(restaurantData);
    
    const analysisResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: '당신은 레스토랑 평가 전문가입니다. 제공된 정보를 분석하여 추천 메뉴 3가지를 선정하고 특징을 설명해주세요.',
      messages: [{
        role: 'user',
        content: analysisPrompt
      }]
    });
    
    const analysis = analysisResponse.content[0].text;
    console.log(colors.green('✅ 분석 완료'));
    console.log(colors.gray('--- 분석 결과 ---'));
    console.log(analysis);
    
    // 3단계: 추천 메뉴 이미지 수집 (시뮬레이션)
    console.log(colors.blue('\n📸 3단계: 추천 메뉴 이미지 수집...'));
    const recommendedDishes = ['Mapo Tofu', 'Kung Pao Chicken', 'Fish with Chili Oil'];
    const dishImages = [];
    
    for (const dish of recommendedDishes) {
      const imageUrl = await restaurantScraperService.searchDishImage(restaurantName, dish);
      dishImages.push({ dish, imageUrl });
      console.log(`- ${dish}: ${imageUrl ? '✅' : '❌'}`);
    }
    
    // 4단계: 최종 게시글 생성
    console.log(colors.blue('\n✍️ 4단계: 게시글 생성...'));
    
    const finalPrompt = `당신은 24세 스토니브룩 대학생입니다. 오늘 "${restaurantName}" 레스토랑을 방문했습니다.
주소: ${restaurantAddress}

레스토랑 분석 결과:
${analysis}

이미지 정보:
${dishImages.map(img => `- ${img.dish}: 맛있어 보이는 요리 사진`).join('\n')}

위 정보를 바탕으로 자연스럽고 친근한 맛집 리뷰 게시글을 작성해주세요.

작성 지침:
1. 24세 대학생의 관점에서 작성
2. "오늘 친구들이랑" 또는 "시험 끝나고" 같은 자연스러운 도입
3. 추천 메뉴 3개를 자연스럽게 소개
4. 가격대, 분위기, 주차 정보 포함
5. 이모티콘 적절히 사용 (너무 많이는 X)
6. 300-500자 정도로 작성

응답 형식:
제목: [맛집 발견! 같은 흥미로운 제목]
내용: [리뷰 내용]`;
    
    const postResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: '당신은 24세 스토니브룩 대학생이며, 맛집 탐방을 좋아합니다. 친근하고 재미있게 글을 씁니다.',
      messages: [{
        role: 'user',
        content: finalPrompt
      }]
    });
    
    const generatedPost = postResponse.content[0].text;
    
    console.log(colors.green('✅ 게시글 생성 완료!'));
    console.log(colors.cyan('\n=== 생성된 게시글 ==='));
    console.log(generatedPost);
    
    // 통계 출력
    console.log(colors.cyan('\n=== 테스트 통계 ==='));
    console.log(`총 소요 시간: ${Math.floor(process.uptime())}초`);
    console.log(`사용된 토큰: 약 ${(analysisResponse.usage?.total_tokens || 0) + (postResponse.usage?.total_tokens || 0)} 토큰`);
    
  } catch (error) {
    console.error(colors.red('❌ 테스트 실패:'), error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// 실행
testRestaurantBot();
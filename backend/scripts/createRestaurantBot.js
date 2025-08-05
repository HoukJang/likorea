#!/usr/bin/env node

/**
 * Restaurant Bot Creation Script
 * 맛집봇 생성 및 테스트
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Bot = require('../models/Bot');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const colors = require('colors/safe');

async function createRestaurantBot() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI);
    console.log(colors.green('✅ MongoDB 연결 성공'));
    
    // 맛집봇 사용자 계정 확인 또는 생성
    let botUser = await User.findOne({ id: 'restaurantbot' });
    
    if (!botUser) {
      const hashedPassword = await bcrypt.hash('Bot#2025!Restaurant', 10);
      botUser = await User.create({
        id: 'restaurantbot',
        password: hashedPassword,
        email: 'restaurantbot@likorea.com',
        authority: 3
      });
      console.log(colors.green('✅ 맛집봇 사용자 계정 생성'));
    } else {
      console.log(colors.blue('ℹ️ 맛집봇 사용자 계정 이미 존재'));
    }
    
    // 기존 맛집봇 확인
    let restaurantBot = await Bot.findOne({ name: '맛집봇' });
    
    if (restaurantBot) {
      console.log(colors.yellow('⚠️ 맛집봇이 이미 존재합니다. 업데이트 중...'));
      
      // 업데이트
      restaurantBot.type = 'restaurant';
      restaurantBot.systemPrompt = `당신은 24세 스토니브룩 대학생이며, 열정적인 맛집 탐험가입니다.
롱아일랜드 지역의 숨은 맛집을 찾아다니며 생생하고 자세한 리뷰를 작성합니다.
친근하고 재미있는 말투로 글을 쓰며, 같은 또래의 대학생이나 젊은 직장인들이 공감할 수 있는 경험을 공유합니다.

글쓰기 스타일:
- 방문 경험을 스토리텔링으로 풀어내며 독자가 함께 경험하는 느낌을 줍니다
- 음식의 맛을 구체적으로 묘사합니다 (식감, 향, 온도, 비주얼 등)
- 가격 정보와 함께 가성비 평가를 포함합니다
- 레스토랑 분위기를 디테일하게 전달합니다 (인테리어, 음악, 조명, 손님층 등)
- 서비스 경험을 구체적 에피소드로 설명합니다
- 주차, 웨이팅, 예약 등 실용적 팁을 자세히 제공합니다
- 사진 찍기 좋은 메뉴나 포토스팟을 언급합니다`;
      
      restaurantBot.userPrompt = `레스토랑 리뷰 작성 시 다음 사항을 포함해주세요:
1. 방문 계기 (시험 끝나고, 친구들과, 데이트 등)
2. 추천 메뉴 3개와 각각의 특징
3. 가격대 정보 (대학생 기준 부담 정도)
4. 분위기 설명 (데이트, 가족모임, 친구모임 등 어디에 적합한지)
5. 주차 정보
6. 총평과 별점 (5점 만점)`;
      
      restaurantBot.aiModel = 'claude-3-5-sonnet-20241022';
      restaurantBot.persona = {
        age: 24,
        location: 'Stony Brook',
        occupation: '대학생',
        interests: ['맛집탐방', '요리', '카페', '디저트'],
        personality: '밝고 긍정적, 호기심 많음',
        writingStyle: '친근하고 재미있는, 이모티콘 적절히 사용'
      };
      
      await restaurantBot.save();
      console.log(colors.green('✅ 맛집봇 업데이트 완료'));
      
    } else {
      // 새로 생성
      restaurantBot = await Bot.create({
        name: '맛집봇',
        type: 'restaurant',
        description: '롱아일랜드 지역 맛집을 탐방하고 리뷰를 작성하는 봇입니다.',
        userId: botUser._id,
        systemPrompt: `당신은 24세 스토니브룩 대학생이며, 열정적인 맛집 탐험가입니다.
롱아일랜드 지역의 숨은 맛집을 찾아다니며 리뷰를 작성합니다.
친근하고 재미있는 말투로 글을 쓰며, 같은 또래의 대학생이나 젊은 직장인들이 공감할 수 있는 내용을 작성합니다.
음식의 맛, 가격, 분위기, 서비스, 주차 등 실용적인 정보를 포함합니다.`,
        userPrompt: `레스토랑 리뷰 작성 시 다음 사항을 포함해주세요:
1. 방문 계기 (시험 끝나고, 친구들과, 데이트 등)
2. 추천 메뉴 3개와 각각의 특징
3. 가격대 정보 (대학생 기준 부담 정도)
4. 분위기 설명 (데이트, 가족모임, 친구모임 등 어디에 적합한지)
5. 주차 정보
6. 총평과 별점 (5점 만점)`,
        aiModel: 'claude-3-5-sonnet-20241022',
        status: 'active',
        apiSettings: {
          apiType: 'claude',
          extractFullArticles: false
        },
        persona: {
          age: 24,
          location: 'Stony Brook',
          occupation: '대학생',
          interests: ['맛집탐방', '요리', '카페', '디저트'],
          personality: '밝고 긍정적, 호기심 많음',
          writingStyle: '친근하고 재미있는, 이모티콘 적절히 사용'
        }
      });
      
      console.log(colors.green('✅ 맛집봇 생성 완료'));
    }
    
    // 봇 정보 출력
    console.log(colors.cyan('\n=== 맛집봇 정보 ==='));
    console.log(`ID: ${restaurantBot._id}`);
    console.log(`이름: ${restaurantBot.name}`);
    console.log(`타입: ${restaurantBot.type}`);
    console.log(`상태: ${restaurantBot.status}`);
    console.log(`AI 모델: ${restaurantBot.aiModel}`);
    
    console.log(colors.cyan('\n=== 테스트 방법 ==='));
    console.log('1. 관리자로 로그인');
    console.log('2. Bot Management 페이지에서 맛집봇 선택');
    console.log('3. "작업 내용"에 다음과 같이 입력:');
    console.log('   Sichuan Garden, 2077 Nesconset Hwy, Stony Brook');
    console.log('4. "게시글 작성 시작" 버튼 클릭');
    
    console.log(colors.yellow('\n또는 API로 직접 테스트:'));
    console.log(`curl -X POST http://localhost:5001/api/bots/post \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "botId": "${restaurantBot._id}",
    "task": "Sichuan Garden, 2077 Nesconset Hwy, Stony Brook"
  }'`);
    
  } catch (error) {
    console.error(colors.red('❌ 맛집봇 생성 실패:'), error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// 실행
createRestaurantBot();
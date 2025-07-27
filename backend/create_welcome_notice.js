const mongoose = require('mongoose');
const BoardPost = require('./models/BoardPost');
const User = require('./models/User');
require('dotenv').config({ path: './.env' });

async function createWelcomeNotice() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB 연결 성공');

    // likorea 계정 찾기
    const adminUser = await User.findOne({ id: 'likorea' });
    if (!adminUser) {
      console.error('likorea 계정을 찾을 수 없습니다.');
      process.exit(1);
    }

    // 웰컴 메시지 공지 작성
    const welcomePost = {
      title: '🎉 Long Island Korea 커뮤니티에 오신 것을 환영합니다!',
      content: `안녕하세요, Long Island Korea 회원 여러분!

롱아일랜드 한인 커뮤니티 웹사이트에 오신 것을 진심으로 환영합니다. 

## 🌟 Long Island Korea 소개

Long Island Korea는 뉴욕 롱아일랜드 지역에 거주하는 한인들을 위한 온라인 커뮤니티 플랫폼입니다. 우리는 서로 소통하고, 정보를 공유하며, 함께 성장하는 따뜻한 커뮤니티를 만들어가고 있습니다.

## 📋 주요 서비스

### 1. 커뮤니티 게시판
- **일상/잡담**: 일상적인 이야기와 소통의 공간
- **질문/답변**: 궁금한 점을 묻고 답하는 공간
- **정보공유**: 유용한 정보를 나누는 공간
- **구인구직**: 일자리 정보 공유
- **부동산**: 주택, 렌트 정보
- **중고거래**: 물품 거래 게시판
- **모임/행사**: 커뮤니티 행사 및 모임 안내

### 2. 지역별 정보
롱아일랜드의 각 지역별(Nassau, Suffolk 카운티)로 특화된 정보를 제공합니다. 여러분이 거주하시는 지역을 선택하여 더욱 관련성 높은 정보를 확인하실 수 있습니다.

### 3. 태그 시스템
효율적인 정보 검색과 분류를 위한 태그 시스템을 제공합니다:
- 글종류별 분류
- 지역별 분류
- 세부 주제별 분류

## 🤝 커뮤니티 이용 안내

### 회원가입 및 로그인
- 간단한 회원가입 절차를 통해 커뮤니티에 참여하실 수 있습니다
- 로그인 후 게시글 작성, 댓글 달기 등 모든 기능을 이용하실 수 있습니다

### 게시글 작성 가이드
1. 적절한 카테고리와 태그를 선택해주세요
2. 명확하고 이해하기 쉬운 제목을 작성해주세요
3. 상세한 내용을 포함하여 다른 회원들에게 도움이 되도록 작성해주세요
4. 개인정보 보호에 유의해주세요

### 커뮤니티 에티켓
- 서로를 존중하고 배려하는 마음으로 소통해주세요
- 비방, 욕설, 허위정보 유포는 금지됩니다
- 광고성 게시글은 해당 카테고리에만 작성해주세요
- 저작권을 침해하는 콘텐츠는 게시하지 마세요

## 📞 문의 및 건의사항

Long Island Korea를 이용하시면서 궁금한 점이나 건의사항이 있으시면 언제든지 문의해주세요:
- 이메일: admin@longislandkorea.com (예시)
- 문의 게시판: 사이트 내 '문의/건의' 게시판 이용

## 🎯 함께 만들어가는 커뮤니티

Long Island Korea는 여러분 모두가 주인공인 커뮤니티입니다. 활발한 참여와 건전한 소통으로 더욱 풍성하고 유익한 커뮤니티를 함께 만들어갑시다.

롱아일랜드 한인 여러분의 많은 관심과 참여 부탁드립니다.

감사합니다!

**Long Island Korea 운영진 드림**`,
      tags: {
        type: '공지',
        region: '0',
        subcategory: ''
      },
      author: adminUser._id,
      viewCount: 0,
      modifiedAt: new Date()
    };

    // 공지사항 생성
    const newPost = await BoardPost.create(welcomePost);
    console.log('웰컴 공지사항이 성공적으로 생성되었습니다.');
    console.log('게시글 ID:', newPost._id);
    console.log('제목:', newPost.title);

  } catch (error) {
    console.error('공지사항 생성 중 오류 발생:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB 연결 종료');
  }
}

// 스크립트 실행
createWelcomeNotice();
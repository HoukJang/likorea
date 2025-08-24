const mongoose = require('mongoose');
const User = require('../models/User');
const BoardPost = require('../models/BoardPost');
const Comment = require('../models/Comment');
const Counter = require('../models/Counter');
const Message = require('../models/Message');
const Banner = require('../models/Banner');
require('dotenv').config();

// 개발 환경 기본 DB 설정
async function setupDevDB() {
  try {
    // 프로덕션 환경에서는 실행 방지
    if (process.env.NODE_ENV === 'production') {
      console.error('❌  이 스크립트는 프로덕션 환경에서 실행할 수 없습니다.');
      console.error('개발 환경(NODE_ENV=development)에서만 실행 가능합니다.');
      return;
    }

    console.log('🔧 개발 환경 확인 완료. DB 설정을 시작합니다...');

    // 데이터베이스가 이미 연결되어 있는지 확인
    if (mongoose.connection.readyState !== 1) {
      console.log('데이터베이스 연결이 필요합니다.');
      return;
    }

    // 기존 데이터 정리
    await User.deleteMany({});
    await BoardPost.deleteMany({});
    await Comment.deleteMany({});
    await Counter.deleteMany({});
    await Message.deleteMany({});
    await Banner.deleteMany({});
    console.log('기존 데이터 정리 완료');

    // Counter 초기화
    await Counter.create({ _id: 'board', seq: 0 });
    console.log('Counter 초기화 완료');

    // 1. 관리자 계정 생성 (likorea//password)
    // User 모델의 save 미들웨어가 자동으로 비밀번호를 해시화하므로 평문 비밀번호 사용
    const adminUser = await User.create({
      id: 'likorea',
      email: 'admin@likorea.com',
      password: 'password', // 평문 비밀번호 - User 모델에서 자동 해시화됨
      authority: 5 // 관리자 권한
    });
    console.log('관리자 계정 생성 완료:', adminUser.id);

    // 2. 랜덤 유저 4개 생성
    const randomUsers = [];
    const userIds = ['chulsu', 'younghee', 'minsu', 'sujin'];

    for (let i = 0; i < 4; i++) {
      const randomUser = await User.create({
        id: userIds[i],
        email: `${userIds[i]}@example.com`,
        password: 'password', // 평문 비밀번호 - User 모델에서 자동 해시화됨
        authority: 3 // 일반 사용자 권한
      });
      randomUsers.push(randomUser);
      console.log(`사용자 생성 완료: ${randomUser.id}`);
    }

    // 태그 시스템 데이터
    const types = ['사고팔고', '부동산', '생활정보', '모임', '기타'];
    const regions = Array.from({ length: 61 }, (_, i) => (i + 13).toString()); // Exit 13-73

    // 3. 관리자가 작성한 공지사항 3개
    const notices = [
      {
        title: '롱아일랜드 코리아 커뮤니티에 오신 것을 환영합니다!',
        content: `<p>안녕하세요! 롱아일랜드 한국인 커뮤니티에 오신 것을 환영합니다.</p>
                 <p>이곳은 뉴욕 롱아일랜드 지역에 거주하시는 한국분들을 위한 소통 공간입니다.</p>
                 <p><strong>주요 기능:</strong></p>
                 <ul>
                   <li>지역별 정보 공유 (LIE Exit 기반)</li>
                   <li>사고팔고, 부동산, 생활정보 등 다양한 카테고리</li>
                   <li>댓글을 통한 활발한 소통</li>
                 </ul>
                 <p>많은 참여 부탁드립니다!</p>`,
        tags: { type: '기타', region: '0' },
        isNotice: true
      },
      {
        title: '커뮤니티 이용 규칙 안내',
        content: `<p>건전한 커뮤니티 문화를 위해 다음 규칙을 준수해 주세요:</p>
                 <p><strong>🚫 금지사항:</strong></p>
                 <ul>
                   <li>욕설, 비방, 차별적 발언</li>
                   <li>개인정보 무단 공유</li>
                   <li>상업적 스팸 게시물</li>
                   <li>정치적 논쟁을 유발하는 내용</li>
                 </ul>
                 <p><strong>✅ 권장사항:</strong></p>
                 <ul>
                   <li>정확한 정보 공유</li>
                   <li>서로 존중하는 댓글 문화</li>
                   <li>적절한 카테고리 선택</li>
                 </ul>`,
        tags: { type: '기타', region: '0' },
        isNotice: true
      },
      {
        title: '지역 태그 사용법 및 LIE Exit 정보',
        content: `<p>효율적인 정보 공유를 위해 지역 태그를 활용해 주세요!</p>
                 <p><strong>🗺️ 지역 선택 방법:</strong></p>
                 <ul>
                   <li>거주 지역과 가장 가까운 LIE Exit 번호를 선택</li>
                   <li>전 지역 대상인 경우 '전체' 선택</li>
                   <li>Exit 13~73 사이에서 선택 가능</li>
                 </ul>
                 <p><strong>📝 글종류 안내:</strong></p>
                 <ul>
                   <li><strong>사고팔고:</strong> 중고거래, 물건 판매/구매</li>
                   <li><strong>부동산:</strong> 렌트, 매매, 룸메이트 구함</li>
                   <li><strong>생활정보:</strong> 맛집, 병원, 학교 정보</li>
                   <li><strong>모임:</strong> 동호회, 스터디, 만남</li>
                   <li><strong>기타:</strong> 위 카테고리에 속하지 않는 내용</li>
                 </ul>`,
        tags: { type: '기타', region: '0' },
        isNotice: true
      }
    ];

    const noticePosts = [];
    for (const notice of notices) {
      const post = await BoardPost.create({
        ...notice,
        author: adminUser._id,
        viewCount: Math.floor(Math.random() * 100) + 50,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // 최근 일주일 내
      });
      noticePosts.push(post);
    }
    console.log('공지사항 3개 생성 완료');

    // 4. 일반 게시글 45개 생성
    const postTitles = [
      // 사고팔고
      '아이폰 14 프로 팝니다 (거의 새것)',
      '유아용 카시트 저렴하게 판매해요',
      '이케아 소파 세트 급매',
      '한국 라면 박스채로 팝니다',
      '아이 장난감 정리해서 팝니다',
      '전자레인지 팔아요 (삼성)',
      '겨울 코트 새상품 판매',
      '자전거 팝니다 (거의 안탔어요)',
      '냉장고 급매 (이사 때문에)',

      // 부동산
      '플래넘 근처 룸메이트 구해요',
      '잭슨하이츠 1베드룸 서브릿',
      '베이사이드 콘도 매매 문의',
      '히컨스빌 타운하우스 렌트',
      '포트제퍼슨 아파트 찾아요',
      '레빗타운 룸 렌트해드려요',
      '맨헤셋 근처 주차 가능한 곳',
      '노던불바드 상가 임대',

      // 생활정보
      '맛있는 한국 마트 추천해주세요',
      '소아과 병원 어디가 좋나요?',
      '한국 미용실 찾고 있어요',
      '자동차 정비소 추천 부탁드려요',
      '아이 태권도 도장 문의',
      '한국 식당 신메뉴 후기',
      '플러싱 주차장 정보 공유',
      '운전면허 갱신 어디서 하나요?',
      '좋은 치과 추천해주세요',
      '한국 마켓 세일 정보',

      // 모임
      '등산 동호회 멤버 모집',
      '한국어 스터디 그룹',
      '맘들 모임 참여하실분',
      '골프 같이 치실분 찾아요',
      '영화 같이 보실분',
      '요리 모임 만들고 싶어요',
      '테니스 파트너 구해요',
      '독서 모임 참여자 모집',

      // 기타
      '한국 드라마 추천해주세요',
      '택배 받아주실분 계신가요?',
      '반려동물 병원 추천',
      '한국 음식 레시피 공유',
      '아이 한국학교 정보',
      '겨울 준비 팁 공유해요',
      '좋은 보험 에이전트 추천',
      '세금 보고 도움 받을 곳',
      '한국 방송 보는 방법',
      '롱아일랜드 핫플레이스',
      '주말 나들이 장소 추천'
    ];

    const postContents = {
      사고팔고: [
        '<p>상태 매우 좋고 박스, 충전기 모두 포함되어 있습니다.</p><p>직거래 가능하고 연락주세요!</p>',
        '<p>아이가 커서 더 이상 사용하지 않아 판매합니다.</p><p>안전검사 통과한 제품이에요.</p>',
        '<p>이사 때문에 급하게 처분합니다.</p><p>상태 좋고 편안한 소파입니다.</p>',
        '<p>한국에서 가져온 정품 라면들입니다.</p><p>유통기한 넉넉해요.</p>'
      ],
      부동산: [
        '<p>깨끗하고 조용한 환경입니다.</p><p>교통편 좋고 한국 마트 가까워요.</p>',
        '<p>가구 포함, 즉시 입주 가능합니다.</p><p>연락 주시면 사진 보내드려요.</p>',
        '<p>학군 좋은 지역이고 편의시설 가까워요.</p><p>투자용으로도 좋습니다.</p>'
      ],
      생활정보: [
        '<p>가격도 합리적이고 물건도 다양해서 자주 이용하고 있어요.</p><p>주차도 편리합니다.</p>',
        '<p>아이가 아픈데 어느 병원이 좋은지 추천 부탁드려요.</p><p>한국어 가능한 곳이면 더 좋겠어요.</p>',
        '<p>펌이나 염색 잘하는 곳 알고 계시면 공유해주세요.</p><p>가격도 궁금해요.</p>'
      ],
      모임: [
        '<p>주말마다 등산하는 모임입니다.</p><p>초보자도 환영해요!</p>',
        '<p>한국어 실력 향상을 위한 스터디 그룹입니다.</p><p>함께 공부해요.</p>',
        '<p>아이들 놀이모임 만들고 싶어요.</p><p>비슷한 또래 엄마들 연락주세요.</p>'
      ],
      기타: [
        '<p>요즘 재미있게 본 드라마 있으시면 추천해주세요.</p><p>로맨스나 코미디 장르 좋아해요.</p>',
        '<p>출장 중인데 택배가 도착할 예정이에요.</p><p>도움 주실 분 계신가요?</p>',
        '<p>반려견 키우는데 좋은 동물병원 알고 계시나요?</p><p>예방접종 받으려고요.</p>'
      ]
    };

    const allPosts = [];
    for (let i = 0; i < 45; i++) {
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomRegion =
        Math.random() > 0.1 ? regions[Math.floor(Math.random() * regions.length)] : '0';
      const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)];

      const titleIndex = Math.floor(Math.random() * postTitles.length);
      const title = postTitles[titleIndex];

      const contentOptions = postContents[randomType] || postContents['기타'];
      const content = contentOptions[Math.floor(Math.random() * contentOptions.length)];

      const post = await BoardPost.create({
        title: title,
        content: content,
        author: randomUser._id,
        tags: { type: randomType, region: randomRegion },
        viewCount: Math.floor(Math.random() * 200),
        isNotice: false,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // 최근 30일 내
      });
      allPosts.push(post);
    }
    console.log('일반 게시글 45개 생성 완료');

    // 5. 댓글 100개 랜덤 생성
    const commentContents = [
      '좋은 정보 감사합니다!',
      '저도 관심있어요. 연락드릴게요.',
      '가격이 어떻게 되나요?',
      '사진 좀 더 보여주실 수 있나요?',
      '언제 거래 가능한가요?',
      '정말 도움이 되는 글이네요.',
      '저희 동네에도 있나요?',
      '경험 공유해주셔서 감사해요.',
      '저도 비슷한 경험이 있어요.',
      '좋은 아이디어네요!',
      '추천해주신 곳 가봐야겠어요.',
      '후기 기대하고 있을게요.',
      '연락처 알 수 있을까요?',
      '상태가 정말 좋아보이네요.',
      '관심있습니다. 쪽지 보내주세요.',
      '이런 정보 찾고 있었어요.',
      '도움 많이 됐습니다.',
      '저도 참여하고 싶어요.',
      '언제부터 가능한가요?',
      '자세한 설명 부탁드려요.',
      '와 정말 좋네요!',
      '저희 집 근처에요. 좋은 정보 감사합니다.',
      '가격 협상 가능한가요?',
      '직거래 가능하신가요?',
      '상품 상태 어떤가요?'
    ];

    const allPostsForComments = [...noticePosts, ...allPosts];

    for (let i = 0; i < 100; i++) {
      const randomPost =
        allPostsForComments[Math.floor(Math.random() * allPostsForComments.length)];
      const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)];
      const randomContent = commentContents[Math.floor(Math.random() * commentContents.length)];

      await Comment.create({
        content: randomContent,
        author: randomUser._id,
        post: randomPost._id,
        createdAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000) // 최근 20일 내
      });
    }
    console.log('댓글 100개 생성 완료');

    // 게시글별 댓글 수 업데이트
    for (const post of allPostsForComments) {
      const commentCount = await Comment.countDocuments({ post: post._id });
      await BoardPost.findByIdAndUpdate(post._id, { commentCount });
    }
    console.log('게시글 댓글 수 업데이트 완료');

    // 6. 메시지 5개 생성 (likorea에게 받은 메시지)
    const messageContents = [
      {
        content: '안녕하세요 관리자님! 사이트가 정말 잘 만들어졌네요. 롱아일랜드 한인분들에게 큰 도움이 될 것 같습니다. 감사합니다!',
        sender: randomUsers[0]
      },
      {
        content: '관리자님, 게시판에 스팸 글이 올라와서 신고합니다. Exit 45 지역 부동산 카테고리에 이상한 광고글이 있어요. 확인 부탁드립니다.',
        sender: randomUsers[1]
      },
      {
        content: '혹시 사이트에 중고거래 사기 신고 기능을 추가할 수 있을까요? 최근에 사기를 당한 분들이 있어서 문의드립니다.',
        sender: randomUsers[2]
      },
      {
        content: '안녕하세요! 롱아일랜드 한인 모임을 계획하고 있는데, 공지사항에 올려도 될까요? 많은 분들이 참여하셨으면 좋겠습니다.',
        sender: randomUsers[3]
      },
      {
        content: '사이트 이용 중에 모바일에서 글쓰기 버튼이 잘 안 눌러지는 것 같아요. 아이폰 사파리에서 테스트했습니다. 확인 부탁드려요!',
        sender: randomUsers[0]
      }
    ];

    for (let i = 0; i < messageContents.length; i++) {
      const messageData = messageContents[i];
      
      await Message.create({
        sender: messageData.sender._id,
        receiver: adminUser._id,
        content: messageData.content,
        isRead: false,
        createdAt: new Date(Date.now() - (i * 60 * 60 * 1000)) // 1시간씩 차이나게
      });
    }
    console.log('메시지 5개 생성 완료');

    // 7. 샘플 배너 생성
    const bannerEndDate = new Date();
    bannerEndDate.setDate(bannerEndDate.getDate() + 7); // 7일 후 만료

    await Banner.create({
      message: '🎉 롱아일랜드 한인 커뮤니티가 새롭게 단장했습니다! 많은 이용 부탁드립니다.',
      type: 'event',
      icon: '🎉',
      link: {
        url: '/boards',
        text: '게시판 둘러보기'
      },
      isActive: true,
      priority: 10,
      endDate: bannerEndDate,
      dismissible: true,
      createdBy: adminUser._id
    });

    // 두 번째 배너 (비활성 상태)
    const secondBannerEndDate = new Date();
    secondBannerEndDate.setDate(secondBannerEndDate.getDate() + 14);

    await Banner.create({
      message: '⚠️ 서버 점검 안내: 12월 25일 오전 2시-4시 서비스가 일시 중단됩니다.',
      type: 'warning',
      icon: '⚠️',
      isActive: false,
      priority: 5,
      endDate: secondBannerEndDate,
      dismissible: true,
      createdBy: adminUser._id
    });

    console.log('샘플 배너 2개 생성 완료');

    console.log('\n🎉 개발 환경 DB 설정 완료!');
    console.log('📊 생성된 데이터:');
    console.log('👤 관리자: likorea (비밀번호: password)');
    console.log('👥 일반 사용자: 4명 (chulsu, younghee, minsu, sujin - 비밀번호: password)');
    console.log('📢 공지사항: 3개');
    console.log('📝 일반 게시글: 45개');
    console.log('💬 댓글: 100개');
    console.log('📨 메시지: 5개 (likorea가 받은 메시지)');
    console.log('🎯 배너: 2개 (1개 활성, 1개 비활성)');
  } catch (error) {
    console.error('DB 설정 중 오류 발생:', error);
  } finally {
    // server.js에서 호출될 때는 연결을 끊지 않음
    if (require.main === module) {
      await mongoose.disconnect();
      console.log('데이터베이스 연결 종료');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  setupDevDB();
}

module.exports = setupDevDB;

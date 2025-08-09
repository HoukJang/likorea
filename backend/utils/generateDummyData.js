const mongoose = require('mongoose');
const BoardPost = require('../models/BoardPost');
const User = require('../models/User');
const Counter = require('../models/Counter');
require('dotenv').config();

// 더미 데이터 생성 함수
async function generateDummyData() {
  try {
    // 데이터베이스 연결
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI 환경변수가 설정되지 않았습니다.');
      return;
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('데이터베이스 연결 성공');

    // 기존 게시글 데이터 정리
    await BoardPost.deleteMany({});
    console.log('기존 게시글 데이터 정리 완료');

    // Counter 초기화
    await Counter.findByIdAndUpdate('board', { seq: 0 }, { upsert: true });
    console.log('Counter 초기화 완료');

    // 기존 사용자 중 하나를 가져오거나, 없으면 새로 생성
    let user = await User.findOne();
    if (!user) {
      user = await User.create({
        email: 'dummy@example.com',
        password: 'dummy123',
        authority: 1
      });
    }

    // 글종류와 지역 데이터
    const types = ['정보', '질문', '후기', '거래', '모임', '잡담'];
    const regions = [
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
      '30',
      '31',
      '32',
      '33',
      '34',
      '35',
      '36',
      '37',
      '38',
      '39',
      '40'
    ];

    // 제목 템플릿
    const titleTemplates = [
      '롱아일랜드 {type} 정보 공유합니다',
      '{type} 관련해서 궁금한 점이 있어요',
      '{type} 후기 올립니다',
      '{type} 거래하고 싶어요',
      '{type} 모임 참여하고 싶어요',
      'Exit {region} 근처 {type} 정보',
      '{type} 추천해주세요',
      '{type} 가격 문의',
      '{type} 위치 알려주세요',
      '{type} 리뷰 올립니다'
    ];

    // 내용 템플릿
    const contentTemplates = [
      '안녕하세요! {type} 관련해서 정보를 공유하고 싶어서 글 올립니다. Exit {region} 근처에서 활동하시는 분들께 도움이 되었으면 좋겠어요.',
      '{type}에 대해 궁금한 점이 있어서 질문드립니다. 혹시 아시는 분 계시면 답변 부탁드려요.',
      '최근에 {type}를 경험했는데 후기를 올려봅니다. Exit {region} 근처에서 비슷한 경험을 하신 분들도 계실 것 같아요.',
      '{type} 거래를 원합니다. 가격은 협의 가능하고, Exit {region} 근처에서 거래하고 싶어요.',
      '{type} 모임에 참여하고 싶어요. 혹시 모임을 주최하시는 분이나 참여하고 싶은 분들 있으시면 연락주세요.',
      'Exit {region} 근처에서 {type} 정보를 찾고 있어요. 추천해주실 분 있으시면 감사하겠습니다.',
      '{type} 가격이 궁금해요. 대략적인 가격대를 알려주실 수 있으신가요?',
      '{type} 위치를 찾고 있어요. Exit {region} 근처에서 어디에 있는지 알려주세요.',
      '{type} 리뷰를 올려봅니다. 전반적으로 만족스러웠어요.',
      '{type} 관련해서 조언을 구하고 싶어요. 경험 있으신 분들 조언 부탁드려요.'
    ];

    // 45개의 더미 데이터 생성
    for (let i = 0; i < 45; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const region = regions[Math.floor(Math.random() * regions.length)];
      const titleTemplate = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
      const contentTemplate = contentTemplates[Math.floor(Math.random() * contentTemplates.length)];

      const title = titleTemplate.replace(/{type}/g, type).replace(/{region}/g, region);
      const content = contentTemplate.replace(/{type}/g, type).replace(/{region}/g, region);

      const viewCount = Math.floor(Math.random() * 100) + 1;

      const post = new BoardPost({
        title,
        content,
        author: user._id,
        viewCount,
        tags: {
          type,
          region
        },
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // 최근 30일 내 랜덤 날짜
      });

      await post.save();
      console.log(`${i + 1}/45 게시글 생성 완료: ${title}`);
    }

    console.log('45개의 더미 게시글이 성공적으로 생성되었습니다!');

    // 생성된 게시글 수 확인
    const totalPosts = await BoardPost.countDocuments();
    console.log(`총 게시글 수: ${totalPosts}개`);
  } catch (error) {
    console.error('더미 데이터 생성 중 오류:', error);
  } finally {
    await mongoose.disconnect();
    console.log('데이터베이스 연결 종료');
  }
}

// 스크립트 실행
if (require.main === module) {
  generateDummyData();
}

module.exports = generateDummyData;

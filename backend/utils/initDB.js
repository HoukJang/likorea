const mongoose = require('mongoose');
const User = require('../models/User');
const BoardPost = require('../models/BoardPost');
const Comment = require('../models/Comment');
const Counter = require('../models/Counter');
const Tag = require('../models/Tag');
const Message = require('../models/Message');
const { initializeTags } = require('./initTags');
const { safeDbOperation, getSafeConnectionOptions } = require('./db-protection');
require('dotenv').config();

/**
 * 데이터베이스 초기화 스크립트
 * 프로덕션과 개발 환경 모두에서 사용 가능
 *
 * ⚠️  주의: 프로덕션 환경에서는 DB 보호 기능이 활성화됩니다
 */
async function initDB() {
  try {
    console.log('🚀 데이터베이스 초기화를 시작합니다...');
    console.log(`📍 환경: ${process.env.NODE_ENV || 'development'}`);

    // 데이터베이스 연결 확인
    if (mongoose.connection.readyState !== 1) {
      console.log('📡 데이터베이스에 연결 중...');
      const connectionOptions = getSafeConnectionOptions();
      await mongoose.connect(process.env.MONGO_URI, connectionOptions);
      console.log('✅ 데이터베이스 연결 완료');
    }

    // DB 초기화 작업을 안전하게 수행
    await safeDbOperation('initDB', async () => {
      // 기존 데이터 정리 (주의: 모든 데이터가 삭제됩니다)
      console.log('🗑️  기존 데이터 정리 중...');
      await User.deleteMany({});
      await BoardPost.deleteMany({});
      await Comment.deleteMany({});
      await Counter.deleteMany({});
      await Tag.deleteMany({});
      await Message.deleteMany({});
      console.log('✅ 기존 데이터 정리 완료');
    });

    // 1. Counter 초기화
    console.log('🔢 Counter 초기화 중...');
    await Counter.create({ _id: 'board', seq: 0 });
    console.log('✅ Counter 초기화 완료');

    // 2. 태그 시스템 초기화
    console.log('🏷️  태그 시스템 초기화 중...');
    await initializeTags();
    console.log('✅ 태그 시스템 초기화 완료');

    // 3. 관리자 계정 생성
    console.log('👑 관리자 계정 생성 중...');
    const adminUser = await User.create({
      id: 'likorea',
      email: 'admin@likorea.com',
      password: 'FhddkfZhfldk', // User 모델에서 자동 해시화됨
      authority: 5 // 관리자 권한
    });
    console.log(`✅ 관리자 계정 생성 완료: ${adminUser.id}`);

    // 4. 환영 공지사항 생성
    console.log('📢 환영 공지사항 생성 중...');
    const welcomeNotice = await BoardPost.create({
      title: '롱아일랜드 코리아 커뮤니티에 오신 것을 환영합니다!',
      content: `<p>안녕하세요! 롱아일랜드 한국인 커뮤니티에 오신 것을 환영합니다.</p>
               <p>이곳은 뉴욕 롱아일랜드 지역에 거주하시는 한국분들을 위한 소통 공간입니다.</p>
               <p><strong>주요 기능:</strong></p>
               <ul>
                 <li>지역별 정보 공유 (495 고속도로 Exit 기반)</li>
                 <li>사고팔고, 부동산, 생활정보 등 다양한 카테고리</li>
                 <li>댓글을 통한 활발한 소통</li>
               </ul>
               <p><strong>🗺️ 지역 태그 사용법:</strong></p>
               <ul>
                 <li>거주 지역과 가장 가까운 495 고속도로 Exit 번호를 선택해주세요</li>
                 <li>전 지역 대상인 경우 '전체' 선택</li>
                 <li>정확한 지역 정보로 더 효율적인 소통이 가능합니다</li>
               </ul>
               <p>많은 참여 부탁드립니다!</p>`,
      author: adminUser._id,
      tags: { type: '기타', region: '0' },
      isNotice: true,
      viewCount: 1,
      commentCount: 0,
      createdAt: new Date()
    });

    console.log('✅ 환영 공지사항 생성 완료');

    // 환경별 추가 설정
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️  개발 환경 추가 데이터 생성 중...');

      // 개발 환경에서는 테스트용 사용자들도 생성
      const testUsers = ['testuser1', 'testuser2', 'testuser3'];

      for (const userId of testUsers) {
        await User.create({
          id: userId,
          email: `${userId}@test.com`,
          password: 'password',
          authority: 3
        });
      }

      console.log(`✅ 테스트 사용자 ${testUsers.length}명 생성 완료`);
    } else {
      console.log('🏭 프로덕션 환경: 기본 설정만 완료');
    }

    console.log('\n🎉 데이터베이스 초기화 완료!');
    console.log('📊 생성된 데이터:');
    console.log('👤 관리자: likorea (비밀번호: FhddkfZhfldk)');
    console.log('📢 환영 공지사항: 1개');
    console.log('🏷️  태그 시스템: 초기화 완료 (495 고속도로 Exit 기반)');

    if (process.env.NODE_ENV === 'development') {
      console.log('👥 테스트 사용자: 3명 (testuser1-3, 비밀번호: password)');
    }

  } catch (error) {
    console.error('❌ 데이터베이스 초기화 중 오류 발생:', error);
    throw error;
  } finally {
    // 스크립트로 직접 실행된 경우에만 연결 종료
    if (require.main === module) {
      await mongoose.disconnect();
      console.log('📡 데이터베이스 연결 종료');
    }
  }
}

// 스크립트로 직접 실행된 경우
if (require.main === module) {
  initDB().catch(error => {
    console.error('스크립트 실행 실패:', error);
    process.exit(1);
  });
}

module.exports = initDB;
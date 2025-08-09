/**
 * MongoDB 인덱스 추가 스크립트
 * 성능 최적화를 위한 인덱스 생성
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 스크립트 위치에서 상대 경로로 .env 파일 로드
dotenv.config({ path: path.join(__dirname, '../.env') });

// 인덱스 정의
const indexes = {
  boardposts: [
    // 복합 인덱스: 태그 필터링 + 정렬
    {
      index: { 'tags.type': 1, 'tags.region': 1, createdAt: -1 },
      options: { name: 'tags_createdAt' }
    },
    // 단일 인덱스: 시간순 정렬
    {
      index: { createdAt: -1 },
      options: { name: 'createdAt_desc' }
    },
    // 단일 인덱스: 조회수 정렬
    {
      index: { viewCount: -1 },
      options: { name: 'viewCount_desc' }
    },
    // 텍스트 검색 인덱스
    {
      index: { title: 'text', content: 'text' },
      options: {
        name: 'text_search',
        weights: { title: 3, content: 1 },
        default_language: 'korean'
      }
    },
    // 게시글 번호 인덱스 (이미 unique로 생성되어 있을 수 있음)
    {
      index: { postNumber: 1 },
      options: { name: 'postNumber', unique: true, sparse: true }
    }
  ],
  users: [
    // 권한별 조회
    {
      index: { authority: 1 },
      options: { name: 'authority' }
    },
    // 최신 가입자 조회
    {
      index: { createdAt: -1 },
      options: { name: 'createdAt_desc' }
    },
    // ID 인덱스 (이미 unique로 생성되어 있을 수 있음)
    {
      index: { id: 1 },
      options: { name: 'id', unique: true }
    },
    // 이메일 인덱스 (이미 unique로 생성되어 있을 수 있음)
    {
      index: { email: 1 },
      options: { name: 'email', unique: true }
    }
  ],
  comments: [
    // 게시글별 댓글 조회
    {
      index: { post: 1, createdAt: -1 },
      options: { name: 'post_createdAt' }
    },
    // 작성자별 댓글 조회
    {
      index: { author: 1, createdAt: -1 },
      options: { name: 'author_createdAt' }
    },
    // 부모 댓글 조회 (대댓글 기능)
    {
      index: { parentComment: 1 },
      options: { name: 'parentComment', sparse: true }
    }
  ],
  tags: [
    // 태그 조회 최적화 (이미 복합 unique 인덱스가 있을 수 있음)
    {
      index: { category: 1, value: 1 },
      options: { name: 'category_value', unique: true }
    },
    // 활성 태그만 조회
    {
      index: { isActive: 1, category: 1 },
      options: { name: 'active_category' }
    }
  ],
  trafficlogs: [
    // 트래픽 분석용
    {
      index: { timestamp: -1 },
      options: { name: 'timestamp_desc' }
    },
    {
      index: { ip: 1, timestamp: -1 },
      options: { name: 'ip_timestamp' }
    },
    {
      index: { path: 1, timestamp: -1 },
      options: { name: 'path_timestamp' }
    }
  ]
};

async function addIndexes() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB 연결 성공\n');

    // 각 컬렉션에 대해 인덱스 생성
    for (const [collectionName, collectionIndexes] of Object.entries(indexes)) {
      console.log(`📊 ${collectionName} 컬렉션 인덱스 생성 중...`);

      const collection = mongoose.connection.collection(collectionName);

      // 기존 인덱스 확인
      const existingIndexes = await collection.indexes();
      const existingIndexNames = existingIndexes.map(idx => idx.name);

      for (const indexDef of collectionIndexes) {
        try {
          // 이미 존재하는 인덱스는 건너뛰기
          if (existingIndexNames.includes(indexDef.options.name)) {
            console.log(`   ⏭️  ${indexDef.options.name} 인덱스는 이미 존재합니다.`);
            continue;
          }

          // 인덱스 생성
          await collection.createIndex(indexDef.index, indexDef.options);
          console.log(`   ✅ ${indexDef.options.name} 인덱스 생성 완료`);
        } catch (error) {
          // 중복 키 에러는 무시 (이미 유니크 인덱스가 존재하는 경우)
          if (error.code === 85 || error.code === 86) {
            console.log(`   ⚠️  ${indexDef.options.name} 인덱스 생성 실패: 유사한 인덱스가 이미 존재합니다.`);
          } else {
            console.error(`   ❌ ${indexDef.options.name} 인덱스 생성 실패:`, error.message);
          }
        }
      }
      console.log('');
    }

    // 인덱스 통계 출력
    console.log('\n📊 인덱스 생성 완료! 현재 인덱스 상태:\n');

    for (const collectionName of Object.keys(indexes)) {
      const collection = mongoose.connection.collection(collectionName);
      const currentIndexes = await collection.indexes();

      console.log(`${collectionName} 컬렉션 (${currentIndexes.length}개 인덱스):`);
      currentIndexes.forEach(idx => {
        const keys = Object.keys(idx.key).map(k => `${k}: ${idx.key[k]}`).join(', ');
        console.log(`  - ${idx.name}: { ${keys} }`);
      });
      console.log('');
    }

    console.log('✅ 모든 인덱스 생성 작업이 완료되었습니다!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 인덱스 생성 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
console.log('🚀 MongoDB 인덱스 생성 스크립트 시작...\n');
addIndexes();
const mongoose = require('mongoose');
const Tag = require('./models/Tag');
require('dotenv').config({ path: './.env' });

async function checkRegionTags() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB 연결 성공');

    // 지역 태그 조회
    const regionTags = await Tag.find({ category: 'region', isActive: true }).sort({ order: 1 });

    console.log('\n=== 현재 지역 태그 목록 ===');
    console.log(`총 ${regionTags.length}개의 지역 태그가 있습니다.\n`);

    regionTags.forEach(tag => {
      console.log(`값: ${tag.value}, 표시명: ${tag.displayName}, 순서: ${tag.order}`);
    });

    // 선택없음 태그 확인
    const noSelectionTag = regionTags.find(tag => tag.value === '0');
    if (noSelectionTag) {
      console.log('\n✅ "지역 선택 안함" 태그가 존재합니다:', noSelectionTag.displayName);
    } else {
      console.log('\n❌ "지역 선택 안함" 태그가 없습니다!');
    }

    // Exit 13 미만 태그 확인
    const under13Tag = regionTags.find(tag => tag.value === '<13');
    if (under13Tag) {
      console.log('✅ "Exit 13 이하" 태그가 존재합니다:', under13Tag.displayName);
    } else {
      console.log('❌ "Exit 13 이하" 태그가 없습니다!');
    }

    // Exit 73 초과 태그 확인
    const over73Tag = regionTags.find(tag => tag.value === '>73');
    if (over73Tag) {
      console.log('✅ "Exit 73 이상" 태그가 존재합니다:', over73Tag.displayName);
    } else {
      console.log('❌ "Exit 73 이상" 태그가 없습니다!');
    }

  } catch (error) {
    console.error('태그 확인 중 오류 발생:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB 연결 종료');
  }
}

// 스크립트 실행
checkRegionTags();
const mongoose = require('mongoose');
const Tag = require('../../models/Tag');
const Counter = require('../../models/Counter');
const testConfig = require('../../config/test.config');

/**
 * 테스트 데이터베이스 초기화
 */
const initTestDatabase = async () => {
  try {
    // 기존 연결이 있으면 닫기
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // 테스트 DB 연결
    await mongoose.connect(testConfig.database.url, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    console.log('✅ 테스트 데이터베이스 연결 성공');

    // DB 초기화 옵션이 켜져있으면 초기화
    if (testConfig.database.dropBeforeTest) {
      await dropAllCollections();
      console.log('✅ 테스트 데이터베이스 초기화 완료');
    }

    // 필수 데이터 초기화
    await initializeEssentialData();
    console.log('✅ 필수 데이터 초기화 완료');

    return true;
  } catch (error) {
    console.error('❌ 테스트 데이터베이스 초기화 실패:', error.message);
    throw error;
  }
};

/**
 * 모든 컬렉션 삭제
 */
const dropAllCollections = async () => {
  const collections = await mongoose.connection.db.collections();
  
  for (let collection of collections) {
    await collection.drop().catch(() => {
      // 컬렉션이 없을 수도 있음
    });
  }
};

/**
 * 필수 데이터 초기화 (카운터, 태그 등)
 */
const initializeEssentialData = async () => {
  // 카운터 초기화
  await Counter.findOneAndUpdate(
    { _id: 'postNumber' },
    { seq: 0 },
    { upsert: true, new: true }
  );

  // 기본 태그 초기화
  await initializeTags();
};

/**
 * 태그 초기화 (최소한의 테스트용 태그만)
 */
const initializeTags = async () => {
  // Type 태그
  const typeTags = [
    { category: 'type', value: '공지', displayName: '공지', order: 0 },
    { category: 'type', value: '사고팔고', displayName: '사고팔고', order: 1 },
    { category: 'type', value: '부동산', displayName: '부동산', order: 2 },
    { category: 'type', value: '생활정보', displayName: '생활정보', order: 3 },
    { category: 'type', value: '모임', displayName: '모임', order: 4 },
    { category: 'type', value: '기타', displayName: '기타', order: 5 }
  ];

  // Region 태그 (테스트용 일부만)
  const regionTags = [
    { category: 'region', value: '0', displayName: '지역 선택 안함', order: 0 },
    { category: 'region', value: '24', displayName: 'Exit 24 - Flushing', order: 24 },
    { category: 'region', value: '30', displayName: 'Exit 30 - Douglaston', order: 30 },
    { category: 'region', value: '40', displayName: 'Exit 40 - Syosset', order: 40 },
    { category: 'region', value: '50', displayName: 'Exit 50 - Dix Hills', order: 50 }
  ];

  // Category 태그 (소주제)
  const categoryTags = [
    { category: 'category', value: '생활용품', displayName: '생활용품', parentCategory: '사고팔고', order: 0 },
    { category: 'category', value: '가전제품', displayName: '가전제품', parentCategory: '사고팔고', order: 1 },
    { category: 'category', value: '의류', displayName: '의류', parentCategory: '사고팔고', order: 2 },
    { category: 'category', value: '가구', displayName: '가구', parentCategory: '사고팔고', order: 3 },
    { category: 'category', value: '기타', displayName: '기타', parentCategory: '사고팔고', order: 4 }
  ];

  // 모든 태그 upsert
  const allTags = [...typeTags, ...regionTags, ...categoryTags];
  
  for (const tag of allTags) {
    await Tag.findOneAndUpdate(
      { category: tag.category, value: tag.value },
      tag,
      { upsert: true, new: true }
    );
  }
};

/**
 * 테스트 종료 시 정리
 */
const cleanupTestDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('✅ 테스트 데이터베이스 연결 종료');
  }
};

module.exports = {
  initTestDatabase,
  dropAllCollections,
  initializeEssentialData,
  cleanupTestDatabase
};
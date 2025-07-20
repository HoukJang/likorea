const Tag = require('../models/Tag');

/**
 * 태그 시스템 초기화
 * 서버 시작 시 또는 관리자가 수동으로 실행할 수 있음
 */
const initializeTags = async () => {
  try {
    console.log('태그 시스템 초기화 시작...');

    // Type 태그들
    const typeTags = [
      { value: '사고팔고', displayName: '사고팔고', order: 1 },
      { value: '부동산', displayName: '부동산', order: 2 },
      { value: '생활정보', displayName: '생활정보', order: 3 },
      { value: '모임', displayName: '모임', order: 4 },
      { value: '기타', displayName: '기타', order: 5 }
    ];

    // Region 태그들 (Exit 13부터 Exit 73까지)
    const regionTags = [];
    for (let exit = 13; exit <= 73; exit++) {
      regionTags.push({
        value: exit.toString(),
        displayName: `Exit ${exit}`,
        order: exit
      });
    }
    // Exit 13 이하
    regionTags.push({
      value: '<=13',
      displayName: 'Exit 13 이하',
      order: 12
    });
    // Exit 73 이상
    regionTags.push({
      value: '>73',
      displayName: 'Exit 73 이상',
      order: 74
    });

    // Type 태그 생성/업데이트
    for (const tagData of typeTags) {
      await Tag.findOneAndUpdate(
        { category: 'type', value: tagData.value },
        { 
          ...tagData, 
          category: 'type',
          isActive: true 
        },
        { upsert: true, new: true }
      );
    }

    // Region 태그 생성/업데이트
    for (const tagData of regionTags) {
      await Tag.findOneAndUpdate(
        { category: 'region', value: tagData.value },
        { 
          ...tagData, 
          category: 'region',
          isActive: true 
        },
        { upsert: true, new: true }
      );
    }

    console.log('태그 시스템 초기화 완료!');
    console.log(`- Type 태그: ${typeTags.length}개`);
    console.log(`- Region 태그: ${regionTags.length}개 (Exit 13 이하, Exit 13~73, Exit 73 이상)`);

  } catch (error) {
    console.error('태그 시스템 초기화 실패:', error);
    throw error;
  }
};

/**
 * 특정 카테고리의 태그 조회
 */
const getTagsByCategory = async (category) => {
  try {
    return await Tag.getTagsByCategory(category);
  } catch (error) {
    console.error(`태그 조회 실패 (카테고리: ${category}):`, error);
    throw error;
  }
};

/**
 * 모든 활성 태그 조회
 */
const getAllActiveTags = async () => {
  try {
    return await Tag.getAllActiveTags();
  } catch (error) {
    console.error('모든 태그 조회 실패:', error);
    throw error;
  }
};

/**
 * 새 태그 추가
 */
const addTag = async (category, value, displayName, order = 0, description = '') => {
  try {
    const tag = new Tag({
      category,
      value,
      displayName,
      order,
      description,
      isActive: true
    });
    return await tag.save();
  } catch (error) {
    console.error('태그 추가 실패:', error);
    throw error;
  }
};

/**
 * 태그 비활성화
 */
const deactivateTag = async (category, value) => {
  try {
    return await Tag.findOneAndUpdate(
      { category, value },
      { isActive: false },
      { new: true }
    );
  } catch (error) {
    console.error('태그 비활성화 실패:', error);
    throw error;
  }
};

module.exports = {
  initializeTags,
  getTagsByCategory,
  getAllActiveTags,
  addTag,
  deactivateTag
}; 
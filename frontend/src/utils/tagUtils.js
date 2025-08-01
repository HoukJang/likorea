/**
 * 태그 관련 유틸리티 함수들
 */

// 태그 표시명을 가져오는 함수
export const getTagDisplayName = (tagValue, tagList, category) => {
  if (!tagValue || !tagList || !tagList[category]) {
    return tagValue || '알 수 없음';
  }

  const tag = tagList[category].find(t => t.value === tagValue);
  return tag ? tag.displayName : tagValue;
};

// 태그 정보를 포맷팅하는 함수
export const formatTagInfo = (tags, tagList) => {
  if (!tags || !tagList) {
    return { type: '알 수 없음', region: '알 수 없음' };
  }

  return {
    type: getTagDisplayName(tags.type, tagList, 'type'),
    region: getTagDisplayName(tags.region, tagList, 'region'),
  };
};

// 태그 표시용 컴포넌트를 위한 데이터 생성
export const createTagDisplayData = (tags, tagList) => {
  if (!tags || !tagList) {
    return [];
  }

  const displayData = [];

  if (tags.type) {
    displayData.push({
      category: 'type',
      value: tags.type,
      displayName: getTagDisplayName(tags.type, tagList, 'type'),
    });
  }

  if (tags.subcategory) {
    displayData.push({
      category: 'subcategory',
      value: tags.subcategory,
      displayName: getTagDisplayName(tags.subcategory, tagList, 'category'),
    });
  }

  if (tags.region) {
    displayData.push({
      category: 'region',
      value: tags.region,
      displayName: getTagDisplayName(tags.region, tagList, 'region'),
    });
  }

  return displayData;
};

// 태그 관련 유틸리티 함수들

// 글종류별 소주제 분류 (백엔드와 동일)
export const SUB_CATEGORIES = {
  공지: ['일반', '긴급'],
  사고팔고: ['나눔', '중고'],
  부동산: ['렌트', '룸메이트'],
  생활정보: ['맛집', '업체정보', '정착가이드', '뉴스'],
  모임: ['번개', '정기'],
};

// 기본 태그들
export const DEFAULT_TAGS = {
  types: ['공지', '사고팔고', '부동산', '생활정보', '모임', '기타'],
  regions: [
    '전체',
    '맨해튼',
    '브루클린',
    '퀸즈',
    '브롱크스',
    '스태튼아일랜드',
    '롱아일랜드',
    '뉴저지',
    '기타',
  ],
};

// 글종류별 색상 매핑
export const TYPE_COLORS = {
  공지: '#ef4444', // 빨간색
  사고팔고: '#f59e0b', // 주황색
  부동산: '#10b981', // 초록색
  생활정보: '#3b82f6', // 파란색
  모임: '#8b5cf6', // 보라색
  기타: '#6b7280', // 회색
};

// 소주제별 색상 매핑
export const SUB_CATEGORY_COLORS = {
  // 공지
  일반: '#ef4444',
  긴급: '#dc2626',
  // 사고팔고
  나눔: '#f59e0b',
  중고: '#d97706',
  // 부동산
  렌트: '#10b981',
  룸메이트: '#059669',
  // 생활정보
  맛집: '#3b82f6',
  업체정보: '#2563eb',
  정착가이드: '#1d4ed8',
  뉴스: '#1e40af',
  // 모임
  번개: '#8b5cf6',
  정기: '#7c3aed',
};

/**
 * 글종류에 따른 소주제 목록 반환
 * @param {string} type - 글종류
 * @returns {Array} 소주제 목록
 */
export const getSubCategoriesByType = type => {
  return SUB_CATEGORIES[type] || [];
};

/**
 * 소주제의 색상 반환
 * @param {string} subcategory - 소주제
 * @returns {string} 색상 코드
 */
export const getSubCategoryColor = subcategory => {
  return SUB_CATEGORY_COLORS[subcategory] || '#6b7280';
};

/**
 * 글종류의 색상 반환
 * @param {string} type - 글종류
 * @returns {string} 색상 코드
 */
export const getTypeColor = type => {
  return TYPE_COLORS[type] || '#6b7280';
};

/**
 * 태그 표시 텍스트 생성 (글종류와 소주제만)
 * @param {Object} tags - 태그 객체
 * @returns {string} 표시 텍스트
 */
export const getTagDisplayText = tags => {
  if (!tags) return '';

  const parts = [];

  if (tags.type) {
    parts.push(tags.type);
  }

  if (tags.subcategory) {
    parts.push(tags.subcategory);
  }

  return parts.join(' > ');
};

/**
 * 소주제 표시 텍스트 생성
 * @param {string} type - 글종류
 * @param {string} subcategory - 소주제
 * @returns {string} 표시 텍스트
 */
export const getSubCategoryDisplayText = (type, subcategory) => {
  if (!type || !subcategory) return '';
  return `${type} > ${subcategory}`;
};

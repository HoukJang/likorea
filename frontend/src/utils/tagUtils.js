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
    region: getTagDisplayName(tags.region, tagList, 'region')
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
      displayName: getTagDisplayName(tags.type, tagList, 'type')
    });
  }
  
  if (tags.region) {
    displayData.push({
      category: 'region',
      value: tags.region,
      displayName: getTagDisplayName(tags.region, tagList, 'region')
    });
  }
  
  return displayData;
}; 
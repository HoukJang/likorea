/**
 * HTML 콘텐츠 내의 이미지 태그에 lazy loading 및 최적화 속성 추가
 */
export function optimizeImagesInContent(content) {
  if (!content) return '';
  
  // 브라우저 환경이 아니면 원본 반환
  if (typeof window === 'undefined' || !window.DOMParser) {
    return content;
  }
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${content}</div>`, 'text/html');
    const container = doc.body.firstChild;
    
    // 모든 img 태그 찾기
    const images = container.querySelectorAll('img');
    
    images.forEach(img => {
      // lazy loading 적용
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      // decoding 속성 추가
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }
      
      // width와 height가 없으면 레이아웃 시프트 방지를 위해 aspect-ratio 스타일 추가
      if (!img.hasAttribute('width') && !img.hasAttribute('height')) {
        const currentStyle = img.getAttribute('style') || '';
        if (!currentStyle.includes('aspect-ratio')) {
          img.setAttribute('style', `${currentStyle}; max-width: 100%; height: auto;`);
        }
      }
    });
    
    return container.innerHTML;
  } catch (error) {
    console.error('Error optimizing images:', error);
    return content;
  }
}

/**
 * 콘텐츠에 링크 변환과 이미지 최적화를 모두 적용
 */
export function processContent(content, linkifyFn) {
  if (!content) return '';
  
  // 먼저 링크 변환 적용
  let processed = linkifyFn ? linkifyFn(content) : content;
  
  // 그 다음 이미지 최적화 적용
  processed = optimizeImagesInContent(processed);
  
  return processed;
}
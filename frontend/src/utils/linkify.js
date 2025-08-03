/**
 * URL 링크 변환 유틸리티
 * 텍스트 내의 URL을 클릭 가능한 링크로 변환
 */

/**
 * HTML 콘텐츠의 URL을 링크로 변환
 * @param {string} content - HTML 콘텐츠
 * @returns {string} 링크가 변환된 HTML
 */
export function linkifyContent(content) {
  if (!content) return '';
  
  // 이미 링크 태그가 있는 경우 건너뛰기 위한 처리
  // HTML 태그 내부의 URL은 변환하지 않음
  const parts = content.split(/(<[^>]*>)/);
  
  return parts.map((part, index) => {
    // 홀수 인덱스는 HTML 태그
    if (index % 2 === 1) {
      return part;
    }
    
    // 짝수 인덱스는 텍스트 콘텐츠
    let text = part;
    
    // 패턴 1: "원문: URL" 또는 "링크: URL" 형식을 "[원문 링크]"로 변환
    text = text.replace(/(?:원문|링크):\s*(https?:\/\/[^\s<]+)/gi, 
      '<a href="$1" target="_blank" rel="noopener noreferrer">[원문 링크]</a>');
    
    // 패턴 2: Google News URL을 "[원문 링크]"로 변환
    text = text.replace(/(https?:\/\/news\.google\.com\/[^\s<]+)/g, 
      '<a href="$1" target="_blank" rel="noopener noreferrer">[원문 링크]</a>');
    
    // 패턴 3: 일반 URL을 클릭 가능한 링크로 변환
    // 이미 변환된 링크는 제외
    text = text.replace(
      /(https?:\/\/(?!news\.google\.com)[^\s<]+)(?![^<]*<\/a>)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    return text;
  }).join('');
}

/**
 * 일반 텍스트의 URL을 링크로 변환 (에디터용)
 * @param {string} text - 일반 텍스트
 * @returns {string} 링크가 변환된 HTML
 */
export function linkifyText(text) {
  if (!text) return '';
  
  // HTML 이스케이프
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  // URL을 링크로 변환
  let linked = escaped;
  
  // 패턴 1: "원문: URL" 또는 "링크: URL" 형식
  linked = linked.replace(/(?:원문|링크):\s*(https?:\/\/[^\s]+)/gi, 
    '원문: <a href="$1" target="_blank" rel="noopener noreferrer">[링크]</a>');
  
  // 패턴 2: 일반 URL
  linked = linked.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  
  // 줄바꿈을 <br>로 변환
  linked = linked.replace(/\n/g, '<br>');
  
  return linked;
}
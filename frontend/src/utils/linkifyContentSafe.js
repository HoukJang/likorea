/**
 * 안전한 URL 링크 변환 유틸리티
 * DOM parser를 사용하여 HTML 구조를 보존하면서 텍스트 노드의 URL만 변환
 */

export function linkifyContentSafe(content) {
  if (!content) return '';
  
  // 브라우저 환경이 아니면 원본 반환
  if (typeof window === 'undefined' || !window.DOMParser) {
    return content;
  }
  
  try {
    // DOM parser를 사용하여 HTML 파싱
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${content}</div>`, 'text/html');
    const container = doc.body.firstChild;
    
    // 텍스트 노드만 처리
    const processTextNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent;
        
        // URL 패턴들
        const patterns = [
          // 패턴 1: "원문: URL" 또는 "링크: URL" 형식
          {
            regex: /(?:원문|링크):\s*(https?:\/\/[^\s<]+)/gi,
            replacement: '원문: <a href="$1" target="_blank" rel="noopener noreferrer">[링크]</a>'
          },
          // 패턴 2: Google News URL
          {
            regex: /(https?:\/\/news\.google\.com\/[^\s<]+)/g,
            replacement: '<a href="$1" target="_blank" rel="noopener noreferrer">[원문 링크]</a>'
          },
          // 패턴 3: 일반 URL
          {
            regex: /(https?:\/\/[^\s<]+)/g,
            replacement: '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
          }
        ];
        
        // 각 패턴 적용
        patterns.forEach(({ regex, replacement }) => {
          text = text.replace(regex, replacement);
        });
        
        // 변환된 텍스트로 노드 교체
        if (text !== node.textContent) {
          const span = document.createElement('span');
          span.innerHTML = text;
          node.parentNode.replaceChild(span, node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // 링크 태그는 건너뛰기
        if (node.tagName !== 'A') {
          // 자식 노드들 재귀적으로 처리
          const childNodes = Array.from(node.childNodes);
          childNodes.forEach(processTextNode);
        }
      }
    };
    
    // 모든 노드 처리
    processTextNode(container);
    
    // 결과 반환
    return container.innerHTML;
  } catch (error) {
    // 오류 발생 시 원본 반환
    return content;
  }
}
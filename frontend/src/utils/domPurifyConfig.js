// DOMPurify 공통 설정
export const domPurifyConfig = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'img', 'a', 'blockquote', 'ul', 'ol', 'li', 'div', 'pre', 'code', 'span'],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'style', 'target', 'class'],
  ALLOW_DATA_ATTR: false,
  // data: URL을 명시적으로 허용
  ADD_DATA_URI_TAGS: ['img'],
  // 모든 프로토콜 허용 (data:, http:, https: 등)
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
  // HTML entities를 유지 (nbsp 등)
  KEEP_CONTENT: true,
  // 텍스트 노드 내의 HTML entities 유지
  FORCE_BODY: true
};
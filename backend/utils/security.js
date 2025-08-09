/**
 * 보안 관련 유틸리티 함수
 */

/**
 * 정규표현식 특수문자 이스케이프
 * MongoDB regex injection 방지
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} 이스케이프된 텍스트
 */
const escapeRegex = (text) => {
  if (!text) return '';
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * HTML 태그 제거 (텍스트만 추출)
 * @param {string} html - HTML 문자열
 * @returns {string} 순수 텍스트
 */
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

/**
 * SQL/NoSQL Injection 방지를 위한 문자열 검증
 * @param {string} input - 검증할 문자열
 * @returns {boolean} 안전한 문자열인지 여부
 */
const isSafeString = (input) => {
  if (!input) return true;

  // 위험한 패턴 체크
  const dangerousPatterns = [
    /\$where/i,
    /\$function/i,
    /\$exec/i,
    /\$system/i,
    /\$lookup/i,
    /\$merge/i,
    /\$out/i,
    /<script/i,
    /javascript:/i,
    /on\w+=/i  // onclick=, onerror= 등
  ];

  return !dangerousPatterns.some(pattern => pattern.test(input));
};

/**
 * 안전한 정수 변환
 * @param {any} value - 변환할 값
 * @param {number} defaultValue - 기본값
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @returns {number} 안전한 정수
 */
const safeParseInt = (value, defaultValue = 0, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const parsed = parseInt(value);
  if (isNaN(parsed)) return defaultValue;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
};

/**
 * MongoDB ObjectId 검증
 * @param {string} id - 검증할 ID
 * @returns {boolean} 유효한 ObjectId인지 여부
 */
const isValidObjectId = (id) => {
  if (!id) return false;
  return /^[a-fA-F0-9]{24}$/.test(id);
};

/**
 * 파일 업로드 보안 검증
 * @param {string} filename - 파일명
 * @param {Array<string>} allowedExtensions - 허용된 확장자 배열
 * @returns {boolean} 안전한 파일명인지 여부
 */
const isSafeFilename = (filename, allowedExtensions = []) => {
  if (!filename) return false;

  // 경로 탐색 공격 방지
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false;
  }

  // 확장자 검증
  if (allowedExtensions.length > 0) {
    const ext = filename.split('.').pop().toLowerCase();
    return allowedExtensions.includes(ext);
  }

  return true;
};

/**
 * XSS 방지를 위한 출력 인코딩
 * @param {string} str - 인코딩할 문자열
 * @returns {string} 인코딩된 문자열
 */
const encodeHtml = (str) => {
  if (!str) return '';

  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
    '/': '&#x2F;'
  };

  return String(str).replace(/[&<>"'/]/g, (s) => htmlEntities[s]);
};

module.exports = {
  escapeRegex,
  stripHtml,
  isSafeString,
  safeParseInt,
  isValidObjectId,
  isSafeFilename,
  encodeHtml
};
/**
 * 봇/크롤러 User-Agent 감지 유틸리티
 * 트래픽 로깅 및 집계 시 사람 트래픽과 봇 트래픽을 구분하기 위해 사용
 */

// 봇으로 간주할 User-Agent 패턴 (대소문자 구분 없이 매칭)
const BOT_PATTERNS = [
  'bot',
  'crawler',
  'spider',
  'slurp',
  'bingpreview',
  'facebookexternalhit',
  'whatsapp',
  'telegram',
  'discord',
  'kakaotalk-scrap',
  'headless',
  'lighthouse',
  'pingdom',
  'uptimerobot',
  'curl',
  'wget',
  'python-requests',
  'python-urllib',
  'axios',
  'go-http-client',
  'okhttp',
  'java/',
  'phantomjs'
];

const BOT_REGEX = new RegExp(BOT_PATTERNS.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');

/**
 * User-Agent 문자열이 봇/크롤러인지 판별
 * @param {string} userAgent - 요청의 User-Agent 헤더 값
 * @returns {boolean} 봇으로 판별되면 true
 */
const isBotUserAgent = userAgent => {
  // User-Agent가 없는 요청은 봇으로 간주 (일반 브라우저는 항상 UA를 전송)
  if (!userAgent || typeof userAgent !== 'string' || userAgent.trim() === '') {
    return true;
  }

  return BOT_REGEX.test(userAgent);
};

module.exports = { isBotUserAgent };

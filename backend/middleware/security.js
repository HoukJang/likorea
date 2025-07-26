const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

/**
 * Rate Limiting 설정
 */
const createRateLimiters = () => {
  // 일반 API 요청 제한
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // 최대 100개 요청
    message: {
      error: '너무 많은 요청이 발생했습니다. 15분 후에 다시 시도해주세요.',
      retryAfter: 15 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // 로그인 요청 제한 (더 엄격)
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 5, // 최대 5번 로그인 시도
    message: {
      error: '로그인 시도가 너무 많습니다. 15분 후에 다시 시도해주세요.',
      retryAfter: 15 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // 성공한 요청은 카운트하지 않음
  });

  // 회원가입 요청 제한
  const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1시간
    max: 3, // 최대 3번 회원가입 시도
    message: {
      error: '회원가입 시도가 너무 많습니다. 1시간 후에 다시 시도해주세요.',
      retryAfter: 60 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  });

  // 게시글 작성 제한
  const postLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10분
    max: 10, // 최대 10개 게시글 작성
    message: {
      error: '게시글 작성이 너무 많습니다. 10분 후에 다시 시도해주세요.',
      retryAfter: 10 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  return {
    generalLimiter,
    loginLimiter,
    signupLimiter,
    postLimiter,
  };
};

/**
 * Helmet 보안 헤더 설정
 */
const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
};

/**
 * 추가 보안 미들웨어
 */
const additionalSecurity = (req, res, next) => {
  // XSS 방어 헤더
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // 클릭재킹 방어
  res.setHeader('X-Frame-Options', 'DENY');

  // MIME 타입 스니핑 방어
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 리퍼러 정책
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 권한 정책
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

/**
 * IP 화이트리스트 체크
 */
const ipWhitelist = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const whitelist = process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [];

  if (whitelist.length > 0 && !whitelist.includes(clientIP)) {
    return res.status(403).json({
      error: '접근이 허용되지 않은 IP입니다.',
      ip: clientIP,
    });
  }

  next();
};

/**
 * 요청 크기 제한
 */
const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    return res.status(413).json({
      error: '요청 크기가 너무 큽니다. 최대 10MB까지 허용됩니다.',
    });
  }

  next();
};

module.exports = {
  createRateLimiters,
  configureHelmet,
  additionalSecurity,
  ipWhitelist,
  requestSizeLimit,
};

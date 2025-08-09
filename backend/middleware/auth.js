const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthenticationError, AuthorizationError } = require('./errorHandler');

/**
 * JWT 토큰 인증 미들웨어
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Authorization 헤더 또는 쿠키에서 토큰 확인
    const authHeader = req.headers['authorization'];
    const tokenFromHeader = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    const tokenFromCookie = req.cookies?.authToken;

    const token = tokenFromHeader || tokenFromCookie;

    // 개발 환경에서만 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log('인증 미들웨어 - 요청 경로:', req.path);
      console.log('인증 미들웨어 - 요청 메서드:', req.method);
    }

    if (!token) {
      // 토큰이 없어도 게시글 조회는 가능하도록 허용
      if (req.method === 'GET') {
        return next();
      }
      throw new AuthenticationError('인증이 필요합니다.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 사용자 정보 확인
    const user = await User.findById(decoded._id);
    if (!user) {
      throw new AuthenticationError('유효하지 않은 토큰입니다.');
    }

    // 요청 객체에 사용자 정보 추가
    req.user = {
      _id: user._id,
      id: user.id,
      email: user.email,
      authority: user.authority
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('유효하지 않은 토큰입니다.'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthenticationError('토큰이 만료되었습니다.'));
    } else {
      next(error);
    }
  }
};

/**
 * 관리자 권한 확인 미들웨어
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AuthenticationError('로그인이 필요합니다.'));
  }

  if (req.user.authority < 5) {
    return next(new AuthorizationError('관리자 권한이 필요합니다.'));
  }

  next();
};

/**
 * 사용자 권한 확인 미들웨어 (최소 권한 레벨 지정)
 */
const requireAuthority = (minAuthority = 1) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('로그인이 필요합니다.'));
    }

    if (req.user.authority < minAuthority) {
      return next(
        new AuthorizationError(
          `권한이 부족합니다. (필요: ${minAuthority}, 현재: ${req.user.authority})`
        )
      );
    }

    next();
  };
};

/**
 * 토큰 검증 전용 미들웨어 (GET 요청도 토큰 필수)
 */
const verifyTokenMiddleware = async (req, res, next) => {
  try {
    // 디버깅 로그 추가
    console.log('=== verifyTokenMiddleware 디버깅 ===');
    console.log('요청 URL:', req.url);
    console.log('쿠키들:', req.cookies);
    console.log('authToken 쿠키:', req.cookies?.authToken);
    console.log('Authorization 헤더:', req.headers['authorization']);

    // Authorization 헤더 또는 쿠키에서 토큰 확인
    const authHeader = req.headers['authorization'];
    const tokenFromHeader = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    const tokenFromCookie = req.cookies?.authToken;

    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      console.log('토큰이 없습니다!');
      // 토큰이 없으면 req.user를 null로 설정
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 사용자 정보 확인
    const user = await User.findById(decoded._id);
    if (!user) {
      req.user = null;
      return next();
    }

    // 요청 객체에 사용자 정보 추가
    req.user = {
      _id: user._id,
      id: user.id,
      email: user.email,
      authority: user.authority
    };

    next();
  } catch (error) {
    // 토큰 오류 시에도 null로 설정하고 계속 진행
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAuthority,
  verifyTokenMiddleware
};

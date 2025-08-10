const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthenticationError, AuthorizationError } = require('./errorHandler');

/**
 * JWT 토큰 인증 미들웨어
 * 토큰이 있으면 검증하고 사용자 정보를 req.user에 추가
 * 토큰이 없으면 req.user를 null로 설정하고 계속 진행
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Authorization 헤더 또는 쿠키에서 토큰 확인
    const authHeader = req.headers['authorization'];
    const tokenFromHeader = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    const tokenFromCookie = req.cookies?.authToken;

    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
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
    // 토큰 검증 실패 시에도 req.user를 null로 설정하고 계속 진행
    req.user = null;
    next();
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
 * 인증이 필수인 라우트에서 사용하는 미들웨어
 * authenticateToken 이후에 사용하여 인증 여부를 확인
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return next(new AuthenticationError('로그인이 필요합니다.'));
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAuth,
  requireAdmin,
  requireAuthority
};

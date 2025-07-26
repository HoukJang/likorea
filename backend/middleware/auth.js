const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthorizationError } = require('./errorHandler');

/**
 * JWT 토큰 인증 미들웨어
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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
      throw new AuthorizationError('인증 토큰이 필요합니다.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 사용자 정보 확인
    const user = await User.findById(decoded._id);
    if (!user) {
      throw new AuthorizationError('유효하지 않은 토큰입니다.');
    }

    // 요청 객체에 사용자 정보 추가
    req.user = {
      _id: user._id,
      id: user.id,
      email: user.email,
      authority: user.authority,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AuthorizationError('유효하지 않은 토큰입니다.'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthorizationError('토큰이 만료되었습니다.'));
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
    return next(new AuthorizationError('로그인이 필요합니다.'));
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
      return next(new AuthorizationError('로그인이 필요합니다.'));
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

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAuthority,
};

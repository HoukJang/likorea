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

    console.log('인증 미들웨어 - 요청 경로:', req.path);
    console.log('인증 미들웨어 - 요청 메서드:', req.method);
    console.log('인증 미들웨어 - Authorization 헤더:', authHeader);
    console.log('인증 미들웨어 - 추출된 토큰:', token ? token.substring(0, 20) + '...' : '없음');

    if (!token) {
      // 토큰이 없어도 게시글 조회는 가능하도록 허용
      if (req.method === 'GET') {
        console.log('인증 미들웨어 - GET 요청이므로 토큰 없이 진행');
        return next();
      }
      console.log('인증 미들웨어 - 토큰이 없어서 오류 발생');
      throw new AuthorizationError('인증 토큰이 필요합니다.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('인증 미들웨어 - 토큰 디코딩 성공:', decoded);
    
    // 사용자 정보 확인
    const user = await User.findById(decoded._id);
    if (!user) {
      console.log('인증 미들웨어 - 사용자를 찾을 수 없음:', decoded._id);
      throw new AuthorizationError('유효하지 않은 토큰입니다.');
    }

    console.log('인증 미들웨어 - 사용자 정보 확인:', {
      id: user.id,
      email: user.email,
      authority: user.authority
    });

    // 요청 객체에 사용자 정보 추가
    req.user = {
      _id: user._id,
      id: user.id,
      email: user.email,
      authority: user.authority
    };

    console.log('인증 미들웨어 - 인증 성공, 다음 미들웨어로 진행');
    next();
  } catch (error) {
    console.log('인증 미들웨어 - 오류 발생:', error.message);
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
      return next(new AuthorizationError(`권한이 부족합니다. (필요: ${minAuthority}, 현재: ${req.user.authority})`));
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAuthority
}; 
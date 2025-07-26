const logger = require('../utils/logger');

// 커스텀 에러 클래스들
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = '인증이 필요합니다') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = '권한이 없습니다') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = '리소스를 찾을 수 없습니다') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = '리소스 충돌이 발생했습니다') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

// 에러 처리 미들웨어
const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message || '알 수 없는 오류가 발생했습니다';

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    const message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
    error = new ValidationError(message);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field}가 이미 존재합니다`;
    error = new ConflictError(message);
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    const message = '잘못된 ID 형식입니다';
    error = new ValidationError(message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('유효하지 않은 토큰입니다');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('토큰이 만료되었습니다');
  }

  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Development vs Production error response
  if (process.env.NODE_ENV === 'development') {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      statusCode: error.statusCode || 500,
    });
  }

  // Production error response
  return res.status(error.statusCode || 500).json({
    success: false,
    error: error.isOperational ? error.message : '서버 내부 오류가 발생했습니다',
    statusCode: error.statusCode || 500,
  });
};

// 404 에러 처리
const notFound = (req, res, next) => {
  const error = new NotFoundError(`${req.originalUrl} 경로를 찾을 수 없습니다`);
  next(error);
};

// 비동기 에러 래퍼
const asyncHandler = fn => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  errorHandler,
  notFound,
  asyncHandler,
};

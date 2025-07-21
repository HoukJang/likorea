const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { initializeTags } = require('./utils/initTags');
const { 
  createRateLimiters, 
  configureHelmet, 
  additionalSecurity, 
  ipWhitelist, 
  requestSizeLimit 
} = require('./middleware/security');

const userRoutes = require('./routes/userRoutes');
const boardRoutes = require('./routes/boardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const tagRoutes = require('./routes/tagRoutes');

// Swagger 설정
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const app = express();
// trust proxy 설정을 조건부로 적용
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // 단일 프록시만 신뢰
}

// 보안 미들웨어 적용
app.use(configureHelmet());
app.use(additionalSecurity);
app.use(requestSizeLimit);

// 요청 본문 파싱 및 CORS 설정
app.use(express.json());

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 로깅 미들웨어
app.use(logger.request);

// Rate Limiting 설정
const { generalLimiter, loginLimiter, signupLimiter, postLimiter } = createRateLimiters();

// 데이터베이스 연결 및 태그 초기화
connectDB().then(async () => {
  try {
    await initializeTags();
    logger.info('태그 시스템 초기화 완료');
  } catch (error) {
    logger.error('태그 시스템 초기화 실패:', error);
  }
});

// Swagger UI 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// API 라우트 설정 (Rate Limiting 적용)
app.use('/api/users', generalLimiter, userRoutes);
app.use('/api/boards', generalLimiter, boardRoutes);
app.use('/api/admin', generalLimiter, adminRoutes);
app.use('/api/tags', generalLimiter, tagRoutes);

// 404 에러 처리 (라우트 설정 후에 위치)
app.use(notFound);

// 에러 처리 미들웨어 (마지막에 위치)
app.use(errorHandler);

// Express 앱을 export (테스트용)
module.exports = app;

// 개발 환경에서만 서버 시작
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5001;
  const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

  app.listen(PORT, HOST, () => {
    logger.info(`서버가 ${HOST}:${PORT}에서 실행 중입니다.`);
    logger.info(`환경: ${process.env.NODE_ENV}`);
  });
}

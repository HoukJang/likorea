const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();

// 환경 변수 검증 (테스트 환경에서는 건너뛰기)
if (process.env.NODE_ENV !== 'test') {
  const { validateEnvironment } = require('./utils/validateEnv');
  validateEnvironment();
}

const { connectDB } = require('./config/db');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { initializeTags } = require('./utils/initTags');
const { initializeBots } = require('./utils/initBots');
const {
  createRateLimiters,
  configureHelmet,
  additionalSecurity,
  requestSizeLimit,
} = require('./middleware/security');
const trafficLogger = require('./middleware/trafficLogger');

const userRoutes = require('./routes/userRoutes');
const boardRoutes = require('./routes/boardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const tagRoutes = require('./routes/tagRoutes');
const trafficRoutes = require('./routes/trafficRoutes');
const botRoutes = require('./routes/botRoutes');
const approvalRoutes = require('./routes/approvalRoutes');

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

// Cookie parser 미들웨어
app.use(cookieParser());

// 요청 본문 파싱 및 CORS 설정
app.use(express.json());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

// Production에서 likorea.com과 www.likorea.com 모두 허용
const corsOptions = {
  origin: (origin, callback) => {
    // origin이 없는 경우 (모바일 앱, Postman 등) 허용
    if (!origin) {
      return callback(null, true);
    }

    // development 환경에서는 모든 localhost 허용
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }

    // production에서 likorea.com 도메인들 허용
    if (process.env.NODE_ENV === 'production') {
      if (origin.includes('likorea.com')) {
        return callback(null, true);
      }
    }

    // 설정된 허용 도메인 목록 확인
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('CORS에 의해 차단됨'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// 로깅 미들웨어
app.use(logger.request);

// 트래픽 로깅 미들웨어 (모든 요청에 대해 트래픽 데이터 수집)
app.use(trafficLogger);

// Rate Limiting 설정
const rateLimiters = createRateLimiters();
const { generalLimiter, adminLimiter } = rateLimiters;

// 데이터베이스 연결 및 초기화
connectDB().then(async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      // 개발 환경: DB 초기화 및 더미 데이터 생성
      const setupDevDB = require('./utils/setupDevDB');
      logger.info('개발 환경 감지 - DB 초기화 시작...');
      await setupDevDB();
      logger.info('개발 환경 DB 설정 완료');
      // 개발 환경에서도 태그 초기화 실행
      await initializeTags();
      logger.info('태그 시스템 초기화 완료 (개발 환경)');
      // 봇 시스템 초기화
      await initializeBots();
      logger.info('봇 시스템 초기화 완료 (개발 환경)');
    } else {
      // 프로덕션 환경: 태그 시스템만 초기화 (기존 데이터 유지)
      await initializeTags();
      logger.info('태그 시스템 초기화 완료 (프로덕션 환경)');
    }
  } catch (error) {
    logger.error('초기화 실패:', error);
  }
});

// Swagger UI 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// API 라우트 설정 (Rate Limiting 적용)
app.use('/api/users', generalLimiter, userRoutes);
app.use('/api/boards', generalLimiter, boardRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);  // 관리자 전용 limiter 사용
app.use('/api/tags', generalLimiter, tagRoutes);
app.use('/api/traffic', adminLimiter, trafficRoutes);  // 트래픽도 관리자 전용
app.use('/api/bots', adminLimiter, botRoutes);  // 봇 관리도 관리자 전용
app.use('/api/approval', adminLimiter, approvalRoutes);  // 승인도 관리자 전용

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

const mongoose = require('mongoose');
const logger = require('../utils/logger');

// mongoose 8 설정
mongoose.set('strictQuery', false);

// 연결 풀 최적화 설정
const connectionOptions = {
  // 연결 풀 설정
  maxPoolSize: 10, // 최대 연결 수 (기본값: 10)
  minPoolSize: 2,  // 최소 연결 수
  maxIdleTimeMS: 10000, // 유휴 연결 타임아웃 (10초)

  // 연결 타임아웃 설정
  serverSelectionTimeoutMS: 5000, // 서버 선택 타임아웃 (5초)
  socketTimeoutMS: 45000, // 소켓 타임아웃 (45초)

  // 재시도 설정
  retryWrites: true,
  retryReads: true,

  // 압축 설정 (대용량 데이터 전송 시 유용)
  compressors: ['snappy', 'zlib'],

  // Write Concern 설정 (데이터 일관성)
  w: 'majority',
  journal: true,

  // 읽기 설정 (부하 분산)
  readPreference: process.env.NODE_ENV === 'production' ? 'secondaryPreferred' : 'primary',
  readConcern: { level: 'majority' }
};

// 연결 이벤트 리스너
const setupConnectionListeners = () => {
  mongoose.connection.on('connected', () => {
    logger.info('MongoDB 연결 성공');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB 연결 에러:', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB 연결 해제됨');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB 재연결 성공');
  });

  // 프로세스 종료 시 연결 정리
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB 연결이 안전하게 종료되었습니다.');
      process.exit(0);
    } catch (err) {
      logger.error('MongoDB 연결 종료 중 오류:', err);
      process.exit(1);
    }
  });
};

// 연결 상태 모니터링
const monitorConnection = () => {
  setInterval(() => {
    const { readyState } = mongoose.connection;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

    if (readyState !== 1) { // 1 = connected
      logger.warn(`MongoDB 연결 상태: ${states[readyState]}`);
    }

    // 연결 풀 통계 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      const stats = mongoose.connection.db?.serverConfig?.connections();
      if (stats) {
        logger.debug('연결 풀 상태:', {
          available: stats.filter(c => c.isConnected()).length,
          total: stats.length
        });
      }
    }
  }, 30000); // 30초마다 체크
};

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      logger.warn('MONGO_URI가 설정되지 않았습니다. MongoDB 연결을 건너뜁니다.');
      return;
    }

    // 이벤트 리스너 설정
    setupConnectionListeners();

    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI, connectionOptions);

    // 연결 모니터링 시작
    monitorConnection();

    // 인덱스 자동 생성 설정 (프로덕션에서는 false 권장)
    mongoose.set('autoIndex', process.env.NODE_ENV !== 'production');

    logger.info('MongoDB 연결 풀 초기화 완료', {
      maxPoolSize: connectionOptions.maxPoolSize,
      minPoolSize: connectionOptions.minPoolSize,
      readPreference: connectionOptions.readPreference
    });

  } catch (error) {
    logger.error('MongoDB 연결 실패', error);

    // 프로덕션에서는 연결 실패 시 서버 종료
    if (process.env.NODE_ENV === 'production') {
      logger.error('프로덕션 환경에서 MongoDB 연결 실패. 서버를 종료합니다.');
      process.exit(1);
    } else {
      logger.warn('개발 환경: MongoDB 없이 서버를 계속 실행합니다.');
    }
  }
};

// 연결 상태 확인 헬퍼 함수
const isConnected = () => mongoose.connection.readyState === 1;

// 연결 재시도 함수
const reconnect = async () => {
  if (!isConnected()) {
    logger.info('MongoDB 재연결 시도 중...');
    await connectDB();
  }
};

module.exports = {
  connectDB,
  isConnected,
  reconnect,
  mongoose
};
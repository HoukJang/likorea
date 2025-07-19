const fs = require('fs');
const path = require('path');

// 로그 디렉토리 생성
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 로그 레벨 정의
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// 현재 로그 레벨 설정
const currentLogLevel = process.env.LOG_LEVEL || 'info';
const logLevel = LOG_LEVELS[currentLogLevel.toUpperCase()] || LOG_LEVELS.INFO;

// 로그 포맷터
const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...meta
  };
  
  return JSON.stringify(logEntry);
};

// 로그 파일에 쓰기
const writeToFile = (logEntry) => {
  const logFile = path.join(logDir, `${process.env.NODE_ENV || 'development'}.log`);
  fs.appendFileSync(logFile, logEntry + '\n');
};

// 콘솔에 출력
const writeToConsole = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const color = {
    error: '\x1b[31m', // 빨강
    warn: '\x1b[33m',  // 노랑
    info: '\x1b[36m',  // 청록
    debug: '\x1b[35m'  // 보라
  };
  
  const reset = '\x1b[0m';
  console.log(`${color[level]}${timestamp} [${level.toUpperCase()}]${reset} ${message}`);
  
  if (Object.keys(meta).length > 0) {
    console.log(`${color[level]}${JSON.stringify(meta, null, 2)}${reset}`);
  }
};

// 로거 함수들
const logger = {
  error: (message, meta = {}) => {
    if (logLevel >= LOG_LEVELS.ERROR) {
      const logEntry = formatLog('error', message, meta);
      writeToFile(logEntry);
      writeToConsole('error', message, meta);
    }
  },

  warn: (message, meta = {}) => {
    if (logLevel >= LOG_LEVELS.WARN) {
      const logEntry = formatLog('warn', message, meta);
      writeToFile(logEntry);
      writeToConsole('warn', message, meta);
    }
  },

  info: (message, meta = {}) => {
    if (logLevel >= LOG_LEVELS.INFO) {
      const logEntry = formatLog('info', message, meta);
      writeToFile(logEntry);
      writeToConsole('info', message, meta);
    }
  },

  debug: (message, meta = {}) => {
    if (logLevel >= LOG_LEVELS.DEBUG) {
      const logEntry = formatLog('debug', message, meta);
      writeToFile(logEntry);
      writeToConsole('debug', message, meta);
    }
  },

  // HTTP 요청 로깅
  request: (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };
      
      if (res.statusCode >= 400) {
        logger.error(`HTTP ${req.method} ${req.originalUrl}`, logData);
      } else {
        logger.info(`HTTP ${req.method} ${req.originalUrl}`, logData);
      }
    });
    
    next();
  }
};

module.exports = logger; 
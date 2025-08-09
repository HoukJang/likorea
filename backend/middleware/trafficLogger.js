const TrafficLog = require('../models/TrafficLog');

/**
 * 트래픽 로깅 미들웨어
 * 모든 API 요청의 상세 정보를 수집하여 데이터베이스에 저장
 */
const trafficLogger = (req, res, next) => {
  const startTime = Date.now();

  // 원본 응답 메서드들을 저장
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;

  // 응답 데이터를 캡처하기 위한 변수
  let responseData = null;
  let responseError = null;

  // 응답 메서드 오버라이드
  res.send = function (data) {
    responseData = data;
    return originalSend.call(this, data);
  };

  res.json = function (data) {
    responseData = data;
    return originalJson.call(this, data);
  };

  res.end = function (data) {
    if (data) {
      responseData = data;
    }
    return originalEnd.call(this, data);
  };

  // 응답 완료 후 로깅
  res.on('finish', () => {
    try {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // 민감한 정보 제거
      const sanitizedPath = req.path;
      const sanitizedBody = req.body ? JSON.parse(JSON.stringify(req.body)) : null;

      // 비밀번호 등 민감한 정보 제거
      if (sanitizedBody && sanitizedBody.password) {
        sanitizedBody.password = '[REDACTED]';
      }

      // 응답 데이터 크기 계산 (너무 큰 응답은 로깅하지 않음)
      const responseSize = responseData ? JSON.stringify(responseData).length : 0;
      const shouldLogResponse = responseSize < 1000; // 1KB 미만만 로깅

      // 로그 데이터 구성
      const logData = {
        method: req.method,
        path: sanitizedPath,
        statusCode: res.statusCode,
        responseTime,
        userAgent: req.get('User-Agent') || '',
        ip: req.ip || req.connection.remoteAddress || '',
        userId: req.user ? req.user._id : null,
        userAuthority: req.user ? req.user.authority : null,
        requestBody: sanitizedBody,
        responseData: shouldLogResponse ? responseData : null,
        responseSize,
        error: responseError
      };

      // 비동기로 로그 저장 (응답에 영향 주지 않음)
      TrafficLog.create(logData).catch(err => {
        console.error('트래픽 로그 저장 실패:', err.message);
      });
    } catch (error) {
      console.error('트래픽 로깅 오류:', error.message);
    }
  });

  // 에러 핸들링
  res.on('error', error => {
    responseError = error.message;
  });

  next();
};

module.exports = trafficLogger;

/**
 * API 응답 캐싱 미들웨어
 * 자주 요청되는 데이터를 메모리에 캐싱하여 성능 향상
 */

const NodeCache = require('node-cache');
const crypto = require('crypto');
const logger = require('../utils/logger');

// 캐시 인스턴스 생성
const apiCache = new NodeCache({
  stdTTL: 600, // 기본 TTL: 10분
  checkperiod: 120, // 2분마다 만료된 캐시 정리
  useClones: false, // 성능을 위해 복제 비활성화
  maxKeys: 1000, // 최대 캐시 키 수
  deleteOnExpire: true
});

// 캐시 통계
let cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0
};

// 캐시 키 생성 함수
const generateCacheKey = (req) => {
  const { method, originalUrl, query, params } = req;
  const keyData = {
    method,
    url: originalUrl,
    query: query || {},
    params: params || {},
    userId: req.user?.id || 'anonymous'
  };

  // 일관된 키 생성을 위해 정렬된 JSON 사용
  const sortedKeyData = JSON.stringify(keyData, Object.keys(keyData).sort());
  return crypto.createHash('md5').update(sortedKeyData).digest('hex');
};

// 캐시 가능한 엔드포인트 설정
const cacheableEndpoints = {
  // 게시글 목록 (TTL: 5분)
  'GET:/api/boards': { ttl: 300, varyByUser: false },

  // 개별 게시글 (TTL: 10분)
  'GET:/api/boards/:postId': { ttl: 600, varyByUser: false },

  // 태그 목록 (TTL: 1시간)
  'GET:/api/tags': { ttl: 3600, varyByUser: false },

  // 소주제 목록 (TTL: 1시간)
  'GET:/api/boards/subcategories': { ttl: 3600, varyByUser: false },

  // 사용자 목록 (TTL: 5분, 권한별 캐싱)
  'GET:/api/users': { ttl: 300, varyByUser: true },

  // 트래픽 통계 (TTL: 2분)
  'GET:/api/traffic/stats': { ttl: 120, varyByUser: false }
};

// 캐시 미들웨어
const cache = (customTTL) => {
  return (req, res, next) => {
    // POST, PUT, DELETE 등은 캐싱하지 않음
    if (req.method !== 'GET') {
      return next();
    }

    // 캐시 가능한 엔드포인트인지 확인
    const endpoint = `${req.method}:${req.route?.path || req.path}`;
    const cacheConfig = cacheableEndpoints[endpoint] || (customTTL ? { ttl: customTTL, varyByUser: false } : null);

    if (!cacheConfig) {
      return next();
    }

    // 캐시 키 생성
    const cacheKey = generateCacheKey(req);

    try {
      // 캐시 조회
      const cachedResponse = apiCache.get(cacheKey);

      if (cachedResponse) {
        cacheStats.hits++;

        // 캐시 히트 헤더 추가
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey.substring(0, 8), // 디버깅용
          'X-Cache-TTL': apiCache.getTtl(cacheKey) - Date.now()
        });

        if (process.env.NODE_ENV === 'development') {
          logger.debug(`캐시 히트: ${endpoint}`, { cacheKey: cacheKey.substring(0, 8) });
        }

        return res.json(cachedResponse);
      }

      // 캐시 미스
      cacheStats.misses++;

      // 원본 res.json 저장
      const originalJson = res.json.bind(res);

      // res.json 오버라이드하여 응답 캐싱
      res.json = (data) => {
        // 성공 응답만 캐싱 (2xx 상태 코드)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            apiCache.set(cacheKey, data, cacheConfig.ttl);
            cacheStats.sets++;

            // 캐시 설정 헤더 추가
            res.set({
              'X-Cache': 'MISS',
              'X-Cache-Key': cacheKey.substring(0, 8),
              'X-Cache-TTL': cacheConfig.ttl
            });

            if (process.env.NODE_ENV === 'development') {
              logger.debug(`캐시 저장: ${endpoint}`, {
                cacheKey: cacheKey.substring(0, 8),
                ttl: cacheConfig.ttl
              });
            }
          } catch (cacheError) {
            logger.error('캐시 저장 실패:', cacheError);
          }
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('캐시 미들웨어 오류:', error);
      next(); // 오류 발생 시 캐싱 없이 진행
    }
  };
};

// 캐시 무효화 함수
const invalidateCache = (pattern) => {
  try {
    const keys = apiCache.keys();
    let deletedCount = 0;

    keys.forEach(key => {
      if (!pattern || key.includes(pattern)) {
        apiCache.del(key);
        deletedCount++;
      }
    });

    cacheStats.deletes += deletedCount;
    logger.info(`캐시 무효화: ${deletedCount}개 항목 삭제`, { pattern });

    return deletedCount;
  } catch (error) {
    logger.error('캐시 무효화 실패:', error);
    return 0;
  }
};

// 특정 엔드포인트의 캐시 무효화
const invalidateEndpoint = (endpoint) => {
  const keys = apiCache.keys();
  let deletedCount = 0;

  keys.forEach(key => {
    const cachedData = apiCache.get(key);
    if (cachedData && cachedData._endpoint === endpoint) {
      apiCache.del(key);
      deletedCount++;
    }
  });

  return deletedCount;
};

// 캐시 통계 조회
const getCacheStats = () => {
  const keys = apiCache.keys();
  const memoryUsage = process.memoryUsage();

  return {
    ...cacheStats,
    hitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0,
    currentKeys: keys.length,
    maxKeys: 1000,
    memoryUsage: {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
    }
  };
};

// 캐시 정리 (수동)
const clearCache = () => {
  apiCache.flushAll();
  cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };
  logger.info('전체 캐시 초기화 완료');
};

// 게시글 관련 캐시 무효화 미들웨어
const invalidatePostCache = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (data) => {
    // 게시글 생성/수정/삭제 성공 시 관련 캐시 무효화
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const { method, path } = req;

      if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
        if (path.includes('/boards')) {
          // 게시글 목록 캐시 무효화
          invalidateCache('boards');
          logger.debug('게시글 캐시 무효화');
        }
      }
    }

    return originalJson(data);
  };

  next();
};

// 주기적 캐시 통계 로깅 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const stats = getCacheStats();
    if (stats.currentKeys > 0) {
      logger.debug('캐시 통계:', {
        hitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
        keys: stats.currentKeys,
        memory: stats.memoryUsage.heapUsed
      });
    }
  }, 300000); // 5분마다
}

module.exports = {
  cache,
  invalidateCache,
  invalidateEndpoint,
  getCacheStats,
  clearCache,
  invalidatePostCache
};
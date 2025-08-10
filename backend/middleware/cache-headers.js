/**
 * HTTP 캐시 헤더 최적화 미들웨어
 * 정적 자산과 API 응답에 적절한 캐시 헤더 설정
 */

const path = require('path');

// 정적 자산 캐시 설정
const setStaticCacheHeaders = (req, res, next) => {
  const ext = path.extname(req.path).toLowerCase();
  
  // 정적 자산 파일 확장자별 캐시 설정
  const cacheSettings = {
    // 장기 캐싱 (1년) - 버전이 있는 파일들
    '.js': { maxAge: 31536000, immutable: true },
    '.css': { maxAge: 31536000, immutable: true },
    '.woff': { maxAge: 31536000, immutable: true },
    '.woff2': { maxAge: 31536000, immutable: true },
    '.ttf': { maxAge: 31536000, immutable: true },
    '.eot': { maxAge: 31536000, immutable: true },
    
    // 중기 캐싱 (1개월) - 이미지 파일들
    '.png': { maxAge: 2592000, immutable: false },
    '.jpg': { maxAge: 2592000, immutable: false },
    '.jpeg': { maxAge: 2592000, immutable: false },
    '.gif': { maxAge: 2592000, immutable: false },
    '.webp': { maxAge: 2592000, immutable: false },
    '.svg': { maxAge: 2592000, immutable: false },
    '.ico': { maxAge: 2592000, immutable: false },
    
    // 단기 캐싱 (5분) - HTML 파일들
    '.html': { maxAge: 300, immutable: false },
    
    // 캐시하지 않음 - Service Worker
    'service-worker.js': { maxAge: 0, immutable: false }
  };
  
  const setting = cacheSettings[ext];
  
  if (setting) {
    const cacheControl = [
      'public',
      `max-age=${setting.maxAge}`
    ];
    
    if (setting.immutable) {
      cacheControl.push('immutable');
    } else {
      cacheControl.push('must-revalidate');
    }
    
    res.set({
      'Cache-Control': cacheControl.join(', '),
      'Vary': 'Accept-Encoding'
    });
  }
  
  next();
};

// API 응답 캐시 헤더 설정
const setApiCacheHeaders = (req, res, next) => {
  // 원래 send 메서드 저장
  const originalSend = res.send;
  
  // send 메서드 오버라이드
  res.send = function(data) {
    // GET 요청만 캐싱
    if (req.method === 'GET') {
      // 엔드포인트별 캐시 설정
      const endpoint = req.path;
      let cacheSettings = null;
      
      if (endpoint.includes('/api/tags')) {
        // 태그 목록 - 1시간 캐싱
        cacheSettings = { maxAge: 3600, private: false };
      } else if (endpoint.includes('/api/boards') && !endpoint.includes('/api/boards/')) {
        // 게시글 목록 - 5분 캐싱
        cacheSettings = { maxAge: 300, private: false };
      } else if (endpoint.match(/\/api\/boards\/\d+$/)) {
        // 개별 게시글 - 10분 캐싱
        cacheSettings = { maxAge: 600, private: false };
      } else if (endpoint.includes('/api/traffic/stats')) {
        // 트래픽 통계 - 2분 캐싱
        cacheSettings = { maxAge: 120, private: false };
      } else if (endpoint.includes('/api/users')) {
        // 사용자 목록 - 5분 캐싱 (사용자별)
        cacheSettings = { maxAge: 300, private: true };
      }
      
      if (cacheSettings) {
        const cacheControl = cacheSettings.private ? 'private' : 'public';
        res.set({
          'Cache-Control': `${cacheControl}, max-age=${cacheSettings.maxAge}, must-revalidate`,
          'Vary': 'Accept-Encoding, Authorization'
        });
      }
    } else {
      // POST, PUT, DELETE 요청은 캐시하지 않음
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
    }
    
    // 원래 send 메서드 호출
    originalSend.call(this, data);
  };
  
  next();
};

// ETag 최적화
const optimizeEtag = (req, res, next) => {
  // 정적 자산에 대해서만 ETag 활성화
  const isStaticAsset = /\.(js|css|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|ico)$/i.test(req.path);
  
  if (isStaticAsset) {
    // ETag를 weak ETag로 설정 (성능 향상)
    res.set('ETag', `W/"${Date.now()}"`);
  } else {
    // API 응답에서는 ETag 비활성화
    res.removeHeader('ETag');
  }
  
  next();
};

module.exports = {
  setStaticCacheHeaders,
  setApiCacheHeaders,
  optimizeEtag
};
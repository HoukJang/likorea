/**
 * 캐시 헤더 미들웨어
 * 정적 자산에 대한 장기 캐싱 정책 적용
 */

const cacheHeaders = (req, res, next) => {
  // 파일 확장자 기반 캐시 정책
  const path = req.path.toLowerCase();
  
  // 1년 캐시 (immutable assets with hash)
  if (path.match(/\.(js|css)$/) && path.includes('.')) {
    // Webpack에서 생성한 해시가 있는 파일들
    if (path.match(/\.[a-f0-9]{8}\./)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Expires', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString());
    } else {
      // 해시가 없는 JS/CSS는 1일 캐시
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
  
  // 폰트 파일 - 1년 캐시
  else if (path.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Expires', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString());
  }
  
  // 이미지 파일 - 30일 캐시
  else if (path.match(/\.(jpg|jpeg|png|gif|ico|svg|webp|avif)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=2592000');
    res.setHeader('Expires', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString());
  }
  
  // HTML 파일 - 캐시하지 않음
  else if (path.match(/\.(html)$/) || path === '/') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // API 응답 - 기본적으로 캐시하지 않음
  else if (path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    // 특정 API는 짧은 캐시 적용
    if (path.includes('/api/tags') || path.includes('/api/boards/list')) {
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5분
    }
  }
  
  // ETag 설정 (Express 기본 제공)
  res.setHeader('Vary', 'Accept-Encoding');
  
  next();
};

module.exports = cacheHeaders;
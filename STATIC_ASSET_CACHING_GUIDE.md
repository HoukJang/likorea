# Static Asset Caching Configuration Guide

이 문서는 정적 자산 캐싱을 설정하여 Lighthouse 성능 점수를 개선하는 방법을 설명합니다.

## 개요

정적 자산 캐싱은 이미지, CSS, JavaScript 파일 등을 브라우저에 캐시하여 재방문 시 로딩 속도를 크게 향상시킵니다.

## 구현된 최적화

### 1. 서버 측 gzip 압축 (완료)
Express 서버에 compression 미들웨어가 추가되었습니다:
- 1KB 이상의 응답 자동 압축
- 텍스트 기반 콘텐츠 (HTML, CSS, JS, JSON) 압축
- 30-70% 전송 크기 감소 효과

### 2. Nginx 정적 자산 캐싱 설정

#### 캐싱 전략
- **이미지 파일** (jpg, png, webp, svg): 1년 캐싱
- **CSS/JS 파일**: 1년 캐싱 (파일명에 해시 포함)
- **폰트 파일**: 1년 캐싱 + CORS 허용
- **HTML 파일**: 캐싱 없음 (항상 최신 버전 제공)
- **Service Worker**: 캐싱 없음
- **Manifest 파일**: 1시간 캐싱

## 프로덕션 서버 적용 방법

### 1. Nginx 설정 파일 백업
```bash
sudo cp /etc/nginx/sites-available/likorea.com /etc/nginx/sites-available/likorea.com.backup
```

### 2. 새 설정 적용
```bash
# nginx.conf.example 파일을 서버로 복사한 후
sudo cp nginx.conf.example /etc/nginx/sites-available/likorea.com

# 경로 수정 (실제 프로젝트 경로로 변경)
sudo nano /etc/nginx/sites-available/likorea.com
# root /path/to/likorea/frontend/build; 부분을 실제 경로로 수정
```

### 3. 설정 테스트 및 적용
```bash
# 설정 문법 검사
sudo nginx -t

# 문제없으면 Nginx 재시작
sudo systemctl reload nginx
```

## 캐싱 확인 방법

### 1. 브라우저 개발자 도구
1. Chrome DevTools 열기 (F12)
2. Network 탭 이동
3. 페이지 새로고침
4. Response Headers에서 확인:
   - `Cache-Control` 헤더
   - `Expires` 헤더
   - `Status: 304` (캐시된 리소스)

### 2. Lighthouse 재측정
```bash
# Chrome DevTools에서
1. Lighthouse 탭 이동
2. "Generate report" 클릭
3. "Serve static assets with an efficient cache policy" 항목 확인
```

### 3. 명령줄 확인
```bash
# 캐싱 헤더 확인
curl -I https://likorea.com/static/js/main.12345.js

# gzip 압축 확인
curl -H "Accept-Encoding: gzip" -I https://likorea.com/api/boards
```

## 예상 개선 효과

1. **초기 로딩 시간**: gzip 압축으로 30-50% 감소
2. **재방문 시 로딩**: 캐싱으로 80-90% 감소  
3. **Lighthouse 점수**: 
   - Performance: 60 → 75-85
   - "Efficient cache policy" 경고 해결
   - "Enable text compression" 경고 해결

## 주의사항

1. **캐시 무효화**: 배포 시 파일명 해시가 변경되어 자동으로 캐시 무효화됨
2. **개발 환경**: 개발 중에는 캐싱이 비활성화되어 항상 최신 파일 제공
3. **CDN 사용 시**: CloudFlare 등 CDN 사용 시 추가 캐싱 설정 필요

## 문제 해결

### 캐싱이 작동하지 않는 경우
1. Nginx 에러 로그 확인: `sudo tail -f /var/log/nginx/error.log`
2. 캐싱 헤더 확인: 브라우저 개발자 도구 Network 탭
3. Nginx 설정 재확인: `sudo nginx -t`

### 오래된 파일이 계속 제공되는 경우
1. 브라우저 캐시 강제 새로고침: Ctrl+Shift+R (Windows/Linux) 또는 Cmd+Shift+R (Mac)
2. 파일명 해시 확인: build 디렉토리의 파일명에 해시가 포함되어 있는지 확인
3. HTML 캐싱 설정 확인: HTML 파일은 캐싱되지 않아야 함

## 추가 최적화 옵션

1. **CDN 도입**: CloudFlare 등으로 전 세계 사용자에게 빠른 전송
2. **HTTP/3 활성화**: 더 빠른 프로토콜 사용
3. **Brotli 압축**: gzip보다 20-30% 더 효율적인 압축
4. **이미지 최적화 서비스**: 실시간 이미지 최적화 및 WebP 변환
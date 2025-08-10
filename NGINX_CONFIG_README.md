# Nginx 설정 가이드

## 개요
이 문서는 Long Island Korea 프로젝트의 Nginx 설정을 설명합니다.

## 파일 설명
- `nginx-likorea-simple.conf`: 프로덕션 서버용 Nginx 설정 파일

## 캐시 정책
1. **해시가 있는 JS/CSS 파일** (예: main.a3f56b89.js)
   - 캐시 기간: 1년
   - Cache-Control: public, max-age=31536000, immutable

2. **HTML 파일**
   - 캐시: 사용 안 함
   - Cache-Control: no-cache, no-store, must-revalidate

3. **폰트 파일**
   - 캐시 기간: 1년
   - CORS 허용

4. **이미지 파일**
   - 캐시 기간: 30일

5. **일반 JS/CSS 파일** (해시 없음)
   - 캐시 기간: 7일

## 배포 방법

### 자동 배포 (권장)
```bash
./deploy.sh production --update-nginx
```

### 수동 배포
1. 설정 파일을 서버에 복사
2. Nginx 설정 경로 확인 및 수정
3. 설정 테스트 후 재시작

```bash
sudo cp nginx-likorea-simple.conf /etc/nginx/sites-available/likorea
sudo nginx -t
sudo systemctl reload nginx
```

## 주의사항
- 배포 전 반드시 `root` 경로를 서버 환경에 맞게 수정하세요
- SSL 인증서 경로가 올바른지 확인하세요
- 백업을 생성한 후 적용하세요

## 캐시 확인 방법
```bash
# 해시가 있는 파일 테스트
curl -I https://likorea.com/static/js/main.[hash].js | grep Cache-Control

# HTML 파일 테스트
curl -I https://likorea.com | grep Cache-Control
```
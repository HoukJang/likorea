# 🚀 Likorea 배포 가이드

## 📋 개요
이 문서는 Likorea 웹사이트의 프로덕션 배포 과정을 설명합니다.

## 🛠️ 사전 요구사항

### 서버 환경
- Ubuntu 20.04+ 또는 CentOS 8+
- Node.js 16+
- PM2 (프로세스 관리자)
- Nginx (웹 서버)
- Certbot (SSL 인증서)

### 도메인 설정
- `likorea.com` 도메인 소유
- DNS A 레코드가 서버 IP를 가리키도록 설정

## 📦 설치 과정

### 1. 시스템 패키지 설치
```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 설치
sudo npm install -g pm2

# Nginx 설치
sudo apt install nginx -y

# Certbot 설치
sudo apt install certbot python3-certbot-nginx -y
```

### 2. 프로젝트 클론
```bash
git clone <repository-url>
cd likorea
```

### 3. 환경변수 설정

#### 백엔드 환경변수 (`backend/.env`)
```env
# 서버 설정
PORT=5001
NODE_ENV=production

# MongoDB 연결
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-here

# CORS 설정
ALLOWED_ORIGINS=https://likorea.com,http://localhost:3000

# 기타 설정
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### 프론트엔드 환경변수 (`frontend/.env`)
```env
# frontend/.env
REACT_APP_BACKEND_URL=https://likorea.com
REACT_APP_ENV=production
```

## 🚀 배포 실행

### 자동 배포 (권장)
```bash
# 프로덕션 배포
./deploy.sh production

# 개발 환경 배포
./deploy.sh development
```

### 수동 배포
```bash
# 1. 의존성 설치
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. 프론트엔드 빌드
cd frontend
npm run build
chown -R www-data:www-data build/
cd ..

# 3. 백엔드 서버 시작
cd backend
pm2 start server.js --name "likorea-backend" --env production
cd ..

# 4. Nginx 설정 확인
sudo nginx -t
sudo systemctl reload nginx

# 5. SSL 인증서 발급
sudo certbot --nginx -d likorea.com -d www.likorea.com
```

## 🔧 Nginx 설정

### 기본 설정 (`/etc/nginx/sites-available/likorea`)
```nginx
server {
    listen 80;
    server_name likorea.com www.likorea.com;
    
    # 프론트엔드 서빙
    location / {
        root /root/likorea/frontend/build;
        try_files $uri $uri/ /index.html;
        index index.html;
        
        # 캐시 설정
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API 프록시
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS 헤더 추가
        add_header Access-Control-Allow-Origin "https://likorea.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        # OPTIONS 요청 처리
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://likorea.com" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Content-Type "text/plain charset=UTF-8";
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

### Nginx 활성화
```bash
sudo ln -s /etc/nginx/sites-available/likorea /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 🔍 모니터링 및 로그

### PM2 모니터링
```bash
# 프로세스 상태 확인
pm2 list

# 실시간 모니터링
pm2 monit

# 로그 확인
pm2 logs likorea-backend

# 로그 파일 위치
# ~/.pm2/logs/likorea-backend-out.log
# ~/.pm2/logs/likorea-backend-error.log
```

### Nginx 로그
```bash
# 액세스 로그
sudo tail -f /var/log/nginx/access.log

# 에러 로그
sudo tail -f /var/log/nginx/error.log
```

## 🔧 문제 해결

### 일반적인 문제들

#### 1. CORS 에러
- 백엔드 `.env`의 `ALLOWED_ORIGINS` 확인
- Nginx CORS 헤더 설정 확인
- 프론트엔드 환경변수 확인

#### 2. 권한 에러
```bash
# 빌드 파일 권한 수정
sudo chown -R www-data:www-data /root/likorea/frontend/build/
```

#### 3. 포트 충돌
```bash
# 포트 사용 확인
sudo netstat -tlnp | grep :5001

# PM2 프로세스 재시작
pm2 restart likorea-backend
```

#### 4. SSL 인증서 문제
```bash
# 인증서 상태 확인
sudo certbot certificates

# 인증서 갱신
sudo certbot renew
```

### 디버깅 명령어
```bash
# 백엔드 API 테스트
curl -I https://likorea.com/api/tags

# CORS 테스트
curl -H "Origin: https://likorea.com" -X OPTIONS https://likorea.com/api/tags -I

# Nginx 설정 테스트
sudo nginx -t

# 서비스 상태 확인
sudo systemctl status nginx
pm2 status
```

## 📝 업데이트 과정

### 코드 업데이트
```bash
# 최신 코드 가져오기
git pull origin main

# 배포 스크립트 실행
./deploy.sh production
```

### 환경변수 업데이트
```bash
# 백엔드 환경변수 수정 후
pm2 restart likorea-backend --update-env

# 프론트엔드 환경변수 수정 후
cd frontend && npm run build && cd ..
sudo systemctl reload nginx
```

## 🔒 보안 고려사항

1. **환경변수 보안**: `.env` 파일을 Git에 커밋하지 않음
2. **SSL 인증서**: 자동 갱신 설정
3. **방화벽**: 필요한 포트만 열기
4. **정기 업데이트**: 시스템 및 패키지 정기 업데이트

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 로그 파일 확인
2. 서비스 상태 확인
3. 네트워크 연결 확인
4. DNS 설정 확인 
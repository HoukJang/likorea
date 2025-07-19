# 🚀 배포 가이드

## 📋 목차

1. [환경 요구사항](#환경-요구사항)
2. [백엔드 배포](#백엔드-배포)
3. [프론트엔드 배포](#프론트엔드-배포)
4. [데이터베이스 설정](#데이터베이스-설정)
5. [환경변수 설정](#환경변수-설정)
6. [보안 설정](#보안-설정)
7. [모니터링 및 로깅](#모니터링-및-로깅)
8. [트러블슈팅](#트러블슈팅)

---

## 🖥️ 환경 요구사항

### 최소 요구사항
- **Node.js**: 18.x 이상
- **MongoDB**: 5.0 이상
- **메모리**: 2GB 이상
- **저장공간**: 10GB 이상

### 권장사항
- **Node.js**: 20.x LTS
- **MongoDB**: 6.0 이상
- **메모리**: 4GB 이상
- **저장공간**: 20GB 이상

---

## 🔧 백엔드 배포

### 1. 서버 준비

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 설치 (프로세스 관리)
sudo npm install -g pm2

# MongoDB 설치
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

### 2. 프로젝트 배포

```bash
# 프로젝트 클론
git clone <repository-url>
cd likorea

# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
npm install --production

# 환경변수 설정
cp .env.example .env
nano .env
```

### 3. 환경변수 설정

```bash
# .env 파일 설정
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://localhost:27017/likorea_prod
JWT_SECRET=your-super-secret-jwt-key-here
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 4. PM2로 서버 실행

```bash
# PM2 설정 파일 생성
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'likorea-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# 로그 디렉토리 생성
mkdir -p logs

# 서버 시작
pm2 start ecosystem.config.js

# PM2 자동 시작 설정
pm2 startup
pm2 save
```

---

## 🎨 프론트엔드 배포

### 1. 빌드 준비

```bash
# 프론트엔드 디렉토리로 이동
cd ../frontend

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.production
nano .env.production
```

### 2. 환경변수 설정

```bash
# .env.production 파일 설정
REACT_APP_BACKEND_URL=https://api.yourdomain.com
REACT_APP_ENV=production
```

### 3. 프로덕션 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 확인
ls -la build/
```

### 4. Nginx 설정

```bash
# Nginx 설치
sudo apt install nginx

# Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/likorea
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # 프론트엔드 서빙
    location / {
        root /path/to/likorea/frontend/build;
        try_files $uri $uri/ /index.html;
        
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
    }
    
    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

```bash
# Nginx 설정 활성화
sudo ln -s /etc/nginx/sites-available/likorea /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🗄️ 데이터베이스 설정

### 1. MongoDB 설정

```bash
# MongoDB 서비스 시작
sudo systemctl start mongod
sudo systemctl enable mongod

# MongoDB 상태 확인
sudo systemctl status mongod
```

### 2. 데이터베이스 생성

```bash
# MongoDB 접속
mongosh

# 데이터베이스 생성
use likorea_prod

# 관리자 사용자 생성
db.createUser({
  user: "likorea_admin",
  pwd: "your-secure-password",
  roles: ["readWrite", "dbAdmin"]
})

# 종료
exit
```

### 3. 백업 설정

```bash
# 백업 스크립트 생성
mkdir -p /opt/backups
nano /opt/backups/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
DB_NAME="likorea_prod"

# 백업 실행
mongodump --db $DB_NAME --out $BACKUP_DIR/backup_$DATE

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "backup_*" -type d -mtime +7 -exec rm -rf {} \;
```

```bash
# 실행 권한 부여
chmod +x /opt/backups/backup.sh

# crontab에 백업 작업 추가
crontab -e
# 매일 새벽 2시에 백업 실행
0 2 * * * /opt/backups/backup.sh
```

---

## 🔐 보안 설정

### 1. 방화벽 설정

```bash
# UFW 방화벽 활성화
sudo ufw enable

# 기본 정책 설정
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH 허용
sudo ufw allow ssh

# HTTP/HTTPS 허용
sudo ufw allow 80
sudo ufw allow 443

# 방화벽 상태 확인
sudo ufw status
```

### 2. SSL 인증서 설정

```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 자동 갱신 설정
sudo crontab -e
# 매일 자정에 인증서 갱신 확인
0 0 * * * /usr/bin/certbot renew --quiet
```

### 3. 보안 강화

```bash
# fail2ban 설치 (무차별 대입 공격 방지)
sudo apt install fail2ban

# fail2ban 설정
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

---

## 📊 모니터링 및 로깅

### 1. PM2 모니터링

```bash
# PM2 모니터링 대시보드
pm2 monit

# 로그 확인
pm2 logs likorea-backend

# 상태 확인
pm2 status
```

### 2. 시스템 모니터링

```bash
# htop 설치
sudo apt install htop

# 시스템 리소스 모니터링
htop

# 디스크 사용량 확인
df -h

# 메모리 사용량 확인
free -h
```

### 3. 로그 로테이션

```bash
# logrotate 설정
sudo nano /etc/logrotate.d/likorea
```

```
/path/to/likorea/backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 likorea likorea
    postrotate
        pm2 reload likorea-backend
    endscript
}
```

---

## 🔧 트러블슈팅

### 1. 서버가 시작되지 않는 경우

```bash
# 로그 확인
pm2 logs likorea-backend

# 포트 사용 확인
sudo netstat -tlnp | grep :5001

# 프로세스 재시작
pm2 restart likorea-backend
```

### 2. 데이터베이스 연결 오류

```bash
# MongoDB 상태 확인
sudo systemctl status mongod

# MongoDB 로그 확인
sudo journalctl -u mongod

# MongoDB 재시작
sudo systemctl restart mongod
```

### 3. 메모리 부족

```bash
# 메모리 사용량 확인
free -h

# Node.js 메모리 제한 설정
pm2 restart likorea-backend --max-memory-restart 1G
```

### 4. SSL 인증서 문제

```bash
# 인증서 상태 확인
sudo certbot certificates

# 인증서 갱신
sudo certbot renew

# Nginx 설정 테스트
sudo nginx -t
```

---

## 📞 지원

### 연락처
- **이메일**: support@likorea.com
- **문서**: https://docs.likorea.com
- **GitHub**: https://github.com/likorea

### 유용한 명령어

```bash
# 서버 상태 확인
pm2 status

# 로그 실시간 확인
pm2 logs likorea-backend --lines 100

# 프로세스 재시작
pm2 restart likorea-backend

# 설정 리로드
pm2 reload likorea-backend

# 백업 실행
/opt/backups/backup.sh

# SSL 인증서 갱신
sudo certbot renew
```

---

**마지막 업데이트**: 2024년 7월 19일  
**버전**: 1.0.0 
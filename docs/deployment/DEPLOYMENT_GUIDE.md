# 🚀 Long Island Korea 배포 가이드

## 📋 목차

1. [환경 요구사항](#환경-요구사항)
2. [서버 환경 설정](#서버-환경-설정)
3. [프로젝트 배포](#프로젝트-배포)
4. [Nginx 설정](#nginx-설정)
5. [SSL 인증서 설정](#ssl-인증서-설정)
6. [환경변수 설정](#환경변수-설정)
7. [데이터베이스 설정](#데이터베이스-설정)
8. [모니터링 및 로깅](#모니터링-및-로깅)
9. [보안 설정](#보안-설정)
10. [트러블슈팅](#트러블슈팅)
11. [업데이트 과정](#업데이트-과정)

---

## 🖥️ 환경 요구사항

### 최소 요구사항
- **OS**: Ubuntu 20.04+ 또는 CentOS 8+
- **Node.js**: 18.x 이상
- **MongoDB**: 5.0 이상
- **메모리**: 2GB 이상
- **저장공간**: 10GB 이상

### 권장사항
- **OS**: Ubuntu 22.04 LTS
- **Node.js**: 20.x LTS
- **MongoDB**: 6.0 이상
- **메모리**: 4GB 이상
- **저장공간**: 20GB 이상

### 필수 소프트웨어
- PM2 (프로세스 관리자)
- Nginx (웹 서버)
- Certbot (SSL 인증서)

---

## 🛠️ 서버 환경 설정

### 1. 시스템 패키지 설치

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Node.js 20.x 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 설치
sudo npm install -g pm2

# Nginx 설치
sudo apt install nginx -y

# Certbot 설치
sudo apt install certbot python3-certbot-nginx -y

# MongoDB 설치
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# MongoDB 서비스 시작
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## 📦 프로젝트 배포

### 1. 자동 배포 (권장)

```bash
# 프로젝트 클론
git clone <repository-url>
cd likorea

# 프로덕션 배포
./deploy.sh production

# 개발 환경 배포
./deploy.sh development

# 데이터베이스 초기화와 함께 배포
./deploy.sh production --init-db

# 강제 배포 (테스트 실패 시에도 배포)
./deploy.sh production --force

# 옵션 조합 (강제 배포 + DB 초기화)
./deploy.sh production --force --init-db
```

#### 배포 옵션 설명

- `--force`: 테스트나 린트 실패 시에도 배포를 강행합니다
- `--init-db`: 데이터베이스를 초기화하고 기본 데이터를 생성합니다
  - ⚠️ **경고**: 모든 기존 데이터가 삭제됩니다!
  - 확인을 위해 "DELETE"를 입력해야 합니다

### 2. 수동 배포

#### 백엔드 배포

```bash
# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
npm install --production

# 환경변수 설정
cp .env.example .env
nano .env

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
    time: true,
    max_memory_restart: '1G'
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

#### 프론트엔드 배포

```bash
# 프론트엔드 디렉토리로 이동
cd ../frontend

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.production
nano .env.production

# 프로덕션 빌드
npm run build

# 빌드 파일 권한 설정
sudo chown -R www-data:www-data build/
```

---

## 🌐 Nginx 설정

### 1. 사이트 설정 파일 생성

```bash
sudo nano /etc/nginx/sites-available/likorea
```

### 2. Nginx 설정 내용

```nginx
server {
    listen 80;
    server_name likorea.com www.likorea.com;
    
    # 프론트엔드 서빙
    location / {
        root /path/to/likorea/frontend/build;
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

### 3. Nginx 활성화

```bash
# 설정 파일 활성화
sudo ln -s /etc/nginx/sites-available/likorea /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl reload nginx
```

---

## 🔐 SSL 인증서 설정

```bash
# SSL 인증서 발급
sudo certbot --nginx -d likorea.com -d www.likorea.com

# 자동 갱신 테스트
sudo certbot renew --dry-run

# 자동 갱신 cron 설정
sudo crontab -e
# 매일 자정에 인증서 갱신 확인
0 0 * * * /usr/bin/certbot renew --quiet
```

---

## 🔧 환경변수 설정

### 백엔드 환경변수 (`backend/.env`)

```env
# 서버 설정
PORT=5001
NODE_ENV=production

# MongoDB 연결
MONGO_URI=mongodb://localhost:27017/likorea_prod
# 또는 MongoDB Atlas 사용 시
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-here

# CORS 설정
ALLOWED_ORIGINS=https://likorea.com,https://www.likorea.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 로깅
LOG_LEVEL=info
```

### 프론트엔드 환경변수 (`frontend/.env.production`)

```env
# API 설정
REACT_APP_BACKEND_URL=https://likorea.com
REACT_APP_ENV=production

# 기타 설정
GENERATE_SOURCEMAP=false
```

---

## 🗄️ 데이터베이스 설정

### 1. MongoDB 사용자 생성

```bash
# MongoDB 접속
mongosh

# 데이터베이스 선택
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

### 2. 백업 설정

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

# 백업 결과 로깅
echo "[$DATE] Backup completed" >> $BACKUP_DIR/backup.log
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

## 📊 모니터링 및 로깅

### 1. PM2 모니터링

```bash
# 프로세스 상태 확인
pm2 list

# 실시간 모니터링
pm2 monit

# 로그 확인
pm2 logs likorea-backend

# 특정 시간 로그 확인
pm2 logs likorea-backend --lines 100

# 로그 파일 위치
# ~/.pm2/logs/likorea-backend-out.log
# ~/.pm2/logs/likorea-backend-error.log
```

### 2. Nginx 로그

```bash
# 액세스 로그
sudo tail -f /var/log/nginx/access.log

# 에러 로그
sudo tail -f /var/log/nginx/error.log
```

### 3. 로그 로테이션 설정

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

### 4. 시스템 모니터링

```bash
# htop 설치
sudo apt install htop

# 시스템 리소스 모니터링
htop

# 디스크 사용량
df -h

# 메모리 사용량
free -h

# 네트워크 상태
netstat -tlnp
```

---

## 🔒 보안 설정

### 1. 방화벽 설정

```bash
# UFW 방화벽 활성화
sudo ufw enable

# 기본 정책 설정
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 필수 포트 허용
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# MongoDB 포트는 로컬만 허용 (외부 접근 차단)
# sudo ufw deny 27017

# 방화벽 상태 확인
sudo ufw status
```

### 2. fail2ban 설정 (무차별 대입 공격 방지)

```bash
# fail2ban 설치
sudo apt install fail2ban

# 설정 파일 복사
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# 설정 편집
sudo nano /etc/fail2ban/jail.local

# SSH 보호 설정 추가
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5

# fail2ban 재시작
sudo systemctl restart fail2ban
```

### 3. 보안 강화

```bash
# 시스템 업데이트 자동화
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades

# SSH 키 기반 인증 설정
# /etc/ssh/sshd_config에서
PasswordAuthentication no
PubkeyAuthentication yes
```

---

## 🔧 트러블슈팅

### 1. 일반적인 문제들

#### CORS 에러
```bash
# 백엔드 .env의 ALLOWED_ORIGINS 확인
# Nginx CORS 헤더 설정 확인
# 프론트엔드 환경변수 확인

# CORS 테스트
curl -H "Origin: https://likorea.com" -X OPTIONS https://likorea.com/api/tags -I
```

#### 권한 에러
```bash
# 빌드 파일 권한 수정
sudo chown -R www-data:www-data /path/to/likorea/frontend/build/

# PM2 로그 디렉토리 권한
chmod -R 755 /path/to/likorea/backend/logs
```

#### 포트 충돌
```bash
# 포트 사용 확인
sudo netstat -tlnp | grep :5001

# PM2 프로세스 재시작
pm2 restart likorea-backend

# 강제 재시작
pm2 delete likorea-backend
pm2 start ecosystem.config.js
```

### 2. 데이터베이스 문제

```bash
# MongoDB 상태 확인
sudo systemctl status mongod

# MongoDB 로그 확인
sudo journalctl -u mongod

# MongoDB 재시작
sudo systemctl restart mongod

# 연결 테스트
mongosh --eval "db.adminCommand('ping')"
```

### 3. 메모리 부족

```bash
# 메모리 사용량 확인
free -h

# PM2 메모리 제한 설정
pm2 restart likorea-backend --max-memory-restart 1G

# 스왑 메모리 추가
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 4. SSL 인증서 문제

```bash
# 인증서 상태 확인
sudo certbot certificates

# 인증서 갱신
sudo certbot renew

# 강제 갱신
sudo certbot renew --force-renewal

# Nginx 설정 테스트
sudo nginx -t
```

### 5. 디버깅 명령어

```bash
# 백엔드 API 테스트
curl -I https://likorea.com/api/tags

# 프론트엔드 확인
curl -I https://likorea.com

# PM2 프로세스 정보
pm2 info likorea-backend

# 시스템 로그
sudo journalctl -xe
```

---

## 🔄 업데이트 과정

### 1. 코드 업데이트

```bash
# 최신 코드 가져오기
git pull origin main

# 자동 배포
./deploy.sh production

# 데이터베이스 초기화가 필요한 경우
./deploy.sh production --init-db
```

### 2. 환경변수 업데이트

```bash
# 백엔드 환경변수 수정 후
pm2 restart likorea-backend --update-env

# 프론트엔드 환경변수 수정 후
cd frontend && npm run build && cd ..
sudo systemctl reload nginx
```

### 3. 데이터베이스 마이그레이션

```bash
# 백업 먼저 실행
/opt/backups/backup.sh

# 마이그레이션 스크립트 실행
cd backend
node scripts/migrate.js
```

---

## 📞 지원

### 유용한 명령어 모음

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

# 시스템 상태 확인
systemctl status nginx
systemctl status mongod
pm2 status

# 전체 시스템 재시작
pm2 restart all
sudo systemctl restart nginx
sudo systemctl restart mongod

# 데이터베이스 초기화 (주의!)
./deploy.sh production --init-db
./deploy.sh development --init-db
```

### 문제 발생 시 체크리스트

1. ✅ 로그 파일 확인 (PM2, Nginx, MongoDB)
2. ✅ 서비스 상태 확인
3. ✅ 네트워크 연결 확인
4. ✅ DNS 설정 확인
5. ✅ 방화벽 규칙 확인
6. ✅ 디스크 공간 확인
7. ✅ 메모리 사용량 확인
8. ✅ SSL 인증서 유효성 확인

---

**마지막 업데이트**: 2025년 7월
**버전**: 1.1.0
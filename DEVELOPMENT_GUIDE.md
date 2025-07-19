# 🚀 개발 및 배포 가이드

## 📋 목차
1. [로컬 개발 환경 설정](#로컬-개발-환경-설정)
2. [개발 워크플로우](#개발-워크플로우)
3. [배포 준비](#배포-준비)
4. [배포 옵션](#배포-옵션)
5. [모니터링 및 유지보수](#모니터링-및-유지보수)

---

## 🏠 로컬 개발 환경 설정

### 1. 필수 소프트웨어 설치
```bash
# Node.js (v16 이상)
node --version

# MongoDB (로컬 또는 Atlas)
mongod --version

# Git
git --version
```

### 2. 프로젝트 클론 및 의존성 설치
```bash
# 프로젝트 클론
git clone <repository-url>
cd likorea

# 백엔드 의존성 설치
cd backend
npm install

# 프론트엔드 의존성 설치
cd ../frontend
npm install
```

### 3. 환경변수 설정
```bash
# 백엔드 환경변수 설정
cd backend
cp env.example .env
# .env 파일을 편집하여 실제 값으로 설정

# 프론트엔드 환경변수 설정
cd ../frontend
cp env.example .env
# .env 파일을 편집하여 실제 값으로 설정
```

### 4. 데이터베이스 설정
```bash
# MongoDB 로컬 실행
mongod

# 또는 MongoDB Atlas 사용 시
# Atlas 클러스터 URL을 .env 파일의 MONGO_URI에 설정
```

### 5. 개발 서버 실행
```bash
# 터미널 1: 백엔드 서버
cd backend
npm run dev

# 터미널 2: 프론트엔드 서버
cd frontend
npm start
```

---

## 🔄 개발 워크플로우

### 1. 기능 개발 프로세스
```bash
# 1. 새 브랜치 생성
git checkout -b feature/new-feature

# 2. 개발 작업
# - 백엔드 API 개발
# - 프론트엔드 컴포넌트 개발
# - 테스트 작성

# 3. 커밋
git add .
git commit -m "feat: 새로운 기능 추가"

# 4. 푸시
git push origin feature/new-feature

# 5. Pull Request 생성
# GitHub/GitLab에서 PR 생성
```

### 2. 코드 품질 관리
```bash
# 백엔드 테스트
cd backend
npm test

# 프론트엔드 테스트
cd frontend
npm test

# 린팅 (설정 후)
npm run lint
```

### 3. 환경별 설정
- **Development**: 로컬 개발 환경
- **Staging**: 배포 전 테스트 환경
- **Production**: 실제 서비스 환경

---

## 🚀 배포 준비

### 1. 프로덕션 환경변수 설정
```bash
# 백엔드 .env.production
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/likorea
JWT_SECRET=your_secure_jwt_secret
PORT=5001
ALLOWED_ORIGINS=https://likorea.com,https://www.likorea.com

# 프론트엔드 .env.production
REACT_APP_BACKEND_URL=https://api.likorea.com
REACT_APP_ENV=production
```

### 2. 빌드 최적화
```bash
# 백엔드 빌드 (필요시)
cd backend
npm run build

# 프론트엔드 빌드
cd frontend
npm run build
```

### 3. 보안 체크리스트
- [ ] 환경변수에 민감한 정보 포함 여부 확인
- [ ] CORS 설정 검토
- [ ] JWT 시크릿 키 보안 확인
- [ ] 데이터베이스 접근 권한 확인
- [ ] SSL/TLS 인증서 설정

---

## 🌐 배포 옵션

### 옵션 1: VPS (Virtual Private Server)
```bash
# 서버 설정
sudo apt update
sudo apt install nodejs npm nginx mongodb

# 애플리케이션 배포
git clone <repository>
cd likorea
npm install
npm run build

# PM2로 프로세스 관리
npm install -g pm2
pm2 start backend/server.js --name "likorea-backend"
pm2 start frontend/build --name "likorea-frontend"
```

### 옵션 2: 클라우드 플랫폼

#### Heroku
```bash
# Heroku CLI 설치
npm install -g heroku

# 배포
heroku create likorea-app
git push heroku main

# 환경변수 설정
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI=your_mongodb_uri
```

#### Vercel (프론트엔드)
```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
cd frontend
vercel --prod
```

#### Railway
```bash
# Railway CLI 설치
npm install -g @railway/cli

# 배포
railway login
railway init
railway up
```

### 옵션 3: Docker 컨테이너
```dockerfile
# Dockerfile.backend
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

```dockerfile
# Dockerfile.frontend
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
```

---

## 📊 모니터링 및 유지보수

### 1. 로깅 설정
```javascript
// backend/config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### 2. 헬스 체크 엔드포인트
```javascript
// backend/routes/healthRoutes.js
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### 3. 성능 모니터링
- **백엔드**: New Relic, DataDog, 또는 PM2 모니터링
- **프론트엔드**: Google Analytics, Sentry
- **데이터베이스**: MongoDB Atlas 모니터링

### 4. 백업 전략
```bash
# 데이터베이스 백업
mongodump --uri="mongodb://localhost:27017/likorea" --out=./backup

# 파일 백업
tar -czf backup-$(date +%Y%m%d).tar.gz ./uploads
```

---

## 🔧 트러블슈팅

### 일반적인 문제들

#### 1. 포트 충돌
```bash
# 포트 사용 확인
lsof -i :5001
lsof -i :3000

# 프로세스 종료
kill -9 <PID>
```

#### 2. 환경변수 문제
```bash
# 환경변수 확인
echo $NODE_ENV
node -e "console.log(process.env.MONGO_URI)"
```

#### 3. CORS 에러
```bash
# 브라우저 개발자 도구에서 확인
# 서버 로그에서 CORS 에러 확인
```

#### 4. 데이터베이스 연결 문제
```bash
# MongoDB 연결 테스트
mongo "mongodb://localhost:27017/likorea"
```

---

## 📝 체크리스트

### 배포 전 체크리스트
- [ ] 모든 테스트 통과
- [ ] 환경변수 설정 완료
- [ ] 데이터베이스 마이그레이션 완료
- [ ] SSL 인증서 설정
- [ ] 도메인 DNS 설정
- [ ] 백업 시스템 구축
- [ ] 모니터링 시스템 설정

### 배포 후 체크리스트
- [ ] 애플리케이션 정상 동작 확인
- [ ] API 엔드포인트 테스트
- [ ] 데이터베이스 연결 확인
- [ ] 로그 모니터링
- [ ] 성능 메트릭 확인

---

**문서 버전**: 1.0  
**최종 업데이트**: 2024년 12월  
**작성자**: 개발팀 
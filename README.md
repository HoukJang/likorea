# 🏝️ Long Island Korea 커뮤니티 사이트

뉴욕 롱아일랜드 지역의 한국인 커뮤니티를 위한 완전한 웹 플랫폼입니다.

## ✨ 주요 기능

### 👥 사용자 관리
- **회원가입/로그인**: JWT 토큰 기반 인증
- **권한 시스템**: 5단계 권한 레벨 (일반 사용자 ~ 관리자)
- **프로필 관리**: 사용자 정보 수정 및 관리

### 📝 게시판 시스템
- **게시글 CRUD**: 작성, 조회, 수정, 삭제
- **게시판 분류**: 일반, 공지사항 등 카테고리별 분류
- **페이지네이션**: 효율적인 게시글 목록 관리
- **조회수 카운팅**: 게시글 조회 통계

### 💬 댓글 시스템
- **댓글 CRUD**: 게시글별 댓글 관리
- **권한 관리**: 댓글 작성/수정/삭제 권한
- **실시간 업데이트**: 댓글 수 자동 카운팅

### 🔧 관리자 기능
- **사용자 관리**: 사용자 목록, 권한 변경, 삭제
- **게시글 관리**: 게시글 모니터링 및 관리
- **댓글 관리**: 댓글 모니터링 및 관리

### 🤖 봇 시스템
- **맛집봇**: AI 기반 레스토랑 분석 및 추천
- **Google Places API 통합**: 실시간 레스토랑 정보
- **이미지 스크래핑**: 메뉴 및 음식 사진 수집

### 🔒 보안 기능
- **Rate Limiting**: 무차별 대입 공격 방지
- **Input Validation**: 입력 데이터 검증
- **XSS/CSRF 방지**: 보안 헤더 설정
- **JWT 인증**: 안전한 토큰 기반 인증

## 🏗️ 기술 스택

### 백엔드
- **Node.js** 20.x - 서버 런타임
- **Express.js** - 웹 프레임워크
- **MongoDB** 6.0 - 데이터베이스
- **Mongoose** - ODM (Object Document Mapper)
- **JWT** - 인증 토큰
- **bcrypt** - 비밀번호 해싱
- **Helmet** - 보안 미들웨어
- **Jest** - 테스트 프레임워크

### 프론트엔드
- **React** 18 - UI 라이브러리
- **React Router** v6 - 클라이언트 라우팅
- **Custom Hooks** - 상태 관리
- **CSS3** - 스타일링

### 인프라
- **PM2** - 프로세스 관리
- **Nginx** - 웹 서버
- **Let's Encrypt** - SSL 인증서
- **MongoDB Atlas** - 클라우드 데이터베이스

## 🚀 빠른 시작

### 필수 요구사항
- Node.js 18.x 이상
- MongoDB 5.0 이상
- npm 또는 yarn

### 설치 및 실행

1. **저장소 클론**
```bash
git clone https://github.com/likorea/likorea.git
cd likorea
```

2. **백엔드 설정**
```bash
cd backend
npm install
cp .env.example .env
# .env 파일 편집하여 환경변수 설정
# 필수 환경변수:
# - MONGO_URI: MongoDB 연결 문자열
# - JWT_SECRET: JWT 토큰 시크릿 키
# - ALLOWED_ORIGINS: CORS 허용 도메인
npm start
```

3. **프론트엔드 설정**
```bash
cd ../frontend
npm install
cp .env.example .env
# .env 파일 편집하여 백엔드 URL 설정
# 필수 환경변수:
# - REACT_APP_BACKEND_URL: 백엔드 API URL
npm start
```

4. **브라우저에서 확인**
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:5001
- API 문서: http://localhost:5001/api-docs

## 📁 프로젝트 구조

```
likorea/
├── backend/                 # 백엔드 서버
│   ├── config/             # 설정 파일
│   ├── controllers/        # 컨트롤러
│   ├── middleware/         # 미들웨어
│   ├── models/            # 데이터베이스 모델
│   ├── routes/            # API 라우트
│   ├── services/          # 비즈니스 로직 서비스
│   ├── scripts/           # 유틸리티 스크립트
│   ├── tests/             # 테스트 파일
│   ├── utils/             # 유틸리티
│   └── server.js          # 서버 진입점
├── frontend/              # 프론트엔드
│   ├── public/           # 정적 파일
│   ├── src/              # 소스 코드
│   │   ├── api/          # API 클라이언트
│   │   ├── components/   # React 컴포넌트
│   │   ├── hooks/        # 커스텀 훅
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── styles/       # CSS 파일
│   │   └── utils/        # 유틸리티
│   └── package.json
├── docs/                  # 프로젝트 문서
│   ├── API_DOCUMENTATION.md
│   ├── GOOGLE_PLACES_API.md
│   └── ...
├── DEPLOYMENT_GUIDE.md   # 배포 가이드
├── PROJECT_PLAN.md       # 프로젝트 플랜
└── README.md             # 프로젝트 설명
```

## 🔧 개발 환경

### 환경변수 설정

**백엔드 (.env)**
```env
# 서버 설정
NODE_ENV=development
PORT=5001

# MongoDB 연결 정보 (MongoDB Atlas 또는 로컬 MongoDB)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# JWT 시크릿 키 (보안을 위해 강력한 랜덤 문자열 사용)
JWT_SECRET=your-super-secret-jwt-key-here

# CORS 허용 도메인
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Google Places API (선택사항)
GOOGLE_PLACES_API_KEY=your-google-places-api-key
ENABLE_GOOGLE_PLACES=false

# Claude AI API (봇 시스템용)
ANTHROPIC_API_KEY=your-anthropic-api-key

# 이미지 스크래핑 설정
ENABLE_IMAGE_SCRAPING=true
```

**프론트엔드 (.env)**
```env
# 백엔드 API URL
REACT_APP_BACKEND_URL=http://localhost:5001

# 환경 설정
REACT_APP_ENV=development
```

**⚠️ 보안 주의사항**
- `.env` 파일은 절대 Git에 커밋하지 마세요
- 프로덕션 환경에서는 강력한 JWT_SECRET을 사용하세요
- MongoDB 연결 문자열에 민감한 정보가 포함되어 있습니다

### 테스트 실행

```bash
# 백엔드 테스트
cd backend
npm test

# 특정 테스트 실행
npm test -- tests/api/basic.test.js

# 커버리지 확인
npm run test:coverage
```

## 📚 API 문서

Swagger UI를 통해 API 문서를 확인할 수 있습니다:
- **개발 환경**: http://localhost:5001/api-docs
- **프로덕션**: https://api.likorea.com/api-docs

### 주요 API 엔드포인트

#### 사용자 관리
- `POST /api/users` - 회원가입
- `POST /api/users/login` - 로그인
- `POST /api/users/logout` - 로그아웃
- `GET /api/users/:id` - 사용자 정보 조회

#### 게시판
- `GET /api/boards/:boardType` - 게시글 목록
- `POST /api/boards/:boardType` - 게시글 작성
- `GET /api/boards/:boardType/:postId` - 게시글 조회
- `PUT /api/boards/:boardType/:postId` - 게시글 수정
- `DELETE /api/boards/:boardType/:postId` - 게시글 삭제

#### 댓글
- `GET /api/boards/:boardType/:postId/comments` - 댓글 목록
- `POST /api/boards/:boardType/:postId/comments` - 댓글 작성
- `PUT /api/boards/:boardType/:postId/comments/:commentId` - 댓글 수정
- `DELETE /api/boards/:boardType/:postId/comments/:commentId` - 댓글 삭제

## 🚀 배포

상세한 배포 가이드는 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)를 참조하세요.

### 주요 배포 단계

1. **서버 준비**
   - Node.js 20.x 설치
   - MongoDB 6.0 설치
   - PM2 설치

2. **프로젝트 배포**
   - 코드 클론
   - 의존성 설치
   - 환경변수 설정

3. **웹 서버 설정**
   - Nginx 설치 및 설정
   - SSL 인증서 설정
   - 프록시 설정

4. **모니터링 설정**
   - PM2 모니터링
   - 로그 로테이션
   - 백업 스크립트

## 🔒 보안

### 구현된 보안 기능
- **Rate Limiting**: API 요청 제한
- **Input Validation**: 입력 데이터 검증
- **XSS 방지**: 보안 헤더 설정
- **CSRF 방지**: 토큰 기반 인증
- **SQL Injection 방지**: Mongoose ODM 사용
- **비밀번호 해싱**: bcrypt 사용

### 보안 모범 사례
- 환경변수를 통한 민감 정보 관리
- JWT 토큰 만료 시간 설정
- HTTPS 강제 적용
- 보안 헤더 설정

## 📊 성능 최적화

### 백엔드 최적화
- 데이터베이스 인덱싱
- 쿼리 최적화
- 캐싱 전략 (NodeCache 활용)
- 로드 밸런싱
- API 응답 캐싱 (Google Places API 결과)

### 프론트엔드 최적화
- 코드 스플리팅
- 이미지 최적화
- 정적 파일 캐싱
- 반응형 디자인

## 📖 추가 문서

프로젝트의 상세 문서는 `/docs` 디렉토리에서 확인할 수 있습니다:

- **[API 문서](./docs/API_DOCUMENTATION.md)** - 전체 API 엔드포인트 참조
- **[Google Places API 가이드](./docs/GOOGLE_PLACES_API.md)** - Google Places API 통합 가이드
- **[프로젝트 구조](./docs/PROJECT_STRUCTURE.md)** - 상세 프로젝트 아키텍처
- **[데이터베이스 스키마](./docs/DATABASE_SCHEMA.md)** - MongoDB 스키마 정의

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 연락처

- **프로젝트 관리자**: 개발팀
- **기술 지원**: support@likorea.com
- **문서**: https://docs.likorea.com
- **GitHub**: https://github.com/likorea

## 🙏 감사의 말

이 프로젝트는 롱아일랜드 한국인 커뮤니티의 요구사항을 바탕으로 개발되었습니다. 모든 기여자들과 커뮤니티 멤버들에게 감사드립니다.

---

**마지막 업데이트**: 2024년 7월 19일  
**버전**: 1.0.0  
**상태**: ✅ 완료 
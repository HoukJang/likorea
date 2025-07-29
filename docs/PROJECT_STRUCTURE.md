# Likorea 프로젝트 구조 문서

## 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [아키텍처 개요](#아키텍처-개요)
3. [디렉토리 구조](#디렉토리-구조)
4. [백엔드 아키텍처](#백엔드-아키텍처)
5. [프론트엔드 아키텍처](#프론트엔드-아키텍처)
6. [데이터베이스 스키마](#데이터베이스-스키마)
7. [주요 기능](#주요-기능)
8. [보안 및 인증](#보안-및-인증)

## 프로젝트 개요

Long Island Korea (likorea)는 롱아일랜드 지역 한인 커뮤니티를 위한 웹 애플리케이션입니다.

### 기술 스택
- **Frontend**: React 18, React Router v6, CSS Modules
- **Backend**: Node.js, Express.js, MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest, React Testing Library

### 주요 특징
- 지역 기반 태그 시스템 (495번 고속도로 Exit 번호 기반)
- 5단계 권한 시스템
- 실시간 게시판 및 댓글 시스템
- 반응형 디자인

## 아키텍처 개요

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│   React SPA     │────▶│  Express API     │────▶│   MongoDB       │
│   (Frontend)    │ HTTP│   (Backend)      │     │   (Database)    │
│                 │◀────│                  │◀────│                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
   ┌──────────┐            ┌──────────┐
   │  Nginx   │            │   PM2    │
   │ (Proxy)  │            │ (Process │
   └──────────┘            │ Manager) │
                           └──────────┘
```

## 디렉토리 구조

```
likorea/
├── backend/                # 백엔드 서버
│   ├── config/            # 설정 파일
│   ├── controllers/       # 컨트롤러 (비즈니스 로직)
│   ├── middleware/        # Express 미들웨어
│   ├── models/           # Mongoose 모델
│   ├── routes/           # API 라우트 정의
│   ├── tests/            # 백엔드 테스트
│   ├── utils/            # 유틸리티 함수
│   └── server.js         # 서버 진입점
│
├── frontend/              # 프론트엔드 애플리케이션
│   ├── public/           # 정적 파일
│   ├── src/
│   │   ├── api/          # API 클라이언트
│   │   ├── components/   # React 컴포넌트
│   │   ├── hooks/        # Custom React Hooks
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── utils/        # 유틸리티 함수
│   │   └── App.jsx       # 메인 애플리케이션
│   └── package.json
│
├── docs/                  # 프로젝트 문서
│   ├── API_DOCUMENTATION.md
│   └── PROJECT_STRUCTURE.md
│
├── deploy.sh             # 배포 스크립트
├── CLAUDE.md            # Claude AI 가이드
└── README.md            # 프로젝트 README
```

## 백엔드 아키텍처

### 계층 구조

#### 1. Routes Layer (`/routes`)
API 엔드포인트를 정의하고 요청을 적절한 컨트롤러로 라우팅합니다.

- `userRoutes.js`: 사용자 관련 라우트
- `boardRoutes.js`: 게시판 관련 라우트
- `adminRoutes.js`: 관리자 전용 라우트
- `tagRoutes.js`: 태그 시스템 라우트

#### 2. Middleware Layer (`/middleware`)
요청 처리 파이프라인에서 공통 기능을 제공합니다.

- `auth.js`: JWT 인증 및 권한 확인
- `validation.js`: 입력 데이터 검증
- `security.js`: 보안 헤더 및 Rate Limiting
- `errorHandler.js`: 중앙화된 에러 처리
- `trafficLogger.js`: 트래픽 로깅

#### 3. Controllers Layer (`/controllers`)
비즈니스 로직을 처리하고 데이터베이스와 상호작용합니다.

- `userController.js`: 사용자 CRUD 및 인증
- `boardController.js`: 게시글 CRUD
- `commentController.js`: 댓글 관리
- `adminController.js`: 관리자 기능
- `tagController.js`: 태그 관리

#### 4. Models Layer (`/models`)
MongoDB 스키마 정의 및 데이터 모델링.

- `User.js`: 사용자 모델
- `BoardPost.js`: 게시글 모델
- `Comment.js`: 댓글 모델
- `Tag.js`: 태그 모델
- `Counter.js`: 시퀀스 카운터

### 주요 설정 파일

#### `/config/db.js`
MongoDB 연결 설정 및 초기화.

#### `/config/swagger.js`
API 문서화를 위한 Swagger 설정.

### 유틸리티 (`/utils`)

- `initDB.js`: 데이터베이스 초기화
- `initTags.js`: 태그 시스템 초기화
- `logger.js`: 로깅 유틸리티
- `setupDevDB.js`: 개발 환경 DB 설정

## 프론트엔드 아키텍처

### 컴포넌트 구조

#### 1. API Layer (`/api`)
백엔드와의 통신을 담당하는 API 클라이언트.

- `client.js`: 공통 API 클라이언트
- `auth.js`: 인증 관련 API
- `boards.js`: 게시판 API
- `admin.js`: 관리자 API
- `tags.js`: 태그 API

#### 2. Components (`/components`)
재사용 가능한 React 컴포넌트.

##### Common Components (`/components/common`)
- `Button.jsx`: 공통 버튼 컴포넌트
- `Input.jsx`: 공통 입력 컴포넌트
- `Loading.jsx`: 로딩 표시 컴포넌트

##### Feature Components
- `BoardList.jsx`: 게시글 목록
- `BoardPostForm.jsx`: 게시글 작성/수정 폼
- `BoardPostView.jsx`: 게시글 상세 보기
- `CommentForm.jsx`: 댓글 작성 폼
- `Login.jsx`: 로그인 폼
- `Signup.jsx`: 회원가입 폼
- `Admin.jsx`: 관리자 대시보드
- `TagFilter.jsx`: 태그 필터링
- `TagSelector.jsx`: 태그 선택기

#### 3. Hooks (`/hooks`)
커스텀 React Hooks.

- `useAuth.js`: 인증 상태 관리
- `useApi.js`: API 호출 상태 관리
- `useLoading.js`: 로딩 상태 관리
- `usePermission.js`: 권한 확인

#### 4. Utils (`/utils`)
유틸리티 함수.

- `tagUtils.js`: 태그 관련 유틸리티
- `errorHandler.js`: 에러 처리
- `logger.js`: 프론트엔드 로깅
- `dataUtils.js`: 데이터 변환 유틸리티

### 상태 관리
- Local State: React useState/useReducer
- Global Auth State: Context API + Custom Hooks
- API State: Custom useApi Hook

## 데이터베이스 스키마

### User Schema
```javascript
{
  id: String (unique),
  email: String (unique),
  password: String (hashed),
  authority: Number (1-5),
  createdAt: Date,
  lastLogin: Date
}
```

### BoardPost Schema
```javascript
{
  number: Number (sequential),
  title: String,
  content: String (HTML),
  author: ObjectId (User),
  tags: {
    type: String,    // 카테고리
    region: String   // 지역 (Exit 번호)
  },
  views: Number,
  likes: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Comment Schema
```javascript
{
  content: String,
  author: ObjectId (User),
  post: ObjectId (BoardPost),
  parentComment: ObjectId (Comment),
  likes: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Tag Schema
```javascript
{
  name: String,
  category: String (region/type),
  displayName: String,
  isActive: Boolean,
  order: Number
}
```

## 주요 기능

### 1. 인증 시스템
- JWT 기반 인증
- 5단계 권한 시스템
- 토큰 자동 갱신
- 세션 관리

### 2. 게시판 시스템
- CRUD 기능
- 페이지네이션
- 검색 및 필터링
- 조회수 추적
- HTML 에디터 지원

### 3. 태그 시스템
- 지역 태그: 495번 고속도로 Exit 기반 (0-73)
- 카테고리 태그: 사고팔고, 부동산, 모임, 문의, 잡담, 기타
- 동적 필터링

### 4. 댓글 시스템
- 중첩 댓글 (대댓글)
- 실시간 업데이트
- 좋아요 기능

### 5. 관리자 기능
- 사용자 관리
- 통계 대시보드
- 권한 관리
- 컨텐츠 모더레이션

## 보안 및 인증

### 보안 미들웨어
- Helmet.js: 보안 헤더 설정
- Rate Limiting: API 호출 제한
- CORS: Cross-Origin 요청 제어
- Input Validation: 입력 데이터 검증
- XSS Protection: HTML 삭제/이스케이프

### 인증 플로우
1. 사용자 로그인 → JWT 토큰 발급
2. 클라이언트: localStorage에 토큰 저장
3. API 요청 시 Authorization 헤더에 토큰 포함
4. 서버: 토큰 검증 및 사용자 인증
5. 토큰 만료 시 자동 로그아웃

### Rate Limiting
- 일반 API: 15분당 100회
- 로그인: 15분당 5회
- 회원가입: 1시간당 3회
- 게시글 작성: 10분당 10회

## 배포 및 환경 설정

### 환경 변수
#### Backend
- `MONGO_URI`: MongoDB 연결 문자열
- `JWT_SECRET`: JWT 서명 키
- `NODE_ENV`: 실행 환경
- `ALLOWED_ORIGINS`: CORS 허용 도메인

#### Frontend
- `REACT_APP_BACKEND_URL`: 백엔드 API URL
- `REACT_APP_ENV`: 실행 환경

### 배포 프로세스
1. `deploy.sh` 스크립트 실행
2. 의존성 설치 및 빌드
3. 환경 변수 검증
4. 테스트 실행
5. PM2로 백엔드 서버 시작
6. Nginx 설정 및 재시작

### 개발 환경 설정
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm start
```

## 테스트

### Backend Testing
- Unit Tests: Controllers, Middleware
- Integration Tests: API Endpoints
- Test Coverage: >80% 목표

### Frontend Testing
- Component Tests: React Testing Library
- Hook Tests: Custom Hooks
- API Client Tests: Mock 서버 사용

## 성능 최적화

### Backend
- MongoDB 인덱싱
- Query 최적화
- 캐싱 전략
- Connection Pooling

### Frontend
- Code Splitting
- Lazy Loading
- 이미지 최적화
- Bundle Size 최적화

## 모니터링 및 로깅

### Logging
- Winston Logger 사용
- 로그 레벨: error, warn, info, debug
- 파일 및 콘솔 출력

### Error Tracking
- 중앙화된 에러 핸들링
- 사용자 친화적 에러 메시지
- 디버깅을 위한 상세 로그

## 향후 개선 사항

1. **기능 개선**
   - 실시간 알림 시스템
   - 파일 업로드 기능
   - 소셜 로그인

2. **기술적 개선**
   - Redis 캐싱 도입
   - WebSocket 통신
   - 마이크로서비스 아키텍처

3. **사용자 경험**
   - PWA 지원
   - 다국어 지원
   - 다크 모드
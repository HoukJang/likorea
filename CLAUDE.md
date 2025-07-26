# Long Island Korea 프로젝트 컨텍스트

이 문서는 Claude가 프로젝트 작업 시 참조하는 핵심 정보를 담고 있습니다.

## 프로젝트 개요

Long Island Korea는 뉴욕 롱아일랜드 지역의 한국인 커뮤니티를 위한 웹 플랫폼입니다.

### 핵심 기능
- 사용자 인증 시스템 (JWT 기반)
- 게시판 시스템 (CRUD, 페이지네이션)
- 댓글 시스템
- 태그/카테고리 시스템
- 관리자 기능

### 기술 스택
- **Frontend**: React 18, React Router v6
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **인증**: JWT
- **스타일링**: CSS

## 중요 문서 링크

### 📚 개요
- [README.md](./README.md) - 프로젝트 전체 소개
- [프로젝트 계획](./docs/overview/PROJECT_PLAN.md) - 단계별 개발 계획

### 💻 개발
- [개발 가이드](./docs/development/DEVELOPMENT_GUIDE.md) - 로컬 개발 환경 설정
- [API 문서](./docs/development/API.md) - Backend API 명세
- [코딩 스타일 가이드](./docs/development/CODING_STYLE_GUIDE.md) - 코드 작성 규칙

### 🚀 배포
- [배포 가이드](./docs/deployment/DEPLOYMENT_GUIDE.md) - 프로덕션 배포 방법

### 🔧 기술
- [메인테넌스 계획](./docs/technical/MAINTENANCE_PLAN.md) - 개선 사항 및 유지보수

### 📝 로그
- [개발 로그](./docs/logs/DEVLOG_2025-07-26.md) - 개발 진행 상황

## 프로젝트 구조

```
likorea/
├── backend/
│   ├── config/         # 설정 파일
│   ├── controllers/    # API 컨트롤러
│   ├── middleware/     # Express 미들웨어
│   ├── models/        # MongoDB 모델
│   ├── routes/        # API 라우트
│   ├── utils/         # 유틸리티 함수
│   └── server.js      # 서버 진입점
├── frontend/
│   ├── public/        # 정적 파일
│   ├── src/
│   │   ├── api/       # API 클라이언트
│   │   ├── components/# React 컴포넌트
│   │   ├── hooks/     # Custom Hooks
│   │   ├── pages/     # 페이지 컴포넌트
│   │   ├── styles/    # CSS 파일
│   │   └── utils/     # 유틸리티 함수
│   └── build/         # 빌드 결과물
├── docs/              # 문서
└── deploy.sh          # 배포 스크립트
```

## 개발 정책

### 코드 스타일
- **ESLint**: Warning 모드로 설정 (점진적 적용)
- **Prettier**: 제거됨 (코딩 스타일 가이드 수동 준수)
- **원칙**: SOLID 원칙 준수
- **적용**: 새로 작성하거나 수정하는 코드에만 스타일 가이드 적용

### 커밋 메시지 형식
```
<타입>: <제목>

<본문>
```

타입:
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드, 패키지 관련

### 브랜치 전략
- `main`: 프로덕션 브랜치
- `development`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치
- `fix/*`: 버그 수정 브랜치

## 환경 설정

### 백엔드 환경변수
```env
PORT=5001
NODE_ENV=development|production
MONGO_URI=mongodb://...
JWT_SECRET=...
ALLOWED_ORIGINS=...
```

### 프론트엔드 환경변수
```env
REACT_APP_BACKEND_URL=http://localhost:5001
REACT_APP_ENV=development|production
```

## 주요 명령어

### 개발
```bash
# 백엔드 개발 서버
cd backend && npm run dev

# 프론트엔드 개발 서버
cd frontend && npm start
```

### 테스트
```bash
# 백엔드 테스트
cd backend && npm test

# 프론트엔드 테스트
cd frontend && npm test
```

### 린트
```bash
# ESLint 실행
npm run lint

# ESLint 자동 수정
npm run lint:fix
```

### 배포
```bash
# 프로덕션 배포
./deploy.sh production

# 개발 환경 배포
./deploy.sh development
```

## 주의사항

1. **환경변수**: `.env` 파일은 절대 커밋하지 않음
2. **보안**: JWT_SECRET, API 키 등 민감한 정보 노출 금지
3. **CORS**: 프로덕션에서는 허용된 도메인만 접근 가능
4. **로그**: 프로덕션에서 console.log 사용 금지
5. **에러 처리**: 모든 API 엔드포인트에 에러 처리 필수

## 현재 진행 상황

- ✅ Phase 1: 프로젝트 설정 및 기본 구조 완료
- ✅ Phase 2: 핵심 기능 구현 완료
- ✅ Phase 3: 고급 기능 및 최적화 완료
- 🔄 Phase 4: 배포 및 유지보수 진행 중

## 개선 필요 사항

1. 환경 설정 관리 개선
2. 에러 처리 및 로깅 시스템 강화
3. 테스트 커버리지 향상
4. 성능 최적화
5. 보안 강화
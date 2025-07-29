# Backend Architecture Documentation

## 목차
1. [개요](#개요)
2. [서버 구성](#서버-구성)
3. [컨트롤러 상세](#컨트롤러-상세)
4. [미들웨어 상세](#미들웨어-상세)
5. [모델 상세](#모델-상세)
6. [유틸리티 함수](#유틸리티-함수)
7. [에러 처리](#에러-처리)
8. [테스트 전략](#테스트-전략)

## 개요

백엔드는 Express.js 기반의 RESTful API 서버로, MongoDB를 데이터베이스로 사용합니다.

### 주요 특징
- MVC 패턴 구현
- JWT 기반 인증
- 계층화된 미들웨어 아키텍처
- 포괄적인 에러 처리
- 입력 검증 및 삭제

## 서버 구성

### server.js
메인 서버 파일로 다음 기능을 담당합니다:

```javascript
// 주요 구성 요소
- Express 앱 초기화
- 미들웨어 설정
- 라우트 등록
- MongoDB 연결
- 에러 핸들링
- 서버 시작
```

### 환경 설정
- 개발: `.env`
- 프로덕션: `.env.production`
- 테스트: 메모리 내 설정

## 컨트롤러 상세

### userController.js
사용자 관련 비즈니스 로직을 처리합니다.

#### 주요 함수:
- `signup`: 회원가입 처리
  - 입력: `{ id, email, password }`
  - 출력: `{ user, token }`
  - 검증: 이메일/ID 중복, 비밀번호 강도

- `login`: 로그인 처리
  - 입력: `{ id, password }`
  - 출력: `{ user, token }`
  - 보안: bcrypt 해시 비교, JWT 생성

- `getUsers`: 사용자 목록 조회
  - 페이지네이션 지원
  - 검색 기능
  - 권한별 필터링

- `updateUser`: 사용자 정보 수정
  - 권한 검증
  - 부분 업데이트 지원

### boardController.js
게시판 관련 기능을 담당합니다.

#### 주요 함수:
- `createPost`: 게시글 생성
  - 자동 번호 할당 (Counter 사용)
  - HTML 콘텐츠 삭제
  - 태그 검증

- `getPosts`: 게시글 목록 조회
  - 복잡한 필터링 (태그, 검색어)
  - 정렬 옵션
  - 작성자 정보 포함 (populate)

- `getPost`: 단일 게시글 조회
  - 조회수 증가
  - 중복 조회 방지 (IP 기반)

- `updatePost`: 게시글 수정
  - 작성자/관리자 권한 확인
  - 수정 이력 추적

- `deletePost`: 게시글 삭제
  - 소프트 삭제 옵션
  - 연관 댓글 처리

### commentController.js
댓글 시스템을 관리합니다.

#### 주요 함수:
- `createComment`: 댓글 작성
  - 중첩 댓글 지원
  - 게시글 존재 확인

- `getComments`: 댓글 목록 조회
  - 계층 구조 반환
  - 작성자 정보 포함

- `updateComment`: 댓글 수정
  - 수정 시간 기록

- `deleteComment`: 댓글 삭제
  - 대댓글 처리 로직

### adminController.js
관리자 전용 기능을 제공합니다.

#### 주요 함수:
- `getStats`: 통계 정보 제공
  - 실시간 집계
  - 기간별 통계

- `updateUserAuthority`: 권한 관리
  - 권한 레벨 변경
  - 활동 로그 기록

- `getAllBoards`: 게시판 메타 정보
  - Counter 컬렉션 활용

### tagController.js
태그 시스템을 관리합니다.

#### 주요 함수:
- `getAllTags`: 전체 태그 조회
  - 카테고리별 그룹화
  - 활성/비활성 필터

- `addTag`: 새 태그 추가
  - 중복 검사
  - 자동 정렬

- `updateTag`: 태그 수정
  - 표시명 변경
  - 순서 조정

## 미들웨어 상세

### auth.js
인증 및 권한 관리를 담당합니다.

```javascript
// authenticateToken
- JWT 토큰 검증
- 토큰 만료 확인
- 사용자 정보 추출

// requireAuthority(level)
- 권한 레벨 확인
- 접근 제어

// requireAdmin
- 관리자 전용 접근
```

### validation.js
입력 데이터 검증을 수행합니다.

```javascript
// validateUserInput
- 이메일 형식 검증
- 비밀번호 강도 확인
- ID 형식 검사

// validatePostInput
- 제목/내용 길이 확인
- 태그 유효성 검증
- XSS 방지
```

### security.js
보안 관련 미들웨어를 제공합니다.

```javascript
// Rate Limiting
- IP별 요청 제한
- 엔드포인트별 설정

// Security Headers
- Helmet.js 설정
- CORS 정책
- CSP 헤더
```

### errorHandler.js
중앙화된 에러 처리를 담당합니다.

```javascript
// 에러 분류
- ValidationError: 400
- AuthenticationError: 401
- AuthorizationError: 403
- NotFoundError: 404
- ConflictError: 409
- ServerError: 500

// 에러 응답 형식
{
  success: false,
  error: "에러 메시지",
  statusCode: 400,
  details: {} // 개발 환경에서만
}
```

## 모델 상세

### User Model
```javascript
{
  id: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  authority: { type: Number, default: 1, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  isActive: { type: Boolean, default: true }
}

// 메서드
- comparePassword(): 비밀번호 비교
- generateToken(): JWT 생성
- toJSON(): 비밀번호 제외 반환
```

### BoardPost Model
```javascript
{
  number: { type: Number, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: ObjectId, ref: 'User' },
  tags: {
    type: { type: String, required: true },
    region: { type: String, required: true }
  },
  views: { type: Number, default: 0 },
  viewedIPs: [String],
  likes: { type: Number, default: 0 },
  likedUsers: [ObjectId],
  status: { type: String, enum: ['active', 'deleted'] },
  createdAt: Date,
  updatedAt: Date
}

// 인덱스
- number: 1 (unique)
- author: 1
- 'tags.type': 1, 'tags.region': 1
- createdAt: -1
```

### Comment Model
```javascript
{
  content: { type: String, required: true },
  author: { type: ObjectId, ref: 'User' },
  post: { type: ObjectId, ref: 'BoardPost' },
  parentComment: { type: ObjectId, ref: 'Comment' },
  depth: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  createdAt: Date,
  updatedAt: Date
}

// 가상 필드
- replies: 대댓글 목록
```

### Tag Model
```javascript
{
  name: { type: String, unique: true },
  category: { type: String, enum: ['region', 'type'] },
  displayName: String,
  order: Number,
  isActive: { type: Boolean, default: true },
  parentCategory: String, // 소주제용
  metadata: {
    exitNumber: Number,
    location: String
  }
}
```

## 유틸리티 함수

### initDB.js
데이터베이스 초기화 스크립트

```javascript
// 기능
- 기존 데이터 정리
- 관리자 계정 생성
- 초기 태그 설정
- 샘플 데이터 생성 (옵션)
```

### initTags.js
태그 시스템 초기화

```javascript
// 495 Exit 태그 생성
- Exit 0-73 자동 생성
- 지역명 매핑
- 순서 설정

// 카테고리 태그
- 사고팔고, 부동산, 모임, 문의, 잡담, 기타
```

### logger.js
로깅 시스템

```javascript
// Winston 설정
- 로그 레벨: error, warn, info, debug
- 파일 로테이션
- 콘솔 출력 (개발 환경)
- 타임스탬프 포함
```

## 에러 처리

### 에러 클래스 계층
```javascript
AppError (베이스 클래스)
├── ValidationError (400)
├── AuthenticationError (401)
├── AuthorizationError (403)
├── NotFoundError (404)
├── ConflictError (409)
└── ServerError (500)
```

### 에러 처리 플로우
1. 컨트롤러에서 에러 발생
2. asyncHandler가 에러 캐치
3. 에러 미들웨어로 전달
4. 에러 타입별 처리
5. 클라이언트에 응답

## 테스트 전략

### 단위 테스트
- 각 컨트롤러 함수
- 미들웨어 로직
- 모델 메서드

### 통합 테스트
- API 엔드포인트
- 인증 플로우
- 데이터베이스 작업

### 테스트 도구
- Jest: 테스트 프레임워크
- Supertest: HTTP 테스트
- MongoDB Memory Server: DB 테스트

### 테스트 구조
```
tests/
├── unit/
│   ├── controllers/
│   ├── middleware/
│   └── models/
├── integration/
│   ├── auth.test.js
│   ├── board.test.js
│   └── admin.test.js
└── helpers/
    └── testHelpers.js
```

## 성능 최적화

### 데이터베이스 최적화
- 적절한 인덱싱
- 쿼리 최적화
- Population 제한
- Lean 쿼리 사용

### 캐싱 전략
- 태그 데이터 캐싱
- 자주 조회되는 게시글
- 사용자 세션 정보

### API 응답 최적화
- 필드 선택 (select)
- 페이지네이션
- 압축 (gzip)

## 보안 고려사항

### 입력 검증
- 모든 사용자 입력 검증
- SQL Injection 방지
- NoSQL Injection 방지

### 인증/인가
- JWT 토큰 보안
- 권한 기반 접근 제어
- 세션 관리

### 데이터 보호
- 비밀번호 해싱 (bcrypt)
- 민감 정보 암호화
- HTTPS 강제

### 로깅 및 모니터링
- 보안 이벤트 로깅
- 비정상 활동 감지
- 에러 추적
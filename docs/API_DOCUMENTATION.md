# Likorea API Documentation

## 목차
1. [개요](#개요)
2. [인증](#인증)
3. [공통 응답 형식](#공통-응답-형식)
4. [API 엔드포인트](#api-엔드포인트)
   - [인증 API](#인증-api)
   - [사용자 관리 API](#사용자-관리-api)
   - [게시판 API](#게시판-api)
   - [댓글 API](#댓글-api)
   - [태그 API](#태그-api)
   - [관리자 API](#관리자-api)
   - [트래픽 API](#트래픽-api)
   - [봇 API](#봇-api)
5. [에러 코드](#에러-코드)
6. [보안 기능](#보안-기능)
7. [Rate Limiting](#rate-limiting)
8. [캐싱](#캐싱)

## 개요

- **Base URL**: 
  - Development: `http://localhost:5001`
  - Production: `https://likorea.com`
- **API Prefix**: `/api`
- **인증 방식**: httpOnly Cookie (authToken)
- **Content-Type**: `application/json`
- **CORS**: 
  - Development: 모든 localhost 허용
  - Production: `https://likorea.com`, `https://www.likorea.com`

## 인증

이 시스템은 보안을 위해 httpOnly 쿠키를 사용한 인증을 구현합니다.

### 인증 방식
- 로그인 시 서버가 `authToken` 쿠키를 설정합니다
- 모든 인증이 필요한 요청에는 쿠키가 자동으로 포함됩니다
- Frontend에서는 `credentials: 'include'` 옵션을 사용해야 합니다

### 쿠키 설정
```javascript
// 로그인 성공 시 서버가 설정
httpOnly: true
secure: true (production only)
sameSite: 'lax'
maxAge: 24시간
```

### 권한 레벨
- Level 1-2: 기본 사용자
- Level 3: 일반 사용자 (기본값)
- Level 4: 모더레이터
- Level 5: 관리자

### 비밀번호 정책
- 최소 8자 이상
- 대문자, 소문자, 숫자, 특수문자 각 1개 이상 포함
- 최근 5개 비밀번호 재사용 불가
- 90일마다 변경 권장

### 계정 보안
- 로그인 5회 실패 시 30분간 계정 잠금
- 비밀번호 변경 시 이전 5개 재사용 불가

## 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "message": "성공 메시지"
}
```

### 에러 응답
```json
{
  "success": false,
  "error": "에러 메시지",
  "statusCode": 400
}
```

### 페이지네이션 응답
```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

## API 엔드포인트

### 인증 API

#### 회원가입
- **POST** `/api/users`
- **인증**: 불필요
- **요청 본문**:
```json
{
  "id": "사용자ID",
  "email": "user@example.com",
  "password": "비밀번호",
  "authority": 3  // 선택사항, 기본값 3
}
```
- **응답**:
```json
{
  "success": true,
  "message": "회원가입 성공",
  "user": {
    "id": "사용자ID",
    "email": "user@example.com",
    "authority": 3,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```
- **에러 응답**:
  - 400: 비밀번호 정책 위반
  - 409: 이미 존재하는 아이디/이메일

#### 로그인
- **POST** `/api/users/login`
- **인증**: 불필요
- **요청 본문**:
```json
{
  "id": "사용자ID",
  "password": "비밀번호"
}
```
- **응답**:
```json
{
  "success": true,
  "message": "로그인 성공",
  "user": {
    "id": "사용자ID",
    "email": "user@example.com",
    "authority": 3,
    "_id": "MongoDB ObjectId"
  }
}
```
- **부가 동작**: authToken 쿠키 설정 (24시간)
- **에러 응답**:
  - 401: 잘못된 아이디/비밀번호
  - 401: 계정이 잠겼습니다. N분 후에 다시 시도해주세요.

#### 로그아웃
- **POST** `/api/users/logout`
- **인증**: 불필요
- **응답**:
```json
{
  "message": "로그아웃 성공"
}
```
- **부가 동작**: authToken 쿠키 제거

#### 토큰 검증
- **GET** `/api/users/verify`
- **인증**: 필수 (쿠키)
- **응답**:
```json
{
  "valid": true,
  "user": {
    "id": "사용자ID",
    "email": "user@example.com",
    "authority": 3
  }
}
```

### 사용자 관리 API

#### 사용자 목록 조회
- **GET** `/api/users`
- **인증**: 필수
- **쿼리 파라미터**:
  - `page`: 페이지 번호 (기본값: 1)
  - `limit`: 페이지당 항목 수 (기본값: 10, 최대: 100)
- **응답**:
```json
{
  "total": 100,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "id": "사용자ID",
      "email": "user@example.com",
      "authority": 3,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 사용자 정보 조회
- **GET** `/api/users/:id`
- **인증**: 필수
- **응답**:
```json
{
  "id": "사용자ID",
  "email": "user@example.com",
  "authority": 3,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### 아이디 중복 확인
- **GET** `/api/users/check-id`
- **인증**: 불필요
- **쿼리 파라미터**: `id`
- **응답**:
```json
{
  "exists": false
}
```

#### 이메일 중복 확인
- **GET** `/api/users/check-email`
- **인증**: 불필요
- **쿼리 파라미터**: `email`
- **응답**:
```json
{
  "exists": false
}
```

### 게시판 API

#### 게시글 목록 조회
- **GET** `/api/boards`
- **인증**: 불필요
- **쿼리 파라미터**:
  - `page`: 페이지 번호 (기본값: 1)
  - `limit`: 페이지당 항목 수 (기본값: 10, 최대: 100)
  - `type`: 글종류 필터
  - `region`: 지역 필터 (예: "24", "24-60", ">73", "24,25,26")
  - `subcategory`: 소주제 필터
  - `search`: 검색어 (제목, 내용)
- **응답**:
```json
{
  "success": true,
  "posts": [
    {
      "_id": "게시글ID",
      "postNumber": 1,
      "title": "제목",
      "content": "내용",
      "tags": {
        "type": "사고팔고",
        "region": "24",
        "subcategory": "생활용품"
      },
      "author": {
        "id": "작성자ID",
        "email": "author@example.com",
        "authority": 3
      },
      "viewCount": 10,
      "commentCount": 5,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "modifiedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "totalPosts": 100,
  "totalPages": 10,
  "currentPage": 1,
  "filters": {
    "type": "사고팔고",
    "region": "24",
    "subcategory": null,
    "search": null
  }
}
```
- **캐싱**: 5분

#### 게시글 상세 조회
- **GET** `/api/boards/:postId`
- **인증**: 불필요
- **응답**:
```json
{
  "success": true,
  "post": {
    "_id": "게시글ID",
    "postNumber": 1,
    "title": "제목",
    "content": "내용",
    "tags": {
      "type": "사고팔고",
      "region": "24",
      "subcategory": "생활용품"
    },
    "author": {
      "id": "작성자ID",
      "email": "author@example.com",
      "authority": 3
    },
    "viewCount": 11,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "modifiedAt": "2024-01-01T00:00:00.000Z"
  }
}
```
- **부가 동작**: 조회수 +1 증가
- **캐싱**: 10분

#### 게시글 작성
- **POST** `/api/boards`
- **인증**: 필수 (Level 1 이상)
- **요청 본문**:
```json
{
  "title": "제목",
  "content": "내용",
  "tags": {
    "type": "사고팔고",
    "region": "24",
    "subcategory": "생활용품"  // 선택사항
  }
}
```
- **응답**:
```json
{
  "success": true,
  "message": "게시글 생성 성공",
  "post": {
    "_id": "게시글ID",
    "title": "제목",
    "content": "내용",
    "tags": { ... },
    "author": "작성자ObjectId",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```
- **부가 동작**: 게시글 목록 캐시 무효화

#### 게시글 수정
- **PUT** `/api/boards/:postId`
- **인증**: 필수 (작성자 또는 관리자)
- **요청 본문**:
```json
{
  "title": "수정된 제목",
  "content": "수정된 내용",
  "tags": {
    "type": "부동산",
    "region": "30",
    "subcategory": ""
  }
}
```
- **응답**:
```json
{
  "success": true,
  "message": "게시글 수정 성공",
  "post": {
    "_id": "게시글ID",
    "title": "수정된 제목",
    "content": "수정된 내용",
    "tags": { ... },
    "modifiedAt": "2024-01-01T00:00:00.000Z"
  }
}
```
- **부가 동작**: 게시글 캐시 무효화

#### 게시글 삭제
- **DELETE** `/api/boards/:postId`
- **인증**: 필수 (작성자 또는 관리자)
- **응답**:
```json
{
  "success": true,
  "message": "게시글 삭제 성공"
}
```
- **부가 동작**: 게시글 캐시 무효화

#### 소주제 목록 조회
- **GET** `/api/boards/subcategories`
- **인증**: 불필요
- **쿼리 파라미터**:
  - `type`: 글종류 (선택사항)
- **응답**:
```json
{
  "success": true,
  "subCategories": {
    "사고팔고": ["자동차", "가전제품", "가구", "생활용품", "의류/잡화", "기타"],
    "부동산": ["집 구하기", "렌트", "룸메이트", "상가/사무실"],
    "모임": ["동호회", "스터디", "친목", "행사/이벤트"],
    "문의": ["비자/이민", "법률/세무", "의료/보험", "교육", "생활정보"],
    "잡담": [],
    "기타": []
  }
}
```
- **캐싱**: 1시간

### 댓글 API

#### 댓글 목록 조회
- **GET** `/api/boards/:postId/comments`
- **인증**: 불필요
- **응답**:
```json
{
  "success": true,
  "comments": [
    {
      "_id": "댓글ID",
      "content": "댓글 내용",
      "author": {
        "id": "작성자ID",
        "email": "author@example.com"
      },
      "post": "게시글ID",
      "parentComment": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 댓글 작성
- **POST** `/api/boards/:postId/comments`
- **인증**: 필수
- **요청 본문**:
```json
{
  "content": "댓글 내용",
  "parentComment": "부모댓글ID"  // 대댓글인 경우
}
```
- **응답**:
```json
{
  "success": true,
  "message": "댓글이 작성되었습니다.",
  "comment": {
    "_id": "댓글ID",
    "content": "댓글 내용",
    "author": "작성자ID",
    "post": "게시글ID",
    "parentComment": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 댓글 수정
- **PUT** `/api/boards/:postId/comments/:commentId`
- **인증**: 필수 (작성자 또는 관리자)
- **요청 본문**:
```json
{
  "content": "수정된 댓글 내용"
}
```
- **응답**:
```json
{
  "success": true,
  "message": "댓글이 수정되었습니다.",
  "comment": {
    "_id": "댓글ID",
    "content": "수정된 댓글 내용",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 댓글 삭제
- **DELETE** `/api/boards/:postId/comments/:commentId`
- **인증**: 필수 (작성자 또는 관리자)
- **응답**:
```json
{
  "success": true,
  "message": "댓글이 삭제되었습니다."
}
```

### 태그 API

#### 태그 목록 조회
- **GET** `/api/tags`
- **인증**: 불필요
- **응답**:
```json
{
  "success": true,
  "tags": {
    "type": [
      { "_id": "...", "value": "사고팔고", "label": "사고팔고", "isActive": true },
      { "_id": "...", "value": "부동산", "label": "부동산", "isActive": true }
    ],
    "region": [
      { "_id": "...", "value": "0", "label": "지역 선택 안함", "isActive": true },
      { "_id": "...", "value": "1", "label": "Exit 1 - Glen Cove Rd", "isActive": true }
    ]
  }
}
```
- **캐싱**: 1시간

#### 카테고리별 태그 조회
- **GET** `/api/tags/category/:category`
- **인증**: 불필요
- **파라미터**: `category` (type, region)
- **응답**: 해당 카테고리의 태그 배열
- **캐싱**: 1시간

### 관리자 API

#### 사용자 권한 수정
- **PUT** `/api/admin/users/:userId/authority`
- **인증**: 필수 (관리자)
- **요청 본문**:
```json
{
  "authority": 4
}
```
- **응답**:
```json
{
  "success": true,
  "message": "사용자 권한이 수정되었습니다.",
  "user": { ... }
}
```

#### 통계 조회
- **GET** `/api/admin/stats`
- **인증**: 필수 (관리자)
- **응답**:
```json
{
  "totalUsers": 100,
  "totalPosts": 500,
  "totalComments": 1000,
  "usersByAuthority": {
    "1": 20,
    "2": 10,
    "3": 65,
    "4": 4,
    "5": 1
  }
}
```

#### 캐시 통계 조회
- **GET** `/api/admin/cache/stats`
- **인증**: 필수 (관리자)
- **응답**:
```json
{
  "success": true,
  "stats": {
    "hits": 1000,
    "misses": 200,
    "sets": 150,
    "deletes": 50,
    "hitRate": 0.833,
    "currentKeys": 45,
    "maxKeys": 1000,
    "memoryUsage": {
      "heapUsed": "125MB",
      "heapTotal": "200MB"
    }
  }
}
```

#### 캐시 초기화
- **DELETE** `/api/admin/cache`
- **인증**: 필수 (관리자)
- **응답**:
```json
{
  "success": true,
  "message": "전체 캐시가 초기화되었습니다."
}
```

#### 특정 캐시 무효화
- **DELETE** `/api/admin/cache/:pattern`
- **인증**: 필수 (관리자)
- **파라미터**: `pattern` (캐시 키 패턴)
- **응답**:
```json
{
  "success": true,
  "message": "N개의 캐시 항목이 삭제되었습니다.",
  "pattern": "boards"
}
```

### 트래픽 API

#### 대시보드 통계
- **GET** `/api/traffic/dashboard`
- **인증**: 필수 (관리자)
- **응답**:
```json
{
  "success": true,
  "stats": {
    "today": { "requests": 1000, "unique": 200 },
    "yesterday": { "requests": 950, "unique": 180 },
    "week": { "requests": 6500, "unique": 800 },
    "month": { "requests": 25000, "unique": 2000 }
  }
}
```

#### 실시간 트래픽
- **GET** `/api/traffic/realtime`
- **인증**: 필수 (관리자)
- **응답**:
```json
{
  "success": true,
  "realtime": [
    {
      "timestamp": "2024-01-01T00:00:00.000Z",
      "ip": "192.168.1.1",
      "path": "/api/boards",
      "method": "GET",
      "statusCode": 200,
      "responseTime": 45
    }
  ]
}
```

#### 경로별 분석
- **GET** `/api/traffic/analysis/:path`
- **인증**: 필수 (관리자)
- **파라미터**: `path` (분석할 경로)
- **응답**:
```json
{
  "success": true,
  "analysis": {
    "totalRequests": 500,
    "uniqueVisitors": 100,
    "avgResponseTime": 120,
    "statusCodeDistribution": {
      "200": 450,
      "404": 30,
      "500": 20
    }
  }
}
```

### 봇 API

#### 봇 목록 조회
- **GET** `/api/bots`
- **인증**: 불필요
- **응답**:
```json
{
  "success": true,
  "bots": [
    {
      "_id": "봇ID",
      "name": "공지사항 봇",
      "type": "notice",
      "isActive": true,
      "description": "시스템 공지사항을 작성합니다",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 봇 생성
- **POST** `/api/bots`
- **인증**: 필수 (관리자)
- **요청 본문**:
```json
{
  "name": "새로운 봇",
  "type": "custom",
  "description": "봇 설명"
}
```
- **응답**:
```json
{
  "success": true,
  "message": "봇이 생성되었습니다.",
  "bot": { ... }
}
```

#### 봇으로 게시글 작성
- **POST** `/api/bots/post`
- **인증**: 필수 (관리자)
- **요청 본문**:
```json
{
  "botId": "봇ID",
  "title": "제목",
  "content": "내용",
  "tags": {
    "type": "공지",
    "region": "0"
  }
}
```
- **응답**:
```json
{
  "success": true,
  "message": "봇 게시글이 작성되었습니다.",
  "post": { ... }
}
```

#### 봇 상태 조회
- **GET** `/api/bots/:botId/status`
- **인증**: 필수 (관리자)
- **응답**:
```json
{
  "success": true,
  "status": {
    "isActive": true,
    "lastPost": "2024-01-01T00:00:00.000Z",
    "totalPosts": 10
  }
}
```

#### 봇 상태 변경
- **PATCH** `/api/bots/:botId/status`
- **인증**: 필수 (관리자)
- **요청 본문**:
```json
{
  "isActive": false
}
```
- **응답**:
```json
{
  "success": true,
  "message": "봇 상태가 변경되었습니다.",
  "bot": { ... }
}
```

## 에러 코드

### HTTP 상태 코드
- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청 (유효성 검증 실패)
- `401`: 인증 필요 또는 인증 실패
- `403`: 권한 부족
- `404`: 리소스를 찾을 수 없음
- `409`: 충돌 (중복된 리소스)
- `429`: 요청 제한 초과
- `500`: 서버 내부 오류

### 에러 응답 형식
```json
{
  "success": false,
  "error": "구체적인 에러 메시지",
  "statusCode": 400,
  "details": {
    "field": "password",
    "reason": "비밀번호는 최소 8자 이상이어야 합니다."
  }
}
```

## 보안 기능

### Rate Limiting
- 일반 API: 100 requests/15분 per IP
- 로그인 API: 5 requests/15분 per IP
- 게시글 작성: 10 posts/시간 per 사용자

### 보안 헤더
서버는 다음 보안 헤더를 자동으로 설정합니다:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### CORS (Cross-Origin Resource Sharing)
- Development: 모든 localhost 오리진 허용
- Production: 설정된 도메인만 허용
- Credentials: 쿠키 전송을 위해 `true`로 설정

## 캐싱

### 캐시 적용 엔드포인트
다음 GET 엔드포인트들은 자동으로 캐싱됩니다:

| 엔드포인트 | TTL | 설명 |
|-----------|-----|------|
| GET /api/boards | 5분 | 게시글 목록 |
| GET /api/boards/:id | 10분 | 게시글 상세 |
| GET /api/tags | 1시간 | 태그 목록 |
| GET /api/boards/subcategories | 1시간 | 소주제 목록 |
| GET /api/traffic/stats | 2분 | 트래픽 통계 |

### 캐시 무효화
- POST, PUT, DELETE 요청 시 관련 캐시 자동 무효화
- 관리자는 수동으로 캐시 초기화 가능

### 캐시 헤더
캐시된 응답에는 다음 헤더가 포함됩니다:
- `X-Cache: HIT/MISS` - 캐시 히트 여부
- `X-Cache-Key: xxxx` - 캐시 키 (디버깅용, 처음 8자만)
- `X-Cache-TTL: 300000` - 남은 캐시 시간 (밀리초)

## 개발자 가이드

### Frontend 통합
```javascript
// API 클라이언트 설정 예시
const apiClient = {
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001',
  credentials: 'include', // 쿠키 포함 필수
  headers: {
    'Content-Type': 'application/json'
  }
};

// 로그인 예시
const login = async (id, password) => {
  const response = await fetch(`${apiClient.baseURL}/api/users/login`, {
    method: 'POST',
    credentials: 'include',
    headers: apiClient.headers,
    body: JSON.stringify({ id, password })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '로그인 실패');
  }
  
  return response.json();
};
```

### 에러 처리
```javascript
try {
  const data = await apiCall();
} catch (error) {
  if (error.status === 401) {
    // 인증 만료 - 로그인 페이지로 이동
  } else if (error.status === 429) {
    // Rate limit 초과 - 잠시 후 재시도 안내
  } else {
    // 일반 에러 처리
  }
}
```

### 페이지네이션 처리
```javascript
const fetchPosts = async (page = 1, limit = 10) => {
  const params = new URLSearchParams({
    page,
    limit,
    // 추가 필터
    type: '사고팔고',
    region: '24'
  });
  
  const response = await fetch(`/api/boards?${params}`, {
    credentials: 'include'
  });
  
  const data = await response.json();
  // data.posts - 게시글 배열
  // data.totalPages - 전체 페이지 수
  // data.currentPage - 현재 페이지
};
```

## 변경 로그

### v1.6.1 (2024-01-28)
- 인증 방식 문서화 업데이트 (Bearer Token → httpOnly Cookie)
- 트래픽 API, 봇 API 문서화 추가
- 비밀번호 정책 및 계정 보안 기능 문서화
- Rate Limiting, 캐싱, 보안 헤더 문서화
- 에러 응답 형식 표준화
# Backend API 문서

## 사용자 관련 API
- **GET** `/api/users` : 일반 사용자 목록 조회  
  - Variables: 없음  
  - Response:  
    ```json
    [
      { "id": "userID1", "email": "user1@example.com", "authority": 3, "createdAt": "2023-10-01T12:00:00Z", "updatedAt": "2023-10-01T12:00:00Z" },
      { "id": "userID2", "email": "user2@example.com", "authority": 3, "createdAt": "2023-10-02T10:00:00Z", "updatedAt": "2023-10-02T10:00:00Z" }
    ]
    ```
- **POST** `/api/users` : 신규 사용자 등록  
  - Variables:
    - id: string, 필수 - 사용자 고유 식별자
    - email: string, 필수 - 이메일 주소
    - password: string, 필수 - 비밀번호
    - authority: number, 선택 - 사용자 권한 (1~5, 미제공시 기본 3)  
  - Response:
    ```json
    {
      "message": "회원가입 성공",
      "user": { "id": "userID", "email": "user@example.com", "authority": 3, "createdAt": "...", "updatedAt": "..." }
    }
    ```
- **GET** `/api/users/{id}` : 사용자 상세 정보 조회  
  - Variables:
    - id: string, 필수 - 사용자 ID  
  - Response:
    ```json
    { "id": "userID", "email": "user@example.com", "authority": 3, "createdAt": "...", "updatedAt": "..." }
    ```
- **GET** `/api/users/exists?email={email}` : 이메일 중복 여부 확인  
  - Variables:
    - email: string, 필수 - 확인할 이메일 주소  
  - Response:
    ```json
    { "exists": true }
    ```
- **GET** `/api/users/exists-id?id={id}` : 아이디 중복 여부 확인  
  - Variables:
    - id: string, 필수 - 확인할 사용자 ID  
  - Response:
    ```json
    { "exists": true }
    ```
- **PUT** `/api/users/{id}` : 사용자 정보 수정  
  - Variables:
    - id: string, 필수 - 수정할 사용자 ID
    - email: string, 선택 - 변경할 이메일 주소
    - authority: number, 선택 - 변경할 사용자 권한 (1~5)
    - password: string, 선택 - 변경할 비밀번호  
  - Response:
    ```json
    {
      "message": "사용자 정보 수정 성공",
      "user": {
        "id": "userID",
        "email": "updated@example.com",
        "authority": 4,
        "createdAt": "2023-10-01T12:00:00Z",
        "updatedAt": "2023-10-05T15:00:00Z"
      }
    }
    ```

- **DELETE** `/api/users/{id}` : 사용자 삭제  
  - Variables:
    - id: string, 필수 - 삭제할 사용자 ID  
  - Response:
    ```json
    { "message": "사용자 삭제 성공" }
    ```

## 인증 관련 API
- **POST** `/api/users/login` : 사용자 로그인  
  - Variables:
    - id: string, 필수 - 사용자 고유 식별자
    - password: string, 필수 - 비밀번호  
  - Response:
    ```json
    {
      "message": "로그인 성공",
      "token": "jwt.token.here",
      "user": {
        "id": "userID",
        "email": "user@example.com",
        "authority": 3,
        "createdAt": "2023-10-01T12:00:00Z",
        "updatedAt": "2023-10-01T12:00:00Z"
      }
    }
    ```
- **POST** `/api/users/logout` : 사용자 로그아웃  
  - Variables: 없음  
  - Response:
    ```json
    { "message": "로그아웃 성공" }
    ```
- **GET** `/api/users/verify` : 토큰 유효성 검증  
  - Variables: 없음 (헤더에 Authorization: Bearer {token} 형식으로 전달)
  - Response:
    ```json
    { 
      "valid": true,
      "user": {
        "id": "userID",
        "email": "user@example.com",
        "authority": 3
      }
    }
    ```

## 게시글 관련 API
- **GET** `/api/boards/{boardType}` : 게시글 목록 조회  
  - Variables:
    - boardType: string, 필수 - 게시판 타입 (예: general, notice 등)  
    - page: number, 선택 - 페이지 번호 (기본값: 1)
    - limit: number, 선택 - 페이지 당 게시글 수 (기본값: 10)
  - Response:
    ```json
    {
      "posts": [
        {
          "id": "boardpostID1",
          "postNumber": 1,
          "boardType": "general",
          "title": "제목",
          "content": "내용",
          "author": { "id": "userID" },
          "viewCount": 10,
          "comments": [],
          "createdAt": "...",
          "updatedAt": "..."
        }
      ],
      "totalPosts": 45,
      "totalPages": 5,
      "currentPage": 1
    }
    ```
- **POST** `/api/boards/{boardType}` : 게시글 생성  
  - Variables:
    - boardType: string, 필수 - 게시판 타입
    - title: string, 필수 - 게시글 제목
    - content: string, 필수 - 게시글 내용
    - id: string, 필수 - 사용자 ID
  - Response:
    ```json
    {
      "message": "게시글 생성 성공",
      "post": {
        "id": "boardpostID",
        "postNumber": 2,
        "boardType": "general",
        "title": "게시글 제목",
        "content": "게시글 내용",
        "author": { "id": "userID", "authority": 3 },
        "viewCount": 0,
        "comments": [],
        "createdAt": "...",
        "updatedAt": "..."
      }
    }
    ```
- **GET** `/api/boards/{boardType}/{postId}` : 게시글 단일 조회  
  - Variables:
    - boardType: string, 필수 - 게시판 타입
    - postId: string, 필수 - 게시글 ID  
  - Response:
    ```json
    {
      "id": "boardpostID",
      "postNumber": 2,
      "boardType": "general",
      "title": "게시글 제목",
      "content": "게시글 내용",
      "author": { "id": "userID", "authority": 3 },
      "viewCount": 1,
      "comments": [],
      "createdAt": "...",
      "updatedAt": "..."
    }
    ```
- **PUT** `/api/boards/{boardType}/{postId}` : 게시글 수정  
  - Variables:
    - boardType: string, 필수 - 게시판 타입
    - postId: string, 필수 - 게시글 ID
    - title: string, 선택 - 게시글 제목 (수정 시)
    - content: string, 선택 - 게시글 내용 (수정 시)
    - id: string, 필수 - 사용자 ID
  - Response:
    ```json
    {
      "message": "게시글 수정 성공",
      "post": {
        "id": "boardpostID",
        "postNumber": 2,
        "boardType": "general",
        "title": "수정된 제목",
        "content": "수정된 내용",
        "author": { "id": "userID", "authority": 3 },
        "viewCount": 1,
        "comments": [],
        "createdAt": "...",
        "updatedAt": "..."
      }
    }
    ```
- **DELETE** `/api/boards/{boardType}/{postId}` : 게시글 삭제  
  - Variables:
    - boardType: string, 필수 - 게시판 타입
    - postId: string, 필수 - 게시글 ID
    - userId: string, 필수 - 사용자 ID  
  - Response:
    ```json
    { "message": "게시글 삭제 성공" }
    ```

## 댓글 관련 API
- **GET** `/api/boards/{boardType}/{postId}/comments` : 특정 게시글의 댓글 조회  
  - Variables:
    - boardType: string, 필수 - 게시판 타입
    - postId: string, 필수 - 댓글이 조회될 게시글 ID  
  - Response:
    ```json
    {
      "message": "댓글 조회 성공",
      "comments": [
        {
          "_id": "commentID",
          "content": "댓글 내용",
          "author": { "id": "userID", "authority": 3 },
          "createdAt": "2025-04-14T00:40:55.504Z",
          "updatedAt": "2025-04-14T00:40:55.504Z"
        }
      ]
    }
    ```
- **POST** `/api/boards/{boardType}/{postId}/comments` : 댓글 작성  
  - Variables:
    - boardType: string, 필수 - 게시판 타입
    - postId: string, 필수 - 게시글 ID
    - content: string, 필수 - 댓글 내용
    - id: string, 필수 - 사용자 ID  
  - Response:
    ```json
    {
      "message": "댓글 작성 성공",
      "comment": {
        "id": "commentID",
        "content": "댓글 내용",
        "author": { "id": "userID", "authority": 3 },
        "createdAt": "..."
      }
    }
    ```
- **PUT** `/api/boards/{boardType}/{postId}/comments/{commentId}` : 댓글 수정  
  - Variables:
    - boardType: string, 필수 - 게시판 타입
    - postId: string, 필수 - 게시글 ID
    - commentId: string, 필수 - 댓글 ID
    - content: string, 필수 - 수정할 댓글 내용
    - id: string, 필수 - 사용자 ID  
  - Response:
    ```json
    {
      "message": "댓글 수정 성공",
      "comment": {
        "id": "commentID",
        "content": "수정된 댓글 내용",
        "author": { "id": "userID", "authority": 3 },
        "updatedAt": "..."
      }
    }
    ```
- **DELETE** `/api/boards/{boardType}/{postId}/comments/{commentId}` : 댓글 삭제  
  - Variables:
    - boardType: string, 필수 - 게시판 타입
    - postId: string, 필수 - 게시글 ID
    - commentId: string, 필수 - 댓글 ID
    - id: string, 필수 - 사용자 ID  
  - Response:
    ```json
    { "message": "댓글 삭제 성공" }
    ```

## 관리자 전용 API
- **GET** `/api/admin/users` : 모든 사용자 목록 조회 (관리자 권한 필요)  
  - Variables: 없음  
  - Response:
    ```json
    [
      {
        "id": "user1",
        "email": "user1@example.com",
        "authority": 3,
        "createdAt": "2023-10-01T12:00:00Z",
        "updatedAt": "2023-10-01T12:00:00Z"
      },
      {
        "id": "admin1",
        "email": "admin@example.com",
        "authority": 5,
        "createdAt": "2023-09-01T10:00:00Z",
        "updatedAt": "2023-09-10T15:30:00Z"
      }
    ]
    ```

- **GET** `/api/admin/stats` : 사이트 통계 정보 조회 (관리자 권한 필요)  
  - Variables: 없음  
  - Response:
    ```json
    {
      "userCount": 25,
      "postCount": 120,
      "commentCount": 450,
      "activeUsers": 15,
      "lastWeekPosts": 35
    }
    ```
    
- **GET** `/api/admin/boards` : 모든 게시판 정보 조회 (관리자 권한 필요)  
  - Variables: 없음  
  - Response:
    ```json
    [
      {
        "boardType": "general",
        "name": "일반 게시판",
        "description": "일반적인 주제에 관한 게시판입니다",
        "postCount": 45,
        "lastPostDate": "2023-10-15T14:30:00Z" 
      },
      {
        "boardType": "notice",
        "name": "공지사항",
        "description": "중요 공지사항을 게시하는 게시판입니다",
        "postCount": 12,
        "lastPostDate": "2023-10-12T09:15:00Z" 
      }
    ]
    ```

- **POST** `/api/admin/boards` : 새 게시판 유형 생성 (관리자 권한 필요)  
  - Variables:
    - boardType: string, 필수 - 게시판 타입 (영문, 소문자, 하이픈 허용)
    - name: string, 필수 - 게시판 이름 (표시용)
    - description: string, 선택 - 게시판 설명
    - access: number, 선택 - 접근 권한 (기본값: 1, 모든 사용자 접근 가능)
  - Response:
    ```json
    {
      "message": "게시판 생성 성공",
      "board": {
        "boardType": "qna",
        "name": "질문 답변",
        "description": "질문과 답변을 위한 게시판입니다",
        "access": 1,
        "createdAt": "2023-10-20T11:00:00Z"
      }
    }
    ```

##  API 문서 vs 실제 구현 비교 분석

### ✅ **일치하는 부분**

#### 사용자 관련 API
- **GET** `/api/users` - 사용자 목록 조회 ✅
- **POST** `/api/users` - 신규 사용자 등록 ✅
- **GET** `/api/users/{id}` - 사용자 상세 정보 조회 ✅
- **GET** `/api/users/exists` - 이메일 중복 여부 확인 ✅
- **POST** `/api/users/login` - 로그인 ✅
- **POST** `/api/users/logout` - 로그아웃 ✅

#### 게시글 관련 API
- **GET** `/api/boards/{boardType}` - 게시글 목록 조회 ✅
- **POST** `/api/boards/{boardType}` - 게시글 생성 ✅
- **GET** `/api/boards/{boardType}/{postId}` - 게시글 단일 조회 ✅
- **PUT** `/api/boards/{boardType}/{postId}` - 게시글 수정 ✅
- **DELETE** `/api/boards/{boardType}/{postId}` - 게시글 삭제 ✅

#### 댓글 관련 API
- **GET** `/api/boards/{boardType}/{postId}/comments` - 댓글 조회 ✅
- **POST** `/api/boards/{boardType}/{postId}/comments` - 댓글 작성 ✅
- **PUT** `/api/boards/{boardType}/{postId}/comments/{commentId}` - 댓글 수정 ✅
- **DELETE** `/api/boards/{boardType}/{postId}/comments/{commentId}` - 댓글 삭제 ✅

#### 관리자 API
- **GET** `/api/admin/users` - 모든 사용자 목록 조회 ✅
- **GET** `/api/admin/stats` - 사이트 통계 정보 조회 ✅
- **GET** `/api/admin/boards` - 모든 게시판 정보 조회 ✅
- **POST** `/api/admin/boards` - 새 게시판 유형 생성 ✅

### ❌ **차이점 및 문제점**

#### 1. **누락된 API** ✅ **해결됨**
- **GET** `/api/users/exists-id?id={id}` - 아이디 중복 여부 확인 ✅
- **PUT** `/api/users/{id}` - 사용자 정보 수정 ✅
- **DELETE** `/api/users/{id}` - 사용자 삭제 ✅
- **GET** `/api/users/verify` - 토큰 유효성 검증 ✅

#### 2. **응답 형식 차이** ✅ **해결됨**
- **게시글 목록 조회**: pagination 정보 추가됨 ✅
- **게시글 삭제**: 파라미터가 `userId`로 통일됨 ✅
- **댓글 조회**: 경로가 `/api/boards/{boardType}/{postId}/comments`로 통일됨 ✅

#### 3. **구현 세부사항 차이** ✅ **해결됨**
- **게시글 목록 정렬**: `createdAt` 기준으로 통일됨 ✅
- **댓글 모델**: 별도 Comment 모델 사용으로 명확해짐 ✅

### ✅ **개선 완료 사항**

#### 1. **누락된 API 구현 완료**
```javascript
// userController.js에 추가된 함수들
exports.checkIdExists = async (req, res) => { /* 구현 완료 */ };
exports.updateUser = async (req, res) => { /* 구현 완료 */ };
exports.deleteUser = async (req, res) => { /* 구현 완료 */ };
exports.verifyToken = async (req, res) => { /* 구현 완료 */ };
```

#### 2. **API 문서 업데이트 완료**
- 댓글 API 경로 수정 완료
- 게시글 삭제 파라미터 수정 완료 (`email` → `userId`)
- 응답 형식 통일 완료

#### 3. **일관성 개선 완료**
- 게시글 목록에 pagination 추가 완료
- 정렬 기준 통일 완료 (`createdAt` 기준)
- 에러 응답 형식 표준화 완료

### 🎉 **최종 결과**
API 문서와 실제 구현이 완전히 일치하게 되었습니다!

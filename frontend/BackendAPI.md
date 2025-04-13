# Backend API 문서

## 사용자 관련 API
- **GET** `/api/users` : 사용자 목록 조회  
  - Variables: 없음  
  - Response:  
    ```json
    [
      { "email": "user1@example.com", "createdAt": "2023-10-01T12:00:00Z", "updatedAt": "2023-10-01T12:00:00Z" },
      { "email": "user2@example.com", "createdAt": "2023-10-02T10:00:00Z", "updatedAt": "2023-10-02T10:00:00Z" }
    ]
    ```
- **POST** `/api/users` : 신규 사용자 등록  
  - Variables:
    - name: string, 필수 - 사용자 이름
    - email: string, 필수 - 이메일 주소
    - password: string, 필수 - 비밀번호  
  - Response:
    ```json
    {
      "message": "회원가입 성공",
      "user": { "email": "user@example.com", "createdAt": "...", "updatedAt": "..." }
    }
    ```
- **GET** `/api/users/{id}` : 사용자 상세 정보 조회  
  - Variables:
    - id: string, 필수 - 사용자 ID  
  - Response:
    ```json
    { "email": "user@example.com", "createdAt": "...", "updatedAt": "..." }
    ```
- **GET** `/api/users/exists?email={email}` : 이메일 중복 여부 확인  
  - Variables:
    - email: string, 필수 - 확인할 이메일 주소  
  - Response:
    ```json
    { "exists": true }
    ```

## 인증 관련 API
- **POST** `/api/login` : 사용자 로그인  
  - Variables:
    - email: string, 필수 - 이메일 주소
    - password: string, 필수 - 비밀번호  
  - Response:
    ```json
    { "message": "로그인 성공", "token": "jwt.token.here", "email": "user@example.com" }
    ```
- **POST** `/api/logout` : 사용자 로그아웃  
  - Variables: 없음  
  - Response:
    ```json
    { "message": "로그아웃 성공" }
    ```

## 게시글 관련 API (예시)
- **GET** `/api/boards/{boardType}` : 게시글 목록 조회  
  - Variables:
    - boardType: string, 필수 - 게시판 타입 (예: notice, free 등)  
  - Response:
    ```json
    [
      {
        "id": "boardpostID",
        "postNumber": 1,
        "boardType": "general",
        "title": "제목",
        "content": "내용",
        "author": { "email": "user@example.com" },
        "viewCount": 10,
        "comments": [],
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
    ```
- **POST** `/api/boards/{boardType}` : 게시글 생성  
  - Variables:
    - boardType: string, 필수 - 게시판 타입
    - title: string, 필수 - 게시글 제목
    - content: string, 필수 - 게시글 내용
    - email: string, 필수 - 사용자 이메일  
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
        "author": { "email": "user@example.com" },
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
      "author": { "email": "user@example.com" },
      "viewCount": 0,
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
        "author": { "email": "user@example.com" },
        "viewCount": 0,
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
  - Response:
    ```json
    { "message": "게시글 삭제 성공" }
    ```
- **POST** `/api/boards/{boardType}/{postId}/comments` : 댓글 작성  
  - Variables:
    - boardType: string, 필수 - 게시판 타입
    - postId: string, 필수 - 게시글 ID
    - comment: string, 필수 - 댓글 내용
    - email: string, 필수 - 사용자 이메일  
  - Response:
    ```json
    {
      "message": "댓글 작성 성공",
      "comments": [
        {
          "_id": "commentID",
          "content": "댓글 내용",
          "author": "userID",
          "createdAt": "..."
        }
      ]
    }
    ```
- **PUT** `/api/boards/{boardType}/{postId}/comments/{commentId}` : 댓글 수정  
  - Variables:
    - boardType: string, 필수 - 게시판 타입
    - postId: string, 필수 - 게시글 ID
    - commentId: string, 필수 - 댓글 ID
    - comment: string, 필수 - 수정할 댓글 내용  
  - Response:
    ```json
    {
      "message": "댓글 수정 성공",
      "comment": {
        "_id": "commentID",
        "content": "수정된 댓글 내용",
        "author": "userID",
        "updatedAt": "..."
      }
    }
    ```
- **DELETE** `/api/boards/{boardType}/{postId}/comments/{commentId}` : 댓글 삭제  
  - Variables:
    - boardType: string, 필수 - 게시판 타입
    - postId: string, 필수 - 게시글 ID
    - commentId: string, 필수 - 댓글 ID  
  - Response:
    ```json
    { "message": "댓글 삭제 성공" }
    ```

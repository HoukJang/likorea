# Backend API 문서

## 사용자 관련 API
- **GET** `/api/users` : 사용자 목록 조회  
  - Variables: 없음
- **POST** `/api/users` : 신규 사용자 등록  
  - Variables:
    - name: string, 필수 - 사용자 이름
    - email: string, 필수 - 이메일 주소
    - password: string, 필수 - 비밀번호
- **GET** `/api/users/{id}` : 사용자 상세 정보 조회  
  - Variables:
    - id: string, 필수 - 사용자 ID
- **GET** `/api/users/exists?email={email}` : 이메일 중복 여부 확인  
  - Variables:
    - email: string, 필수 - 확인할 이메일 주소

## 인증 관련 API
- **POST** `/api/login` : 사용자 로그인  
  - Variables:
    - email: string, 필수 - 이메일 주소
    - password: string, 필수 - 비밀번호
- **POST** `/api/logout` : 사용자 로그아웃  
  - Variables: 없음

## 게시글 관련 API (예시)
- **GET** `/api/boards/{boardType}` : 게시글 목록 조회  
  - Variables:
    - boardType: string, 필수 - 게시판 타입 (예: notice, free 등)
- **POST** `/api/boards/{boardType}` : 게시글 생성  
  - Variables:
    - boardType: string, 필수 - 게시판 타입
    - title: string, 필수 - 게시글 제목
    - content: string, 필수 - 게시글 내용
    - authorId: string, 필수 - 작성자 ID
- **PUT** `/api/boards/{boardType}/{postId}` : 게시글 수정  
  - Variables:
    - boardType: string, 필수 - 게시판 타입
    - postId: string, 필수 - 게시글 ID
    - title: string, 선택 - 게시글 제목 (수정 시)
    - content: string, 선택 - 게시글 내용 (수정 시)
- **DELETE** `/api/boards/{boardType}/{postId}` : 게시글 삭제  
  - Variables:
    - boardType: string, 필수 - 게시판 타입
    - postId: string, 필수 - 게시글 ID
- **POST** `/api/boards/{boardType}/{postId}/comments` : 댓글 작성  
  - Variables:
    - boardType: string, 필수 - 게시판 타입
    - postId: string, 필수 - 게시글 ID
    - comment: string, 필수 - 댓글 내용
    - authorId: string, 필수 - 작성자 ID
- **PUT** `/api/boards/{boardType}/{postId}/comments/{commentId}` : 댓글 수정  
  - Variables:
    - boardType: string, 필수 - 게시판 타입
    - postId: string, 필수 - 게시글 ID
    - commentId: string, 필수 - 댓글 ID
    - comment: string, 필수 - 수정할 댓글 내용
- **DELETE** `/api/boards/{boardType}/{postId}/comments/{commentId}` : 댓글 삭제  
  - Variables:
    - boardType: string, 필수 - 게시판 타입
    - postId: string, 필수 - 게시글 ID
    - commentId: string, 필수 - 댓글 ID

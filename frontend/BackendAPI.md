# Backend API 문서

## 사용자 관련 API
- **GET** `/api/users` : 사용자 목록 조회
- **POST** `/api/users` : 신규 사용자 등록
- **GET** `/api/users/{id}` : 사용자 상세 정보 조회
- **GET** `/api/users/exists?email={email}` : 이메일 중복 여부 확인

## 인증 관련 API
- **POST** `/api/login` : 사용자 로그인
- **POST** `/api/logout` : 사용자 로그아웃

## 게시글 관련 API (예시)
- **GET** `/api/boards/{boardType}` : 게시글 목록 조회
- **POST** `/api/boards/{boardType}` : 게시글 생성
- **PUT** `/api/boards/{boardType}/{postId}` : 게시글 수정
- **DELETE** `/api/boards/{boardType}/{postId}` : 게시글 삭제
- **POST** `/api/boards/{boardType}/{postId}/comments` : 댓글 작성
- **PUT** `/api/boards/{boardType}/{postId}/comments/{commentId}` : 댓글 수정
- **DELETE** `/api/boards/{boardType}/{postId}/comments/{commentId}` : 댓글 삭제

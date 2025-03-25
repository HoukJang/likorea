# Backend API 문서

## 사용자 관련 API
- **GET** `/api/users` : 사용자 목록 조회
- **POST** `/api/users` : 신규 사용자 등록
- **GET** `/api/users/{id}` : 사용자 상세 정보 조회
- **GET** `/api/users/exists?email={email}` : 이메일 중복 여부 확인

## 인증 관련 API
- **POST** `/api/login` : 사용자 로그인
- **POST** `/api/logout` : 사용자 로그아웃

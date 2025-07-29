# Likorea Documentation Index

프로젝트의 모든 문서에 대한 종합 인덱스입니다.

## 📚 문서 구조

```
docs/
├── DOCUMENTATION_INDEX.md      # 현재 문서 (문서 목록 및 가이드)
├── PROJECT_STRUCTURE.md        # 프로젝트 전체 구조 및 아키텍처
├── API_DOCUMENTATION.md        # API 엔드포인트 상세 문서
├── BACKEND_ARCHITECTURE.md     # 백엔드 아키텍처 상세
├── FRONTEND_ARCHITECTURE.md    # 프론트엔드 아키텍처 상세
├── COMPONENT_REFERENCE.md      # React 컴포넌트 레퍼런스
├── DATABASE_SCHEMA.md          # 데이터베이스 스키마 문서
└── UTILITIES_AND_HELPERS.md    # 유틸리티 함수 문서
```

## 🗂️ 문서별 내용 요약

### 1. [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
**프로젝트 전체 구조 문서**
- 프로젝트 개요 및 기술 스택
- 전체 아키텍처 다이어그램
- 디렉토리 구조 설명
- 주요 기능 목록
- 보안 및 인증 체계
- 배포 프로세스

**주요 섹션:**
- 프로젝트 개요
- 아키텍처 개요
- 디렉토리 구조
- 백엔드/프론트엔드 아키텍처 요약
- 데이터베이스 스키마 요약
- 주요 기능
- 보안 및 인증

### 2. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
**RESTful API 문서**
- 모든 API 엔드포인트 명세
- 요청/응답 형식
- 인증 방법
- 에러 코드
- Rate Limiting 정책

**API 카테고리:**
- 인증 API (로그인, 회원가입, 토큰 검증)
- 사용자 관리 API
- 게시판 API (CRUD)
- 댓글 API
- 태그 API
- 관리자 API

### 3. [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)
**백엔드 상세 아키텍처**
- Express.js 서버 구성
- MVC 패턴 구현 상세
- 컨트롤러별 기능 설명
- 미들웨어 동작 방식
- 모델 상세 스펙
- 에러 처리 전략
- 테스트 구조

**주요 컴포넌트:**
- Controllers (user, board, comment, admin, tag)
- Middleware (auth, validation, security, error)
- Models (Mongoose 스키마)
- Routes (API 라우팅)
- Utils (logger, initDB, initTags)

### 4. [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)
**프론트엔드 상세 아키텍처**
- React 애플리케이션 구조
- 컴포넌트 계층 구조
- 상태 관리 전략
- API 통신 레이어
- 라우팅 시스템
- 스타일링 방법론
- 성능 최적화

**주요 섹션:**
- 컴포넌트 아키텍처
- Custom Hooks
- API Client 구현
- 라우팅 및 보호된 라우트
- CSS Modules 사용법
- 테스트 전략

### 5. [COMPONENT_REFERENCE.md](./COMPONENT_REFERENCE.md)
**React 컴포넌트 가이드**
- 모든 컴포넌트의 Props 명세
- 사용 예시 코드
- 컴포넌트별 기능 설명
- 스타일링 옵션

**컴포넌트 카테고리:**
- 공통 컴포넌트 (Button, Input, Loading)
- 게시판 컴포넌트 (BoardList, BoardPostView, BoardPostForm)
- 인증 컴포넌트 (Login, Signup, Profile)
- 태그 컴포넌트 (TagSelector, TagFilter)
- 관리자 컴포넌트 (Admin)
- 레이아웃 컴포넌트 (GlobalNavigation, ErrorBoundary)

### 6. [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
**데이터베이스 설계 문서**
- MongoDB 컬렉션 구조
- Mongoose 스키마 정의
- 인덱스 전략
- 관계 및 참조
- 데이터 무결성 규칙
- 마이그레이션 가이드

**컬렉션:**
- users (사용자)
- boardposts (게시글)
- comments (댓글)
- tags (태그)
- counters (시퀀스)
- trafficlogs (트래픽 로그)

### 7. [UTILITIES_AND_HELPERS.md](./UTILITIES_AND_HELPERS.md)
**유틸리티 함수 문서**
- 백엔드 유틸리티
- 프론트엔드 유틸리티
- 공통 헬퍼 함수
- 초기화 스크립트
- 테스트 헬퍼

**주요 유틸리티:**
- logger (로깅 시스템)
- initDB/initTags (초기화)
- errorHandler (에러 처리)
- tagUtils (태그 관련)
- dataUtils (데이터 변환)

## 🚀 빠른 시작 가이드

### 신규 개발자를 위한 추천 읽기 순서

1. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - 전체 프로젝트 이해
2. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - API 사용법 학습
3. **역할별 문서:**
   - 백엔드 개발자: [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)
   - 프론트엔드 개발자: [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) → [COMPONENT_REFERENCE.md](./COMPONENT_REFERENCE.md)
   - 풀스택 개발자: 모든 문서 순차적 읽기

### 작업별 참고 문서

| 작업 유형 | 참고 문서 |
|----------|-----------|
| 새 API 엔드포인트 추가 | BACKEND_ARCHITECTURE.md, API_DOCUMENTATION.md |
| React 컴포넌트 개발 | COMPONENT_REFERENCE.md, FRONTEND_ARCHITECTURE.md |
| 데이터베이스 스키마 변경 | DATABASE_SCHEMA.md |
| 버그 수정 | UTILITIES_AND_HELPERS.md (디버깅 도구) |
| 성능 최적화 | 각 아키텍처 문서의 "성능 최적화" 섹션 |
| 테스트 작성 | 각 아키텍처 문서의 "테스트" 섹션 |

## 📋 문서 관리 가이드

### 문서 업데이트 규칙

1. **코드 변경 시 문서 업데이트**
   - 새로운 API 추가 → API_DOCUMENTATION.md 업데이트
   - 컴포넌트 추가/변경 → COMPONENT_REFERENCE.md 업데이트
   - 스키마 변경 → DATABASE_SCHEMA.md 업데이트

2. **문서 작성 스타일**
   - 명확하고 간결한 설명
   - 코드 예시 포함
   - 주의사항 명시
   - 관련 문서 링크

3. **버전 관리**
   - 중요 변경사항은 문서 상단에 변경 이력 추가
   - 날짜와 변경 내용 기록

### 문서 템플릿

새로운 문서 작성 시 다음 템플릿 사용:

```markdown
# 문서 제목

## 목차
1. [개요](#개요)
2. [주요 내용](#주요-내용)
3. [사용 예시](#사용-예시)
4. [주의사항](#주의사항)
5. [관련 문서](#관련-문서)

## 개요
(문서의 목적과 범위 설명)

## 주요 내용
(상세 내용)

## 사용 예시
```code
(코드 예시)
```

## 주의사항
- 주의사항 1
- 주의사항 2

## 관련 문서
- [관련 문서 1](링크)
- [관련 문서 2](링크)
```

## 🔍 빠른 참조

### 자주 찾는 정보

| 정보 | 위치 |
|------|------|
| API 엔드포인트 목록 | [API_DOCUMENTATION.md#api-엔드포인트](./API_DOCUMENTATION.md#api-엔드포인트) |
| 데이터베이스 스키마 | [DATABASE_SCHEMA.md#스키마-상세](./DATABASE_SCHEMA.md#스키마-상세) |
| 컴포넌트 Props | [COMPONENT_REFERENCE.md](./COMPONENT_REFERENCE.md) |
| 환경 변수 설정 | [PROJECT_STRUCTURE.md#배포-및-환경-설정](./PROJECT_STRUCTURE.md#배포-및-환경-설정) |
| 에러 코드 | [API_DOCUMENTATION.md#에러-코드](./API_DOCUMENTATION.md#에러-코드) |
| 테스트 실행 방법 | 각 아키텍처 문서의 테스트 섹션 |

### 문제 해결 가이드

| 문제 | 참고 문서 |
|------|-----------|
| API 호출 에러 | API_DOCUMENTATION.md (에러 코드) |
| 컴포넌트 렌더링 문제 | COMPONENT_REFERENCE.md |
| 데이터베이스 연결 문제 | DATABASE_SCHEMA.md (연결 설정) |
| 빌드/배포 문제 | PROJECT_STRUCTURE.md (배포 프로세스) |
| 성능 이슈 | 각 아키텍처 문서의 성능 최적화 섹션 |

## 📞 추가 지원

문서에서 찾을 수 없는 정보가 있다면:
1. 코드의 주석 확인
2. 테스트 코드 참고
3. 팀 리더에게 문의

---

*이 인덱스는 프로젝트 문서의 최신 상태를 반영합니다. 문서 추가/변경 시 이 인덱스도 함께 업데이트해주세요.*
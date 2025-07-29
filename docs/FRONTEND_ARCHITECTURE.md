# Frontend Architecture Documentation

## 목차
1. [개요](#개요)
2. [프로젝트 구조](#프로젝트-구조)
3. [컴포넌트 아키텍처](#컴포넌트-아키텍처)
4. [상태 관리](#상태-관리)
5. [API 통신](#api-통신)
6. [라우팅](#라우팅)
7. [스타일링](#스타일링)
8. [성능 최적화](#성능-최적화)
9. [테스트](#테스트)

## 개요

프론트엔드는 React 18을 기반으로 한 Single Page Application(SPA)입니다.

### 핵심 기술
- **React 18**: UI 라이브러리
- **React Router v6**: 클라이언트 사이드 라우팅
- **CSS Modules**: 컴포넌트 스코프 스타일링
- **Fetch API**: HTTP 통신
- **Context API**: 전역 상태 관리

### 설계 원칙
- 컴포넌트 재사용성
- 관심사의 분리
- 타입 안정성 (PropTypes 사용)
- 접근성 고려
- 반응형 디자인

## 프로젝트 구조

```
frontend/src/
├── api/                 # API 통신 레이어
│   ├── client.js       # 공통 API 클라이언트
│   ├── auth.js         # 인증 관련 API
│   ├── boards.js       # 게시판 API
│   ├── admin.js        # 관리자 API
│   └── tags.js         # 태그 API
│
├── components/          # React 컴포넌트
│   ├── common/         # 재사용 가능한 공통 컴포넌트
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   └── Loading.jsx
│   │
│   ├── Admin.jsx       # 관리자 대시보드
│   ├── BoardList.jsx   # 게시글 목록
│   ├── BoardPostForm.jsx # 게시글 폼
│   ├── BoardPostView.jsx # 게시글 상세
│   ├── CommentForm.jsx  # 댓글 폼
│   ├── Login.jsx       # 로그인
│   ├── Signup.jsx      # 회원가입
│   ├── TagFilter.jsx   # 태그 필터
│   └── TagSelector.jsx # 태그 선택기
│
├── hooks/              # Custom React Hooks
│   ├── useApi.js      # API 호출 상태 관리
│   ├── useAuth.js     # 인증 상태 관리
│   ├── useLoading.js  # 로딩 상태 관리
│   └── usePermission.js # 권한 확인
│
├── pages/              # 페이지 컴포넌트
│   └── Home.jsx       # 홈 페이지
│
├── utils/              # 유틸리티 함수
│   ├── dataUtils.js   # 데이터 변환
│   ├── errorHandler.js # 에러 처리
│   ├── logger.js      # 로깅
│   └── tagUtils.js    # 태그 관련 유틸
│
├── App.jsx            # 메인 앱 컴포넌트
├── index.js          # 앱 진입점
└── config.js         # 환경 설정
```

## 컴포넌트 아키텍처

### 컴포넌트 계층 구조

```
App.jsx
├── GlobalNavigation
├── ErrorBoundary
│   └── Router
│       ├── Home
│       │   └── BoardList
│       │       ├── TagFilter
│       │       └── BoardItem
│       ├── BoardPostView
│       │   ├── CommentList
│       │   └── CommentForm
│       ├── BoardPostForm
│       │   └── TagSelector
│       ├── Login
│       ├── Signup
│       └── Admin
│           ├── UserManagement
│           └── Statistics
└── Footer
```

### 주요 컴포넌트 상세

#### App.jsx
최상위 컴포넌트로 전체 애플리케이션을 감싸고 있습니다.

```javascript
// 주요 기능
- 라우터 설정
- 전역 에러 바운더리
- 인증 컨텍스트 제공
- 레이아웃 구조
```

#### BoardList.jsx
게시글 목록을 표시하는 핵심 컴포넌트입니다.

```javascript
// Props
- posts: 게시글 배열
- onPageChange: 페이지 변경 핸들러
- currentPage: 현재 페이지
- totalPages: 전체 페이지

// 기능
- 페이지네이션
- 태그 필터링
- 검색 기능
- 정렬 옵션
```

#### BoardPostForm.jsx
게시글 작성/수정 폼 컴포넌트입니다.

```javascript
// 상태 관리
- title: 제목
- content: 내용
- tags: 선택된 태그
- errors: 유효성 검사 에러

// 기능
- 입력 유효성 검사
- HTML 에디터
- 태그 선택
- 미리보기
```

#### TagSelector.jsx
태그 선택을 위한 컴포넌트입니다.

```javascript
// Props
- selectedTags: 현재 선택된 태그
- onChange: 태그 변경 핸들러
- required: 필수 여부

// 기능
- 카테고리별 태그 표시
- 다중 선택 지원
- 검색 기능
```

### 공통 컴포넌트

#### Button.jsx
```javascript
// Props
- variant: 'primary' | 'secondary' | 'danger'
- size: 'small' | 'medium' | 'large'
- disabled: boolean
- loading: boolean
- onClick: function

// 사용 예시
<Button 
  variant="primary" 
  size="medium" 
  onClick={handleSubmit}
  loading={isSubmitting}
>
  제출하기
</Button>
```

#### Input.jsx
```javascript
// Props
- type: input type
- label: 라벨 텍스트
- error: 에러 메시지
- required: 필수 여부
- onChange: 변경 핸들러

// 사용 예시
<Input
  type="email"
  label="이메일"
  value={email}
  onChange={setEmail}
  error={errors.email}
  required
/>
```

## 상태 관리

### 로컬 상태
컴포넌트 내부에서 useState를 사용합니다.

```javascript
// 예시
const [posts, setPosts] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

### 전역 상태
Context API를 사용하여 인증 상태를 관리합니다.

#### AuthContext
```javascript
// 제공하는 값
- user: 현재 로그인한 사용자
- isAuthenticated: 인증 여부
- login: 로그인 함수
- logout: 로그아웃 함수
- checkAuth: 인증 확인
```

### Custom Hooks

#### useAuth
인증 관련 상태와 함수를 제공합니다.

```javascript
const { user, isAuthenticated, login, logout } = useAuth();
```

#### useApi
API 호출 상태를 관리합니다.

```javascript
const { data, loading, error, execute } = useApi(apiFunction);
```

#### useLoading
로딩 상태를 관리합니다.

```javascript
const { isLoading, startLoading, stopLoading } = useLoading();
```

#### usePermission
사용자 권한을 확인합니다.

```javascript
const { hasPermission, isAdmin, canEdit } = usePermission();
```

## API 통신

### API Client (client.js)
모든 API 호출을 처리하는 중앙 클라이언트입니다.

```javascript
class ApiClient {
  // 기능
  - 자동 토큰 첨부
  - 에러 처리
  - 응답 파싱
  - 토큰 만료 처리
  
  // 메서드
  - get(endpoint)
  - post(endpoint, data)
  - put(endpoint, data)
  - delete(endpoint)
}
```

### API 모듈

#### auth.js
```javascript
// 함수
- login(credentials)
- logout()
- signup(userData)
- verifyToken()
```

#### boards.js
```javascript
// 함수
- getPosts(params)
- getPost(id)
- createPost(data)
- updatePost(id, data)
- deletePost(id)
```

#### admin.js
```javascript
// 함수
- getStats()
- getAllUsers(params)
- updateUserAuthority(userId, authority)
```

### 에러 처리
```javascript
// API 에러 형식
{
  message: "에러 메시지",
  statusCode: 400,
  type: "VALIDATION_ERROR"
}

// 에러 처리 예시
try {
  const data = await api.post('/boards', postData);
  // 성공 처리
} catch (error) {
  if (error.statusCode === 401) {
    // 인증 에러
  } else if (error.statusCode === 400) {
    // 유효성 검사 에러
  } else {
    // 일반 에러
  }
}
```

## 라우팅

React Router v6를 사용한 클라이언트 사이드 라우팅입니다.

### 라우트 구조
```javascript
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/boards" element={<BoardList />} />
  <Route path="/boards/:id" element={<BoardPostView />} />
  <Route path="/boards/new" element={<PrivateRoute><BoardPostForm /></PrivateRoute>} />
  <Route path="/boards/:id/edit" element={<PrivateRoute><BoardPostForm /></PrivateRoute>} />
  <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

### Protected Routes
인증이 필요한 라우트를 보호합니다.

```javascript
// PrivateRoute
- 로그인 확인
- 미인증 시 로그인 페이지로 리다이렉트

// AdminRoute
- 관리자 권한 확인
- 권한 부족 시 접근 거부
```

## 스타일링

### CSS Modules
컴포넌트별 스코프된 스타일을 사용합니다.

```css
/* Button.module.css */
.button {
  padding: 8px 16px;
  border-radius: 4px;
}

.primary {
  background-color: #007bff;
  color: white;
}
```

```javascript
// 사용
import styles from './Button.module.css';

<button className={`${styles.button} ${styles.primary}`}>
  클릭
</button>
```

### 반응형 디자인
```css
/* 모바일 우선 접근 */
.container {
  padding: 16px;
}

/* 태블릿 */
@media (min-width: 768px) {
  .container {
    padding: 24px;
  }
}

/* 데스크톱 */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### 테마 변수
```css
:root {
  /* 색상 */
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --danger-color: #dc3545;
  
  /* 간격 */
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  
  /* 폰트 */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
}
```

## 성능 최적화

### Code Splitting
```javascript
// 라우트 기반 분할
const Admin = lazy(() => import('./components/Admin'));

// 사용
<Suspense fallback={<Loading />}>
  <Admin />
</Suspense>
```

### 메모이제이션
```javascript
// React.memo
const BoardItem = React.memo(({ post }) => {
  // 컴포넌트 로직
});

// useMemo
const filteredPosts = useMemo(() => {
  return posts.filter(post => /* 필터 로직 */);
}, [posts, filters]);

// useCallback
const handleSubmit = useCallback(() => {
  // 제출 로직
}, [dependencies]);
```

### 이미지 최적화
```javascript
// Lazy loading
<img 
  src={thumbnail} 
  loading="lazy"
  alt={description}
/>

// 반응형 이미지
<picture>
  <source media="(max-width: 768px)" srcSet={mobileSrc} />
  <source media="(min-width: 769px)" srcSet={desktopSrc} />
  <img src={defaultSrc} alt={description} />
</picture>
```

## 테스트

### 테스트 전략
- 컴포넌트 테스트: React Testing Library
- Hook 테스트: @testing-library/react-hooks
- API 테스트: MSW (Mock Service Worker)

### 테스트 구조
```
__tests__/
├── components/
│   ├── BoardList.test.jsx
│   └── TagSelector.test.jsx
├── hooks/
│   ├── useAuth.test.js
│   └── useApi.test.js
└── api/
    └── apiClient.test.js
```

### 테스트 예시
```javascript
// 컴포넌트 테스트
describe('BoardList', () => {
  it('renders posts correctly', () => {
    const posts = [/* 테스트 데이터 */];
    render(<BoardList posts={posts} />);
    
    expect(screen.getByText(posts[0].title)).toBeInTheDocument();
  });
});

// Hook 테스트
describe('useAuth', () => {
  it('handles login correctly', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login({ id: 'test', password: 'password' });
    });
    
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

## 보안 고려사항

### XSS 방지
- React의 기본 이스케이핑 활용
- dangerouslySetInnerHTML 최소화
- 사용자 입력 검증

### 인증 토큰 관리
- localStorage에 저장
- 자동 만료 처리
- 헤더에 자동 첨부

### HTTPS
- 프로덕션에서 HTTPS 강제
- 민감한 데이터 암호화

## 접근성

### ARIA 속성
```javascript
<button 
  aria-label="게시글 삭제"
  aria-pressed={isSelected}
>
  삭제
</button>
```

### 키보드 네비게이션
- 탭 순서 관리
- 포커스 트랩
- 키보드 단축키

### 스크린 리더 지원
- 의미 있는 alt 텍스트
- 적절한 heading 구조
- 랜드마크 역할
# Component Reference Guide

## 목차
1. [공통 컴포넌트](#공통-컴포넌트)
2. [게시판 컴포넌트](#게시판-컴포넌트)
3. [인증 컴포넌트](#인증-컴포넌트)
4. [태그 컴포넌트](#태그-컴포넌트)
5. [관리자 컴포넌트](#관리자-컴포넌트)
6. [레이아웃 컴포넌트](#레이아웃-컴포넌트)
7. [유틸리티 컴포넌트](#유틸리티-컴포넌트)

## 공통 컴포넌트

### Button
재사용 가능한 버튼 컴포넌트입니다.

```jsx
import Button from './components/common/Button';

// Props
{
  children: React.ReactNode,    // 버튼 내용
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost',  // 스타일 변형
  size?: 'small' | 'medium' | 'large',  // 크기
  disabled?: boolean,           // 비활성화 상태
  loading?: boolean,            // 로딩 상태
  fullWidth?: boolean,          // 전체 너비
  onClick?: () => void,         // 클릭 핸들러
  type?: 'button' | 'submit' | 'reset',  // 버튼 타입
  className?: string,           // 추가 CSS 클래스
}

// 사용 예시
<Button 
  variant="primary" 
  size="medium"
  onClick={handleSubmit}
  loading={isSubmitting}
>
  제출하기
</Button>

// 변형 예시
<Button variant="secondary">취소</Button>
<Button variant="danger" size="small">삭제</Button>
<Button variant="ghost" fullWidth>더보기</Button>
```

### Input
폼 입력 컴포넌트입니다.

```jsx
import Input from './components/common/Input';

// Props
{
  type?: string,               // input 타입
  label?: string,              // 라벨 텍스트
  placeholder?: string,        // 플레이스홀더
  value: string | number,      // 입력 값
  onChange: (value) => void,   // 변경 핸들러
  error?: string,              // 에러 메시지
  required?: boolean,          // 필수 여부
  disabled?: boolean,          // 비활성화
  maxLength?: number,          // 최대 길이
  className?: string,          // 추가 CSS 클래스
}

// 사용 예시
<Input
  type="email"
  label="이메일"
  placeholder="example@email.com"
  value={email}
  onChange={setEmail}
  error={errors.email}
  required
/>

// 비밀번호 입력
<Input
  type="password"
  label="비밀번호"
  value={password}
  onChange={setPassword}
  error={errors.password}
  required
/>
```

### Loading
로딩 상태를 표시하는 컴포넌트입니다.

```jsx
import Loading from './components/common/Loading';

// Props
{
  size?: 'small' | 'medium' | 'large',  // 크기
  text?: string,                         // 로딩 텍스트
  fullScreen?: boolean,                  // 전체 화면 오버레이
}

// 사용 예시
<Loading />
<Loading size="large" text="데이터를 불러오는 중..." />
<Loading fullScreen text="처리중..." />
```

## 게시판 컴포넌트

### BoardList
게시글 목록을 표시하는 컴포넌트입니다.

```jsx
import BoardList from './components/BoardList';

// Props
{
  posts: Array<Post>,          // 게시글 배열
  loading?: boolean,           // 로딩 상태
  error?: Error,              // 에러 객체
  currentPage: number,         // 현재 페이지
  totalPages: number,          // 전체 페이지
  onPageChange: (page) => void, // 페이지 변경 핸들러
  onTagFilter: (tag) => void,  // 태그 필터 핸들러
  selectedTags?: object,       // 선택된 태그
}

// Post 타입
{
  _id: string,
  number: number,
  title: string,
  content: string,
  author: {
    id: string,
    email: string
  },
  tags: {
    type: string,
    region: string
  },
  views: number,
  createdAt: string,
  commentsCount: number
}

// 사용 예시
<BoardList
  posts={posts}
  loading={loading}
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={handlePageChange}
  onTagFilter={handleTagFilter}
  selectedTags={selectedTags}
/>
```

### BoardPostView
게시글 상세 보기 컴포넌트입니다.

```jsx
import BoardPostView from './components/BoardPostView';

// Props
{
  post: Post,                  // 게시글 객체
  currentUser?: User,          // 현재 사용자
  onEdit?: () => void,         // 수정 핸들러
  onDelete?: () => void,       // 삭제 핸들러
  onLike?: () => void,         // 좋아요 핸들러
}

// 사용 예시
<BoardPostView
  post={post}
  currentUser={user}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onLike={handleLike}
/>
```

### BoardPostForm
게시글 작성/수정 폼 컴포넌트입니다.

```jsx
import BoardPostForm from './components/BoardPostForm';

// Props
{
  post?: Post,                 // 수정할 게시글 (수정 모드)
  onSubmit: (data) => void,    // 제출 핸들러
  onCancel: () => void,        // 취소 핸들러
  loading?: boolean,           // 제출 중 상태
}

// 제출 데이터 형식
{
  title: string,
  content: string,
  tags: {
    type: string,
    region: string
  }
}

// 사용 예시
// 새 글 작성
<BoardPostForm
  onSubmit={handleCreate}
  onCancel={handleCancel}
  loading={isSubmitting}
/>

// 글 수정
<BoardPostForm
  post={existingPost}
  onSubmit={handleUpdate}
  onCancel={handleCancel}
  loading={isSubmitting}
/>
```

### CommentForm
댓글 작성 폼 컴포넌트입니다.

```jsx
import CommentForm from './components/CommentForm';

// Props
{
  postId: string,              // 게시글 ID
  parentId?: string,           // 부모 댓글 ID (대댓글)
  onSubmit: (comment) => void, // 제출 핸들러
  onCancel?: () => void,       // 취소 핸들러
  placeholder?: string,        // 플레이스홀더
}

// 사용 예시
<CommentForm
  postId={post._id}
  onSubmit={handleCommentSubmit}
  placeholder="댓글을 입력하세요..."
/>

// 대댓글
<CommentForm
  postId={post._id}
  parentId={comment._id}
  onSubmit={handleReplySubmit}
  onCancel={handleCancelReply}
  placeholder="답글을 입력하세요..."
/>
```

## 인증 컴포넌트

### Login
로그인 폼 컴포넌트입니다.

```jsx
import Login from './components/Login';

// Props
{
  onSuccess?: () => void,      // 로그인 성공 콜백
  redirectTo?: string,         // 성공 후 리다이렉트 경로
}

// 사용 예시
<Login 
  onSuccess={() => navigate('/boards')}
  redirectTo="/boards"
/>
```

### Signup
회원가입 폼 컴포넌트입니다.

```jsx
import Signup from './components/Signup';

// Props
{
  onSuccess?: () => void,      // 가입 성공 콜백
  redirectTo?: string,         // 성공 후 리다이렉트 경로
}

// 사용 예시
<Signup 
  onSuccess={() => navigate('/login')}
/>
```

### Profile
사용자 프로필 컴포넌트입니다.

```jsx
import Profile from './components/Profile';

// Props
{
  user: User,                  // 사용자 객체
  onUpdate?: (data) => void,   // 프로필 업데이트 핸들러
  onLogout?: () => void,       // 로그아웃 핸들러
}

// 사용 예시
<Profile
  user={currentUser}
  onUpdate={handleProfileUpdate}
  onLogout={handleLogout}
/>
```

## 태그 컴포넌트

### TagSelector
태그 선택 컴포넌트입니다.

```jsx
import TagSelector from './components/TagSelector';

// Props
{
  selectedTags: {              // 선택된 태그
    type?: string,
    region?: string
  },
  onChange: (tags) => void,    // 태그 변경 핸들러
  required?: boolean,          // 필수 선택 여부
  error?: string,             // 에러 메시지
}

// 사용 예시
<TagSelector
  selectedTags={selectedTags}
  onChange={handleTagChange}
  required
  error={errors.tags}
/>
```

### TagFilter
태그 필터 컴포넌트입니다.

```jsx
import TagFilter from './components/TagFilter';

// Props
{
  selectedTags: object,        // 현재 선택된 태그
  onFilterChange: (tags) => void, // 필터 변경 핸들러
  availableTags: object,       // 사용 가능한 태그 목록
  showCount?: boolean,         // 태그별 게시글 수 표시
}

// 사용 예시
<TagFilter
  selectedTags={filters}
  onFilterChange={handleFilterChange}
  availableTags={tags}
  showCount
/>
```

## 관리자 컴포넌트

### Admin
관리자 대시보드 컴포넌트입니다.

```jsx
import Admin from './components/Admin';

// 기능
- 사용자 관리
- 통계 대시보드
- 권한 관리
- 봇 관리

// 사용 예시
<Admin />  // 내부적으로 권한 확인 및 데이터 로드
```

## 레이아웃 컴포넌트

### GlobalNavigation
전역 네비게이션 컴포넌트입니다.

```jsx
import GlobalNavigation from './components/GlobalNavigation';

// Props
{
  user?: User,                 // 현재 사용자
  onLogout?: () => void,       // 로그아웃 핸들러
}

// 사용 예시
<GlobalNavigation
  user={currentUser}
  onLogout={handleLogout}
/>
```

### ErrorBoundary
에러 경계 컴포넌트입니다.

```jsx
import ErrorBoundary from './components/ErrorBoundary';

// Props
{
  children: React.ReactNode,   // 자식 컴포넌트
  fallback?: React.ReactNode,  // 에러 시 표시할 컴포넌트
  onError?: (error) => void,   // 에러 핸들러
}

// 사용 예시
<ErrorBoundary 
  fallback={<ErrorFallback />}
  onError={logError}
>
  <App />
</ErrorBoundary>
```

### Banner
배너 컴포넌트입니다.

```jsx
import Banner from './components/Banner';

// Props
{
  type?: 'info' | 'warning' | 'error' | 'success',
  message: string,             // 배너 메시지
  dismissible?: boolean,       // 닫기 가능 여부
  onDismiss?: () => void,      // 닫기 핸들러
}

// 사용 예시
<Banner
  type="info"
  message="새로운 기능이 추가되었습니다!"
  dismissible
  onDismiss={handleDismiss}
/>
```

## 유틸리티 컴포넌트

### TrafficDashboard
트래픽 대시보드 컴포넌트입니다.

```jsx
import TrafficDashboard from './components/TrafficDashboard';

// Props
{
  startDate?: Date,            // 시작 날짜
  endDate?: Date,              // 종료 날짜
  refreshInterval?: number,    // 새로고침 간격 (ms)
}

// 사용 예시
<TrafficDashboard
  startDate={startDate}
  endDate={endDate}
  refreshInterval={30000} // 30초
/>
```

### DesignPreview
디자인 미리보기 컴포넌트입니다.

```jsx
import DesignPreview from './components/DesignPreview';

// 디자인 시스템 컴포넌트 미리보기
// 개발 환경에서만 사용

// 사용 예시
<DesignPreview />
```

## 컴포넌트 사용 가이드라인

### 1. Props 검증
모든 컴포넌트는 PropTypes를 사용하여 props를 검증합니다.

```jsx
import PropTypes from 'prop-types';

Component.propTypes = {
  required: PropTypes.string.isRequired,
  optional: PropTypes.number,
  oneOf: PropTypes.oneOf(['a', 'b', 'c']),
  arrayOf: PropTypes.arrayOf(PropTypes.string),
  shape: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string
  })
};
```

### 2. 기본값 설정
선택적 props에는 defaultProps를 설정합니다.

```jsx
Component.defaultProps = {
  size: 'medium',
  variant: 'primary',
  disabled: false
};
```

### 3. 접근성
모든 인터랙티브 컴포넌트는 접근성을 고려합니다.

```jsx
// ARIA 속성
<button aria-label="닫기" aria-pressed={isPressed}>

// 키보드 네비게이션
onKeyDown={handleKeyDown}

// 포커스 관리
ref={focusRef}
```

### 4. 성능 최적화
필요한 경우 메모이제이션을 사용합니다.

```jsx
// React.memo
export default React.memo(Component);

// useMemo
const computedValue = useMemo(() => expensiveComputation(), [deps]);

// useCallback
const memoizedCallback = useCallback(() => {}, [deps]);
```

### 5. 에러 처리
사용자 친화적인 에러 메시지를 제공합니다.

```jsx
{error && (
  <div className="error-message" role="alert">
    {error.message || '오류가 발생했습니다.'}
  </div>
)}
```
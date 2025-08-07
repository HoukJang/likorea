import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/common/Loading';
import { useAuth } from './hooks/useAuth';
import { initViewportHandlers } from './utils/viewportUtils';
import './styles/App.css';

// 핵심 컴포넌트는 직접 import
import Banner from './components/Banner';
import GlobalNavigation from './components/GlobalNavigation';

// 페이지 컴포넌트는 lazy loading으로 코드 분할
const Signup = React.lazy(() => import('./components/Signup'));
const Login = React.lazy(() => import('./components/Login'));
const BoardList = React.lazy(() => import('./components/BoardList'));
const BoardPostForm = React.lazy(() => import('./components/BoardPostForm'));
const BoardPostView = React.lazy(() => import('./components/BoardPostView'));
const Admin = React.lazy(() => import('./components/Admin'));
const Profile = React.lazy(() => import('./components/Profile'));
const DesignPreview = React.lazy(() => import('./components/DesignPreview'));
const BotManagement = React.lazy(() => import('./pages/BotManagement'));
const BotForm = React.lazy(() => import('./pages/BotForm'));

// Suspense wrapper for lazy loaded components
const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<Loading />}>
    {children}
  </Suspense>
);

function App() {
  // 전역 인증 상태 관리 - 앱 시작 시 토큰 검증 수행
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // Viewport 설정 초기화 및 이벤트 핸들러 등록
    const cleanup = initViewportHandlers();
    return cleanup;
  }, []);

  // 인증 상태 로딩 중이면 로딩 화면 표시
  if (authLoading) {
    return (
      <ErrorBoundary>
        <div className='App'>
          <Banner />
          <Loading />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className='App'>
          <Banner />
          <GlobalNavigation />
          <Routes>
            {/* 루트 경로를 게시판으로 리다이렉트 */}
            <Route path='/' element={<Navigate to='/boards' replace />} />
            <Route path='/signup' element={<SuspenseWrapper><Signup /></SuspenseWrapper>} />
            <Route path='/login' element={<SuspenseWrapper><Login /></SuspenseWrapper>} />

            {/* 봇 관리 페이지 - 구체적인 경로를 먼저 배치 */}
            <Route path='/bots/new' element={<SuspenseWrapper><BotForm /></SuspenseWrapper>} />
            <Route path='/bots/edit/:botId' element={<SuspenseWrapper><BotForm /></SuspenseWrapper>} />
            <Route path='/bot-management' element={<SuspenseWrapper><BotManagement /></SuspenseWrapper>} />

            {/* 게시판 관련 라우트 */}
            <Route path='/boards' element={<SuspenseWrapper><BoardList /></SuspenseWrapper>} />
            <Route path='/boards/new' element={<SuspenseWrapper><BoardPostForm /></SuspenseWrapper>} />
            <Route path='/boards/:postId' element={<SuspenseWrapper><BoardPostView /></SuspenseWrapper>} />
            <Route path='/boards/:postId/edit' element={<SuspenseWrapper><BoardPostForm /></SuspenseWrapper>} />

            {/* 사용자 관련 라우트 */}
            <Route path='/profile' element={<SuspenseWrapper><Profile /></SuspenseWrapper>} />

            {/* 관리자 페이지 */}
            <Route path='/admin' element={<SuspenseWrapper><Admin /></SuspenseWrapper>} />
            <Route path='/design-preview' element={<SuspenseWrapper><DesignPreview /></SuspenseWrapper>} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

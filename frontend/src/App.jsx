import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/common/Loading';
import { useAuth } from './hooks/useAuth';
import { initViewportHandlers } from './utils/viewportUtils';
import './styles/App.css';

// 즉시 로드할 컴포넌트
import Banner from './components/Banner';
import GlobalNavigation from './components/GlobalNavigation';

// Lazy load 컴포넌트들
const Signup = lazy(() => import('./components/Signup'));
const Login = lazy(() => import('./components/Login'));
const BoardList = lazy(() => import('./components/BoardList'));
const BoardPostForm = lazy(() => import('./components/BoardPostForm'));
const BoardPostView = lazy(() => import('./components/BoardPostView'));
const Admin = lazy(() => import('./components/Admin'));
const Profile = lazy(() => import('./components/Profile'));
const DesignPreview = lazy(() => import('./components/DesignPreview'));
const BotManagement = lazy(() => import('./pages/BotManagement'));
const BotForm = lazy(() => import('./pages/BotForm'));

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
          <Suspense fallback={<Loading />}>
            <Routes>
              {/* 루트 경로를 게시판으로 리다이렉트 */}
              <Route path='/' element={<Navigate to='/boards' replace />} />
              <Route path='/signup' element={<Signup />} />
              <Route path='/login' element={<Login />} />

              {/* 봇 관리 페이지 - 구체적인 경로를 먼저 배치 */}
              <Route path='/bots/new' element={<BotForm />} />
              <Route path='/bots/edit/:botId' element={<BotForm />} />
              <Route path='/bot-management' element={<BotManagement />} />

              {/* 게시판 관련 라우트 */}
              <Route path='/boards' element={<BoardList />} />
              <Route path='/boards/new' element={<BoardPostForm />} />
              <Route path='/boards/:postId' element={<BoardPostView />} />
              <Route path='/boards/:postId/edit' element={<BoardPostForm />} />

              {/* 사용자 관련 라우트 */}
              <Route path='/profile' element={<Profile />} />

              {/* 관리자 페이지 */}
              <Route path='/admin' element={<Admin />} />
              <Route path='/design-preview' element={<DesignPreview />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

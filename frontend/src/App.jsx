import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/common/Loading';
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

function App() {
  useEffect(() => {
    // Viewport 설정 초기화 및 이벤트 핸들러 등록
    const cleanup = initViewportHandlers();
    return cleanup;
  }, []);

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

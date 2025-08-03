import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/common/Loading';
import { useAuth } from './hooks/useAuth';
import { initViewportHandlers } from './utils/viewportUtils';
import './styles/App.css';

// 모든 컴포넌트를 직접 import (chunk loading 오류 해결)
import Banner from './components/Banner';
import GlobalNavigation from './components/GlobalNavigation';
import Signup from './components/Signup';
import Login from './components/Login';
import BoardList from './components/BoardList';
import BoardPostForm from './components/BoardPostForm';
import BoardPostView from './components/BoardPostView';
import Admin from './components/Admin';
import Profile from './components/Profile';
import DesignPreview from './components/DesignPreview';
import BotManagement from './pages/BotManagement';
import BotForm from './pages/BotForm';

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
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

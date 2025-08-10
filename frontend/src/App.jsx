import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/common/Loading';
import { useAuth } from './hooks/useAuth';
import { initViewportHandlers } from './utils/viewportUtils';
import './styles/App.css';
import './styles/accessibility-improvements.css';

// 핵심 컴포넌트는 직접 import
import Banner from './components/Banner';
import GlobalNavigation from './components/GlobalNavigation';

// 자주 사용되는 페이지는 직접 import
import Landing from './pages/Landing';
import Signup from './components/Signup';
import Login from './components/Login';
import BoardList from './components/BoardList';
import BoardPostForm from './components/BoardPostForm';
import BoardPostView from './components/BoardPostView';
import Profile from './components/Profile';

// BotManagement는 직접 import (순환 의존성 문제 해결)
import BotManagement from './pages/BotManagement';

// 관리자 페이지는 lazy loading (React.lazy 사용)
const Admin = React.lazy(() => {
  console.log('[App] Importing Admin component...');
  return import('./components/Admin');
});

const DesignPreview = React.lazy(() => {
  console.log('[App] Importing DesignPreview component...');
  return import('./components/DesignPreview');
});

const BotForm = React.lazy(() => {
  console.log('[App] Importing BotForm component...');
  return import('./pages/BotForm');
});

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
        <div className="App">
          <Banner />
          <Loading />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Banner />
          <GlobalNavigation />
          <Routes>
            {/* 루트 경로를 랜딩 페이지로 설정 */}
            <Route path="/" element={<Landing />} />
            
            {/* 게시판 리스트 페이지 */}
            <Route path="/board" element={<BoardList />} />
            
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />

            {/* 봇 관리 페이지 - 구체적인 경로를 먼저 배치 */}
            <Route path="/bots/new" element={<Suspense fallback={<Loading />}><BotForm /></Suspense>} />
            <Route path="/bots/edit/:botId" element={<Suspense fallback={<Loading />}><BotForm /></Suspense>} />
            <Route path="/bot-management" element={<BotManagement />} />

            {/* 게시판 관련 라우트 */}
            <Route path="/boards" element={<BoardList />} />
            <Route path="/boards/new" element={<BoardPostForm />} />
            <Route path="/boards/:postId" element={<BoardPostView />} />
            <Route path="/boards/:postId/edit" element={<BoardPostForm />} />

            {/* 사용자 관련 라우트 */}
            <Route path="/profile" element={<Profile />} />

            {/* 관리자 페이지 */}
            <Route path="/admin" element={<Suspense fallback={<Loading />}><Admin /></Suspense>} />
            <Route path="/design-preview" element={<Suspense fallback={<Loading />}><DesignPreview /></Suspense>} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
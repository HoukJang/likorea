import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import BoardPostView from './components/BoardPostView';
import Profile from './components/Profile';

// 무거운 컴포넌트들은 lazy loading
const BoardPostForm = lazy(() => import('./components/BoardPostForm')); // Quill 포함
const BotManagement = lazy(() => import('./pages/BotManagement'));
const DesignPreview = lazy(() => import('./components/DesignPreview'));
const BotForm = lazy(() => import('./pages/BotForm'));

// Admin 관련 컴포넌트들을 lazy loading
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminStats = lazy(() => import('./pages/admin/AdminStats'));
const AdminBots = lazy(() => import('./pages/admin/AdminBots'));
const AdminTraffic = lazy(() => import('./pages/admin/AdminTraffic'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));

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
            <Route path="/boards" element={<BoardList />} />

            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />

            {/* 봇 관리 페이지 - 구체적인 경로를 먼저 배치 */}
            <Route path="/bots/new" element={
              <Suspense fallback={<Loading />}>
                <BotForm />
              </Suspense>
            } />
            <Route path="/bots/edit/:botId" element={
              <Suspense fallback={<Loading />}>
                <BotForm />
              </Suspense>
            } />
            <Route path="/bot-management" element={
              <Suspense fallback={<Loading />}>
                <BotManagement />
              </Suspense>
            } />

            {/* 게시판 관련 라우트 */}
            <Route path="/boards" element={<BoardList />} />
            <Route path="/boards/new" element={
              <Suspense fallback={<Loading />}>
                <BoardPostForm />
              </Suspense>
            } />
            <Route path="/boards/:postId" element={<BoardPostView />} />
            <Route path="/boards/:postId/edit" element={
              <Suspense fallback={<Loading />}>
                <BoardPostForm />
              </Suspense>
            } />

            {/* 사용자 관련 라우트 */}
            <Route path="/profile" element={<Profile />} />

            {/* 관리자 페이지 - Nested Routing */}
            <Route path="/admin" element={
              <Suspense fallback={<Loading />}>
                <AdminLayout />
              </Suspense>
            }>
              {/* 기본 경로는 users로 리다이렉트 */}
              <Route index element={<Navigate to="users" replace />} />
              <Route path="users" element={
                <Suspense fallback={<Loading />}>
                  <AdminUsers />
                </Suspense>
              } />
              <Route path="stats" element={
                <Suspense fallback={<Loading />}>
                  <AdminStats />
                </Suspense>
              } />
              <Route path="bots" element={
                <Suspense fallback={<Loading />}>
                  <AdminBots />
                </Suspense>
              } />
              <Route path="traffic" element={
                <Suspense fallback={<Loading />}>
                  <AdminTraffic />
                </Suspense>
              } />
              <Route path="profile" element={
                <Suspense fallback={<Loading />}>
                  <AdminProfile />
                </Suspense>
              } />
            </Route>
            
            <Route path="/design-preview" element={
              <Suspense fallback={<Loading />}>
                <DesignPreview />
              </Suspense>
            } />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
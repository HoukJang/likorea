import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
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
import ProfileLayout from './components/profile/ProfileLayout';
import Messages from './components/message/Messages';
import NotFound from './pages/NotFound';

// 무거운 컴포넌트들은 lazy loading
const BoardPostForm = lazy(() => import('./components/BoardPostForm')); // Quill 포함
const BotManagement = lazy(() => import('./pages/BotManagement'));
const DesignPreview = lazy(() => import('./components/DesignPreview'));
const BotForm = lazy(() => import('./pages/BotForm'));

// Bot Board 시스템 컴포넌트들을 lazy loading
const BotBoard = lazy(() => import('./pages/bot/BotBoard'));
const BotPostCreate = lazy(() => import('./pages/bot/BotPostCreate'));
const BotManagementPage = lazy(() => import('./pages/bot/BotManagementPage'));
const BotConfigForm = lazy(() => import('./pages/bot/BotConfigForm'));

// Admin 관련 컴포넌트들을 lazy loading
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminStats = lazy(() => import('./pages/admin/AdminStats'));
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
      <HelmetProvider>
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

            {/* Bot Board 시스템 라우트 */}
            <Route path="/bot-board" element={
              <Suspense fallback={<Loading />}>
                <BotBoard />
              </Suspense>
            } />
            <Route path="/bot-board/new" element={
              <Suspense fallback={<Loading />}>
                <BotPostCreate />
              </Suspense>
            } />
            <Route path="/bot-board/manage" element={
              <Suspense fallback={<Loading />}>
                <BotManagementPage />
              </Suspense>
            } />
            <Route path="/bot-board/manage/new" element={
              <Suspense fallback={<Loading />}>
                <BotConfigForm />
              </Suspense>
            } />
            <Route path="/bot-board/manage/edit/:botId" element={
              <Suspense fallback={<Loading />}>
                <BotConfigForm />
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

            {/* 쪽지함 독립 라우트 (유지) */}
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/compose" element={<Messages />} />

            {/* 프로필 페이지 - Nested Routing */}
            <Route path="/profile" element={<ProfileLayout />}>
              {/* 기본 경로는 info로 리다이렉트 */}
              <Route index element={<Navigate to="info" replace />} />
              <Route path="info" element={<Profile />} />
              <Route path="messages" element={<Messages />} />
              <Route path="messages/compose" element={<Messages />} />
            </Route>

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
              <Route path="traffic" element={
                <Suspense fallback={<Loading />}>
                  <AdminTraffic />
                </Suspense>
              } />
              <Route path="messages" element={
                <Suspense fallback={<Loading />}>
                  <Messages />
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

            {/* 404 페이지 - 모든 매치되지 않는 경로 처리 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
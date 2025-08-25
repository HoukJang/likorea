import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/common/Loading';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { initViewportHandlers } from './utils/viewportUtils';
import './styles/design-system.css';
import './styles/App.css';
import './styles/accessibility-improvements.css';
import './styles/theme-minimal.css';

// 핵심 컴포넌트는 직접 import
import DynamicBanner from './components/DynamicBanner';
import FloatingActionButton from './components/FloatingActionButton';
import UserMenu from './components/UserMenu';
import ResponsiveHeader from './components/ResponsiveHeader';
import { useMediaQuery, BREAKPOINTS } from './hooks/useMediaQuery';

// 자주 사용되는 페이지는 직접 import
import Landing from './pages/Landing';
import Signup from './components/Signup';
import Login from './components/Login';
import BoardList from './components/BoardList';
import BoardPostView from './components/BoardPostView';
import Profile from './components/Profile';
import Scraps from './components/profile/Scraps';
import Messages from './components/message/Messages';
import NotFound from './pages/NotFound';

// 무거운 컴포넌트들은 lazy loading
const BoardPostForm = lazy(() => import('./components/BoardPostForm')); // Quill 포함
const BotManagement = lazy(() => import('./pages/BotManagement'));
const ButtonDemo = lazy(() => import('./pages/ButtonDemo'));
const DesignPreview = lazy(() => import('./components/DesignPreview'));
const DesignSystemPreview = lazy(() => import('./pages/DesignSystemPreview'));
const BotForm = lazy(() => import('./pages/BotForm'));

// 통합 대시보드 컴포넌트
const Dashboard = lazy(() => import('./components/Dashboard'));

// Bot Board 시스템 컴포넌트들을 lazy loading
const BotBoard = lazy(() => import('./pages/bot/BotBoard'));
const BotPostCreate = lazy(() => import('./pages/bot/BotPostCreate'));
const BotManagementPage = lazy(() => import('./pages/bot/BotManagementPage'));
const BotConfigForm = lazy(() => import('./pages/bot/BotConfigForm'));

// Admin 관련 컴포넌트들을 lazy loading
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminStats = lazy(() => import('./pages/admin/AdminStats'));
const AdminTraffic = lazy(() => import('./pages/admin/AdminTraffic'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));

// App 내부 컴포넌트 - 인증 상태를 사용
function AppContent() {
  // 전역 인증 상태 관리 - 앱 시작 시 토큰 검증 수행
  const { loading: authLoading } = useAuth();

  // 반응형 디자인을 위한 미디어 쿼리
  const isDesktopOrTablet = useMediaQuery(BREAKPOINTS.desktopOrTablet);

  useEffect(() => {
    // Viewport 설정 초기화 및 이벤트 핸들러 등록
    const cleanup = initViewportHandlers();
    return cleanup;
  }, []);

  // 인증 상태 로딩 중이면 로딩 화면 표시
  if (authLoading) {
    return (
      <div className="App">
        <DynamicBanner />
        <Loading />
      </div>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className={`App ${isDesktopOrTablet ? 'with-header' : ''}`}>
        <DynamicBanner />
        {isDesktopOrTablet ? (
          <ResponsiveHeader />
        ) : (
          <>
            <FloatingActionButton />
            <UserMenu />
          </>
        )}
        <Routes>
            {/* 루트 경로를 랜딩 페이지로 설정 */}
            <Route path="/" element={<Landing />} />

            {/* 게시판 리스트 페이지 */}
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

            {/* 쪽지함 독립 라우트 - 대시보드로 리다이렉트 */}
            <Route path="/messages" element={<Navigate to="/dashboard/messages" replace />} />
            <Route path="/messages/compose" element={<Navigate to="/dashboard/messages/compose" replace />} />

            {/* 통합 대시보드 - Nested Routing */}
            <Route path="/dashboard" element={
              <Suspense fallback={<Loading />}>
                <Dashboard />
              </Suspense>
            }>
              {/* 기본 경로는 profile로 리다이렉트 */}
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<Profile />} />
              <Route path="scraps" element={<Scraps />} />
              <Route path="messages" element={<Messages />} />
              <Route path="messages/compose" element={<Messages />} />
              {/* 관리자 전용 라우트 - Dashboard 내부에서 권한 체크 */}
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
              <Route path="banners" element={
                <Suspense fallback={<Loading />}>
                  <AdminBanners />
                </Suspense>
              } />
            </Route>

            {/* 기존 경로 리다이렉트 */}
            <Route path="/profile/*" element={<Navigate to="/dashboard/profile" replace />} />
            <Route path="/admin/*" element={<Navigate to="/dashboard/users" replace />} />

            <Route path="/design-preview" element={
              <Suspense fallback={<Loading />}>
                <DesignPreview />
              </Suspense>
            } />

            {/* Design System Preview */}
            <Route path="/design-system" element={
              <Suspense fallback={<Loading />}>
                <DesignSystemPreview />
              </Suspense>
            } />

            {/* Button Demo Page - Development Only */}
            <Route path="/button-demo" element={
              <Suspense fallback={<Loading />}>
                <ButtonDemo />
              </Suspense>
            } />

            {/* 404 페이지 - 모든 매치되지 않는 경로 처리 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    );
}

// 메인 App 컴포넌트 - AuthProvider로 감싸기
function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Banner from './components/Banner';
import GlobalNavigation from './components/GlobalNavigation';
import Signup from './components/Signup';
import Login from './components/Login';
import BoardList from './components/BoardList';
import BoardPostForm from './components/BoardPostForm';
import BoardPostView from './components/BoardPostView';
import Admin from './components/Admin';
import Profile from './components/Profile';
import ErrorBoundary from './components/ErrorBoundary';
import DesignPreview from './components/DesignPreview';
import './styles/App.css';

function App() {
  useEffect(() => {
    // iPhone 크기 자동 감지 및 설정
    const setViewportForDevice = () => {
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);

      if (isIOS) {
        // iPhone 크기별 viewport 설정
        const screenWidth = window.screen.width;

        let viewportWidth = 'device-width';
        const initialScale = 1;

        // iPhone 모델별 최적화
        if (screenWidth === 428) {
          // iPhone 14 Pro Max, 13 Pro Max
          viewportWidth = '428px';
        } else if (screenWidth === 390) {
          // iPhone 14, 13, 12
          viewportWidth = '390px';
        } else if (screenWidth === 375) {
          // iPhone SE, 12 mini
          viewportWidth = '375px';
        } else if (screenWidth === 414) {
          // iPhone Plus 모델들
          viewportWidth = '414px';
        }

        // viewport 메타 태그 업데이트
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute(
            'content',
            `width=${viewportWidth}, initial-scale=${initialScale}, maximum-scale=1, user-scalable=no, viewport-fit=cover`
          );
        }
      }
    };

    setViewportForDevice();

    // 화면 회전 시 재설정
    window.addEventListener('orientationchange', () => {
      setTimeout(setViewportForDevice, 100);
    });

    // 리사이즈 시 재설정
    window.addEventListener('resize', setViewportForDevice);

    return () => {
      window.removeEventListener('orientationchange', setViewportForDevice);
      window.removeEventListener('resize', setViewportForDevice);
    };
  }, []);

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

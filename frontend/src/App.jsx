import React from 'react';
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
import './styles/App.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Banner />
        <GlobalNavigation />
        <Routes>
          {/* 루트 경로를 게시판으로 리다이렉트 */}
          <Route path="/" element={<Navigate to="/boards" replace />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          
          {/* 게시판 관련 라우트 */}
          <Route path="/boards" element={<BoardList />} />
          <Route path="/boards/new" element={<BoardPostForm />} />
          <Route path="/boards/:postId" element={<BoardPostView />} />
          <Route path="/boards/:postId/edit" element={<BoardPostForm />} />
          
          {/* 사용자 관련 라우트 */}
          <Route path="/profile" element={<Profile />} />
          
          {/* 관리자 페이지 */}
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
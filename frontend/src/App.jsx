import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Banner from './components/Banner';
import Header from './components/Header';
import Home from './pages/Home';
import Signup from './components/Signup';
import Login from './components/Login';
import BoardList from './components/BoardList';
import BoardPostForm from './components/BoardPostForm';
import BoardPostView from './components/BoardPostView';
import Admin from './components/Admin';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/App.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Banner />
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          
          {/* 게시판 관련 라우트 */}
          <Route path="/boards/:boardType" element={<BoardList />} />
          <Route path="/boards/:boardType/new" element={<BoardPostForm />} />
          <Route path="/boards/:boardType/:postId" element={<BoardPostView />} />
          <Route path="/boards/:boardType/:postId/edit" element={<BoardPostForm />} />
          
          {/* 댓글 관련 라우트 (필요한 경우) */}
          {/* 대부분의 경우 댓글은 게시글 페이지 내에서 처리됨 */}
          {/* 댓글 편집을 위한 별도 페이지가 필요하면 아래 주석 해제 */}
          {/* <Route path="/boards/:boardType/:postId/comments/:commentId/edit" element={<CommentEditForm />} /> */}
          
          {/* 관리자 페이지 */}
          <Route path="/admin" element={<Admin />} />
          
          {/* 기타 필요한 라우트 추가 */}
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
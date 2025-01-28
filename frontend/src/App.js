import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles.css';

import Header from './components/Header';
import PostList from './components/PostList';
import NewPost from './components/NewPost';
import EditPost from './components/EditPost';

/** 메인 App 컴포넌트 */
function App() {
  return (
    <Router>
      <Header />
      <div className="container">
        <Routes>
          {/* 게시글 목록 */}
          <Route path="/" element={<PostList />} />
          {/* 새 글 작성 */}
          <Route path="/new" element={<NewPost />} />
          {/* 글 수정 */}
          <Route path="/edit/:id" element={<EditPost />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

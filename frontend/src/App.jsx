import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Signup from './components/Signup';
import Login from './components/Login';
import BoardList from './components/BoardList';
import BoardPostForm from './components/BoardPostForm';
import BoardEditForm from './components/BoardEditForm';
import './styles/App.css';

function App() {
  // Change true or false based on actual login status
  const isLoggedIn = false;

  return (
    <BrowserRouter>
      <header className="banner">
        <h1>
          한국인의, 한국인에 의한, 한국인을 위한 롱아일랜드 생활 정보 커뮤니티 LongIsland Korea
        </h1>
      </header>
      <nav className="main-nav">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/boards/general">일반게시판</Link>
          </li>
          {isLoggedIn ? (
            <li>
              <Link to="/profile">내 정보</Link>
            </li>
          ) : (
            <li>
              <Link to="/login">로그인</Link>
            </li>
          )}
        </ul>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/boards/:boardType" element={<BoardList />} />
        <Route path="/boards/:boardType/new" element={<BoardPostForm />} />
        <Route path="/boards/:boardType/:postId/edit" element={<BoardEditForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
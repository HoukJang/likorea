import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Login.css';
import { BACKEND_URL } from '../config';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('authToken'));

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) {
        throw new Error(`로그인 실패: ${response.status}`);
      }
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('authToken', data.token); // authToken 저장
        setIsLoggedIn(true);
        console.log('로그인 성공, authChange 이벤트 디스패치'); // 로그 추가
        window.dispatchEvent(new Event('authChange')); // Header 업데이트를 위해 이벤트 디스패치
        // window.location.reload();  // 리로딩 제거
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      // ...추가: 에러 메시지 처리...
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    // ...추가: 리다이렉트 혹은 상태 업데이트...
  };

  return (
    <div className="login-container">
      {!isLoggedIn ? (
        <form className="login-box" onSubmit={handleLogin}>
          <h2>로그인</h2>
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn">로그인</button>
          <div className="signup-link">
            아직 회원이 아니신가요? <Link to="/signup">회원가입</Link>
          </div>
        </form>
      ) : (
        <div className="login-box">
          <h2>이미 로그인 하셨습니다.</h2>
          <button type="button" className="login-btn" onClick={handleLogout}>로그아웃</button>
        </div>
      )}
    </div>
  );
}

export default Login;
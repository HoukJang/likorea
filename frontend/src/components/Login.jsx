import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import '../styles/Login.css';

// 권한 레벨에 따른 텍스트 반환 함수
const getAuthorityText = (authority) => {
  return parseInt(authority) === 5 ? '관리자' : '일반 사용자';
};

function Login() {
  const navigate = useNavigate();
  const [id, setId] = useState(''); // 이메일에서 ID로 변경
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!id.trim() || !password) {
      setMessage('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // 백엔드 API 문서에 맞게 업데이트된 로그인 엔드포인트
      const response = await fetch(`${BACKEND_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '로그인 중 오류가 발생했습니다.');
      }

      // 로그인 성공: 토큰과 사용자 정보 저장
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userAuthority', data.user.authority);
      
      // 커스텀 이벤트 발생: 로그인
      window.dispatchEvent(new Event('login'));
      
      const authorityText = getAuthorityText(data.user.authority);
      setMessage(`로그인 성공! ${authorityText} 권한으로 로그인되었습니다. 메인 페이지로 이동합니다.`);
      
      // 홈페이지로 리디렉션
      setTimeout(() => {
        navigate('/');
      }, 2000); // 메시지를 더 오래 표시하기 위해 2초로 증가
      
    } catch (error) {
      setMessage(error.message || '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleSubmit}>
        <h2>로그인</h2>
        <div className="form-group">
          <label htmlFor="id">아이디</label>
          <input
            type="text"
            id="id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            disabled={isLoading}
            placeholder="아이디 입력"
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
            disabled={isLoading}
            placeholder="비밀번호 입력"
          />
        </div>
        <button type="submit" className="login-btn" disabled={isLoading}>
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
        {message && (
          <div className={`message ${message.includes('성공') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
        <div className="signup-link">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </div>
      </form>
    </div>
  );
}

export default Login;
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Signup.css';
import { BACKEND_URL } from '../config';

function Signup() {
  const navigate = useNavigate();
  const [id, setId] = useState(''); // 추가: 사용자 ID 필드
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 기본적인 유효성 검사
    if (!id.trim()) {
      setMessage('ID를 입력해주세요.');
      return;
    }

    if (password !== confirm) {
      setMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setMessage('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // BackendAPI 문서에 맞게 "/api/users" 엔드포인트로 수정
      const response = await fetch(`${BACKEND_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, email, password, authority: 3 })
      });

      const data = await response.json();

      if (!response.ok) {
        // 서버에서 보낸 오류 메시지 표시
        throw new Error(data.message || '회원가입 처리 중 오류가 발생했습니다.');
      }

      // 회원가입 성공
      setMessage('회원가입에 성공했습니다! 로그인 페이지로 이동합니다.');
      
      // 2초 후 로그인 페이지로 리디렉션
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setMessage(error.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-box" onSubmit={handleSubmit}>
        <h2>회원가입</h2>
        <div className="form-group">
          <label htmlFor="id">아이디</label>
          <input
            type="text"
            id="id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            disabled={isLoading}
            placeholder="사용할 아이디 입력11"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            placeholder="이메일 주소 입력"
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
            minLength="6"
            disabled={isLoading}
            placeholder="6자 이상 입력"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirm">비밀번호 확인</label>
          <input
            type="password"
            id="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            disabled={isLoading}
            placeholder="비밀번호 재입력"
          />
        </div>
        <div className="form-group">
          {/* 권한 설정 제거: 기본 일반 사용자 */}
        </div>
        <button type="submit" className="signup-btn" disabled={isLoading}>
          {isLoading ? '처리 중...' : '회원가입'}
        </button>
        {message && <div className={`message ${message.includes('성공') ? 'success' : 'error'}`}>{message}</div>}
        <div className="login-link">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </div>
      </form>
    </div>
  );
}

export default Signup;
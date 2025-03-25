import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Signup.css';
import { BACKEND_URL } from '../config'; // Import backend config

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit triggered'); // Debug: confirms button click
    // 기본적인 비밀번호 확인 처리
    if (password !== confirm) {
      setMessage('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      // 이메일 중복 체크 API 호출 using BACKEND_URL
      const existsResponse = await fetch(`${BACKEND_URL}/api/users/exists?email=${encodeURIComponent(email)}`);
      console.log('existsResponse:', existsResponse); // Debug: confirms response object
      if (!existsResponse.ok) {
        console.error('existsResponse not ok, status:', existsResponse.status);
      }
      // Attempt to parse JSON, fallback to response.text() for debugging
      let existsData;
      try {
        existsData = await existsResponse.json();
      } catch (jsonError) {
        const textData = await existsResponse.text();
        console.error('Failed to parse JSON. Raw response:', textData);
        throw jsonError;
      }
      console.log('existsData:', existsData); // Debug: confirms response data
      if (existsData.exists) {
        setMessage('이미 가입된 이메일입니다.');
        return;
      }
      // 회원가입 처리 로직 구현: 백엔드 API 호출 using BACKEND_URL
      const response = await fetch(`${BACKEND_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) {
        throw new Error('회원가입 실패');
      }
      setMessage('회원가입에 성공했습니다!');
      // ...추가: 리다이렉트 또는 후속 처리...
    } catch (error) {
      setMessage(error.message || '회원가입 중 오류 발생');
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-box" onSubmit={handleSubmit}>
        <h2>회원가입</h2>
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
        <div className="form-group">
          <label htmlFor="confirm">비밀번호 확인</label>
          <input
            type="password"
            id="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="signup-btn">회원가입</button>
        {message && <div className="message">{message}</div>}
        <div className="login-link">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </div>
      </form>
    </div>
  );
}

export default Signup;
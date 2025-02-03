import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Signup.css';
import { API_BASE_URL } from '../config';

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password, passwordConfirm } = formData;

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || '회원가입 실패');
      }

      alert('회원가입에 성공했습니다!');
      navigate('/login'); // 로그인 페이지 경로 (필요에 따라 수정)
    } catch (error) {
      console.error('회원가입 에러:', error);
      setError(error.message);
    }
  };

  return (
    <div className="signup-container">
      <h2>회원가입</h2>
      {error && <p className="error-message">{error}</p>}
      <form className="signup-form" onSubmit={handleSubmit}>
        <label>
          아이디
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          이메일
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          비밀번호
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          비밀번호 확인
          <input
            type="password"
            name="passwordConfirm"
            value={formData.passwordConfirm}
            onChange={handleChange}
            required
          />
        </label>
        <button type="submit">가입하기</button>
      </form>
    </div>
  );
}

export default Signup;
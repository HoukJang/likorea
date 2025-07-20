import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from './common/Button';
import Input from './common/Input';
import '../styles/Login.css';

// 권한 레벨에 따른 텍스트 반환 함수
const getAuthorityText = (authority) => {
  return parseInt(authority) === 5 ? '관리자' : '일반 사용자';
};

function Login() {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuth();
  const [id, setId] = useState(''); // 이메일에서 ID로 변경
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!id.trim() || !password) {
      setMessage('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    clearError();
    setMessage('');

    try {
      const data = await login({ id, password });
      
      const authorityText = getAuthorityText(data.user.authority);
      setMessage(`로그인 성공! ${authorityText} 권한으로 로그인되었습니다. 메인 페이지로 이동합니다.`);
      
      // 홈페이지로 리디렉션
      setTimeout(() => {
        navigate('/');
      }, 2000); // 메시지를 더 오래 표시하기 위해 2초로 증가
      
    } catch (error) {
      let errorMessage = '로그인에 실패했습니다.';
      
      if (error.message) {
        if (error.message.includes('비밀번호가 틀렸습니다')) {
          errorMessage = '비밀번호가 틀렸습니다. 다시 확인해주세요.';
        } else if (error.message.includes('존재하지 않는 사용자')) {
          errorMessage = '존재하지 않는 아이디입니다. 아이디를 확인해주세요.';
        } else if (error.message.includes('입력 정보를 확인해주세요')) {
          errorMessage = '아이디와 비밀번호를 올바르게 입력해주세요.';
        } else if (error.message.includes('토큰이 만료되었습니다')) {
          errorMessage = '로그인이 만료되었습니다. 다시 로그인해주세요.';
        } else if (error.message.includes('인증 토큰이 필요합니다')) {
          errorMessage = '로그인이 필요합니다. 아이디와 비밀번호를 입력해주세요.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setMessage(errorMessage);
    }
  };

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleSubmit}>
        <h2>로그인</h2>
        <div className="form-group">
          <Input
            type="text"
            id="id"
            name="id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            disabled={loading}
            placeholder="아이디 입력"
            label="아이디"
          />
        </div>
        <div className="form-group">
          <Input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            placeholder="비밀번호 입력"
            label="비밀번호"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="large"
          loading={loading}
          disabled={loading}
          className="login-btn"
        >
          로그인
        </Button>
        {(message || error) && (
          <div className={`message ${(message || error).includes('성공') ? 'success' : 'error'}`}>
            {message || error}
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
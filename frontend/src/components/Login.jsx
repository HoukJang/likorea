import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from './common/Button';
import Input from './common/Input';
import '../styles/Login.css';

// 권한 레벨에 따른 텍스트 반환 함수
const getAuthorityText = authority => {
  return parseInt(authority) === 5 ? '관리자' : '일반 사용자';
};

function Login() {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuth();
  const [id, setId] = useState(''); // 이메일에서 ID로 변경
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();

    if (!id.trim() || !password) {
      setMessage('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    clearError();
    setMessage('');

    try {
      await login({ id, password });
      
      // 즉시 홈페이지로 리디렉션 (상태 동기화가 이제 즉시 이루어짐)
      navigate('/');
    } catch (error) {
      let errorMessage = '로그인에 실패했습니다.';

      if (error.message) {
        // 백엔드에서 반환하는 정확한 에러 메시지 매칭
        if (error.message.includes('잘못된 비밀번호입니다')) {
          errorMessage = '비밀번호가 틀렸습니다. 다시 확인해주세요.';
        } else if (error.message.includes('잘못된 아이디입니다')) {
          errorMessage = '존재하지 않는 아이디입니다. 아이디를 확인해주세요.';
        } else if (error.message.includes('아이디와 비밀번호는 필수입니다')) {
          errorMessage = '아이디와 비밀번호를 모두 입력해주세요.';
        } else if (error.message.includes('네트워크')) {
          errorMessage = '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('서버 오류')) {
          errorMessage = '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else {
          // 기타 모든 에러는 그대로 표시 (개발 중에는 정확한 에러 확인을 위해)
          errorMessage = error.message;
        }
      }

      setMessage(errorMessage);
    }
  };

  return (
    <div className='login-container'>
      <form className='login-box' onSubmit={handleSubmit}>
        <h2>로그인</h2>
        <div className='form-group'>
          <Input
            type='text'
            id='id'
            name='id'
            value={id}
            onChange={e => setId(e.target.value)}
            required
            disabled={loading}
            placeholder='아이디 입력'
            label='아이디'
          />
        </div>
        <div className='form-group'>
          <Input
            type='password'
            id='password'
            name='password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
            placeholder='비밀번호 입력'
            label='비밀번호'
          />
        </div>
        <Button
          type='submit'
          variant='primary'
          size='large'
          loading={loading}
          disabled={loading}
          className='login-button'
        >
          로그인
        </Button>
        {(message || error) && (
          <div className={`message ${(message || error).includes('성공') ? 'success' : 'error'}`}>
            {message || error}
          </div>
        )}
        <div className='signup-link'>
          계정이 없으신가요? <Link to='/signup'>회원가입</Link>
        </div>
      </form>
    </div>
  );
}

export default Login;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Signup.css';
import { useApi } from '../hooks/useApi';
import { signup } from '../api/auth';
import Button from './common/Button';
import Input from './common/Input';

function Signup() {
  const navigate = useNavigate();
  const { execute: signupApi, loading, error, clearError } = useApi();
  const [id, setId] = useState(''); // 추가: 사용자 ID 필드
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async e => {
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

    if (password.length < 8) {
      setMessage('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    // 비밀번호 요구사항 검증
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasLowerCase) {
      setMessage('비밀번호는 소문자를 포함해야 합니다.');
      return;
    }

    if (!hasNumbers) {
      setMessage('비밀번호는 숫자를 포함해야 합니다.');
      return;
    }

    clearError();
    setMessage('');

    try {
      const signupData = { id, email, password, authority: 3 };

      await signupApi(() => signup(signupData));

      // 회원가입 성공
      setMessage('회원가입에 성공했습니다! 로그인 페이지로 이동합니다.');

      // 2초 후 로그인 페이지로 리디렉션
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      let errorMessage = '회원가입 중 오류가 발생했습니다.';

      if (error.message) {
        // 백엔드에서 반환하는 정확한 에러 메시지 매칭
        if (error.message.includes('이미 존재하는 아이디입니다')) {
          errorMessage = '이미 사용 중인 아이디입니다. 다른 아이디를 선택해주세요.';
        } else if (error.message.includes('이미 존재하는 이메일입니다')) {
          errorMessage = '이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.';
        } else if (error.message.includes('아이디, 이메일, 비밀번호는 필수입니다')) {
          errorMessage = '모든 필수 항목을 입력해주세요.';
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
    <div className="signup-container">
      <form className="signup-box" onSubmit={handleSubmit}>
        <h2>회원가입</h2>
        <div className="form-group">
          <Input
            type="text"
            id="id"
            name="id"
            value={id}
            onChange={e => setId(e.target.value)}
            required
            disabled={loading}
            placeholder="사용할 아이디 입력"
            label="아이디"
          />
        </div>
        <div className="form-group">
          <Input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
            placeholder="이메일 주소 입력"
            label="이메일"
          />
        </div>
        <div className="form-group">
          <Input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength="8"
            disabled={loading}
            placeholder="8자 이상 입력"
            label="비밀번호"
            helperText="최소 8자 이상, 대문자, 소문자, 숫자, 특수문자를 모두 포함해주세요"
          />
        </div>
        <div className="form-group">
          <Input
            type="password"
            id="confirm"
            name="confirm"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            disabled={loading}
            placeholder="비밀번호 재입력"
            label="비밀번호 확인"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="large"
          loading={loading}
          disabled={loading}
          className="signup-button"
        >
          회원가입
        </Button>
        {(message || error) && (
          <div className={`message ${(message || error).includes('성공') ? 'success' : 'error'}`}>
            {message || error}
          </div>
        )}
        <div className="login-link">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </div>
      </form>
    </div>
  );
}

export default Signup;

import React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/GlobalNavigation.css';

const GlobalNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [fontSize, setFontSize] = useState('14px');

  // 동적 글자 크기 조정
  const adjustFontSize = useCallback(() => {
    const screenWidth = window.innerWidth;
    let newFontSize = '14px';

    if (screenWidth <= 360) {
      newFontSize = '10px';
    } else if (screenWidth <= 480) {
      newFontSize = '11px';
    } else if (screenWidth <= 768) {
      newFontSize = '12px';
    } else {
      newFontSize = '14px';
    }

    setFontSize(newFontSize);
  }, []);

  // 사용자 버튼 스타일 계산
  const userButtonStyle = useMemo(() => {
    if (!user?.id) {
      return { fontSize };
    }

    const userId = user.id;
    const screenWidth = window.innerWidth;
    let userFontSize = fontSize;
    let maxWidth = 'auto';

    // 아이디 길이에 따른 글자 크기 조정
    if (userId.length > 12) {
      // 매우 긴 아이디 (13자 이상)
      if (screenWidth <= 360) {
        userFontSize = '8px';
        maxWidth = '80px';
      } else if (screenWidth <= 480) {
        userFontSize = '9px';
        maxWidth = '90px';
      } else if (screenWidth <= 768) {
        userFontSize = '10px';
        maxWidth = '100px';
      } else {
        userFontSize = '11px';
        maxWidth = '120px';
      }
    } else if (userId.length > 8) {
      // 긴 아이디 (9-12자)
      if (screenWidth <= 360) {
        userFontSize = '9px';
        maxWidth = '85px';
      } else if (screenWidth <= 480) {
        userFontSize = '10px';
        maxWidth = '95px';
      } else if (screenWidth <= 768) {
        userFontSize = '11px';
        maxWidth = '110px';
      } else {
        userFontSize = '12px';
        maxWidth = '130px';
      }
    } else if (userId.length > 5) {
      // 중간 길이 아이디 (6-8자)
      if (screenWidth <= 360) {
        userFontSize = '10px';
        maxWidth = '90px';
      } else if (screenWidth <= 480) {
        userFontSize = '11px';
        maxWidth = '100px';
      } else if (screenWidth <= 768) {
        userFontSize = '12px';
        maxWidth = '120px';
      } else {
        userFontSize = '13px';
        maxWidth = '140px';
      }
    } else {
      // 짧은 아이디 (5자 이하) - 기본 크기 사용
      userFontSize = fontSize;
      maxWidth = 'auto';
    }

    return {
      fontSize: userFontSize,
      maxWidth: maxWidth,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    };
  }, [user?.id, fontSize]);

  // 화면 크기 변경 시 글자 크기 조정
  useEffect(() => {
    adjustFontSize();

    const handleResize = () => {
      adjustFontSize();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 100);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [adjustFontSize]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/');
  }, [logout, navigate]);

  const handleUserClick = useCallback(() => {
    if (user?.authority >= 5) {
      navigate('/admin');
    } else {
      navigate('/profile');
    }
  }, [user?.authority, navigate]);

  // 로그인 페이지에서는 네비게이션 숨기기
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  // 동적 스타일 객체
  const buttonStyle = {
    fontSize: fontSize
  };

  return (
    <nav className="global-navigation">
      <div className="nav-container">
        <div className="nav-left">
          <button
            onClick={() => navigate('/')}
            className="nav-button main-button"
            style={buttonStyle}
            aria-label="게시판으로 이동"
          >
            메인으로
          </button>
          {user && (
            <button
              onClick={() => navigate('/boards/new')}
              className="nav-button write-button"
              style={buttonStyle}
              aria-label="새 게시글 작성"
            >
              ✏️ 글쓰기
            </button>
          )}
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <button
                onClick={handleUserClick}
                className="nav-button user-button"
                style={userButtonStyle}
                aria-label={user.authority >= 5 ? '관리자 페이지로 이동' : '프로필로 이동'}
              >
                {user.authority >= 5 && '👑'} {user.id}
              </button>
              <button
                onClick={handleLogout}
                className="nav-button logout-button"
                style={buttonStyle}
                aria-label="로그아웃"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="nav-button login-button"
                style={buttonStyle}
                aria-label="로그인 페이지로 이동"
              >
                로그인
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="nav-button signup-button"
                style={buttonStyle}
                aria-label="회원가입 페이지로 이동"
              >
                회원가입
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default React.memo(GlobalNavigation);
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, isAuthenticated } from '../api/auth';
import '../styles/GlobalNavigation.css';

function GlobalNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [fontSize, setFontSize] = useState('14px');

  // 로그인 상태 확인
  const checkLoginStatus = () => {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    const userAuthority = localStorage.getItem('userAuthority');
    
    setIsLoggedIn(!!token);
    if (token && userId && userAuthority) {
      setUserInfo({
        id: userId,
        authority: parseInt(userAuthority)
      });
    } else {
      setUserInfo(null);
    }
  };

  // 동적 글자 크기 조정
  const adjustFontSize = () => {
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
  };

  // 라우트 변경, 컴포넌트 마운트 시 로그인 상태 확인
  useEffect(() => {
    checkLoginStatus();
    adjustFontSize();
  }, [location.pathname]);

  // 화면 크기 변경 시 글자 크기 조정
  useEffect(() => {
    const handleResize = () => {
      adjustFontSize();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(adjustFontSize, 100);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // localStorage 변경 이벤트 리스너
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'authToken' || e.key === 'userId' || e.key === 'userAuthority' || e.key === null) {
        checkLoginStatus();
      }
    };

    const handleAuthEvent = () => {
      checkLoginStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('login', handleAuthEvent);
    window.addEventListener('logout', handleAuthEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('login', handleAuthEvent);
      window.removeEventListener('logout', handleAuthEvent);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userAuthority');
    
    setIsLoggedIn(false);
    setUserInfo(null);
    
    window.dispatchEvent(new Event('logout'));
    navigate('/');
  };

  const handleUserClick = () => {
    if (userInfo?.authority >= 5) {
      navigate('/admin');
    } else {
      navigate('/profile');
    }
  };

  // 로그인 페이지에서는 네비게이션 숨기기
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  // 동적 스타일 객체
  const buttonStyle = {
    fontSize: fontSize,
  };

  return (
    <nav className="global-navigation">
      <div className="nav-container">
        <div className="nav-left">
          <button 
            onClick={() => navigate('/boards')}
            className="nav-button main-button"
            style={buttonStyle}
            aria-label="게시판으로 이동"
          >
            메인으로
          </button>
          {isLoggedIn && (
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
          {isLoggedIn ? (
            <>
              <button 
                onClick={handleUserClick}
                className="nav-button user-button"
                style={buttonStyle}
                aria-label={`사용자: ${userInfo?.id}, 권한 레벨: ${userInfo?.authority}`}
              >
                {userInfo?.id} (Lv.{userInfo?.authority})
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
            <button 
              onClick={() => navigate('/login')}
              className="nav-button login-button"
              style={buttonStyle}
              aria-label="로그인 페이지로 이동"
            >
              로그인
            </button>
          )}
        </div>
      </div>
      <div style={{marginTop: '12px', marginBottom: '12px', borderBottom: '1.5px solid #e5e7eb', width: '100%', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto'}} />
    </nav>
  );
}

export default GlobalNavigation; 
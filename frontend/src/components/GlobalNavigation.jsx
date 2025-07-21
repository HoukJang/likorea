import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, isAuthenticated } from '../api/auth';
import '../styles/GlobalNavigation.css';

function GlobalNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

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

  // 라우트 변경, 컴포넌트 마운트 시 로그인 상태 확인
  useEffect(() => {
    checkLoginStatus();
  }, [location.pathname]);

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

  return (
    <nav className="global-navigation">
      <div className="nav-container">
        <div className="nav-left">
          <button 
            onClick={() => navigate('/boards')}
            className="nav-button main-button"
            aria-label="게시판으로 이동"
          >
            메인으로
          </button>
          {isLoggedIn && (
            <button 
              onClick={() => navigate('/boards/new')}
              className="nav-button write-button"
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
                aria-label={`사용자: ${userInfo?.id}, 권한 레벨: ${userInfo?.authority}`}
              >
                {userInfo?.id} (Lv.{userInfo?.authority})
              </button>
              <button 
                onClick={handleLogout}
                className="nav-button logout-button"
                aria-label="로그아웃"
              >
                로그아웃
              </button>
            </>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="nav-button login-button"
              aria-label="로그인 페이지로 이동"
            >
              로그인
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default GlobalNavigation; 
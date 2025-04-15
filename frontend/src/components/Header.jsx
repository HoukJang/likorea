import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Header.css';

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAuthority, setUserAuthority] = useState(0);
  const navigate = useNavigate();
  const location = useLocation(); // Track route changes
  
  // 로그인 상태 확인 함수
  const checkLoginStatus = () => {
    const token = localStorage.getItem('authToken');
    const authority = localStorage.getItem('userAuthority');
    setIsLoggedIn(!!token);
    setUserAuthority(authority ? parseInt(authority) : 0);
  };

  // 라우트 변경, 컴포넌트 마운트 시 로그인 상태 확인
  useEffect(() => {
    checkLoginStatus();
  }, [location.pathname]); // 경로가 변경될 때마다 로그인 상태 확인

  // localStorage 변경 이벤트 리스너
  useEffect(() => {
    // 초기 로그인 상태 확인
    checkLoginStatus();

    // localStorage 변경 이벤트 리스너 (다른 탭/창에서 로그인/로그아웃 시 동기화)
    const handleStorageChange = (e) => {
      if (e.key === 'authToken' || e.key === 'userAuthority' || e.key === null) {
        checkLoginStatus();
      }
    };

    // 사용자 정의 이벤트: 로그인/로그아웃 시 발생
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
    // 로그아웃 처리
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userAuthority');
    
    setIsLoggedIn(false);
    setUserAuthority(0);
    
    // 커스텀 이벤트 발생: 로그아웃
    window.dispatchEvent(new Event('logout'));
    
    // 홈으로 리다이렉트
    navigate('/');
  };

  return (
    <header className="main-header">
      <nav className="main-nav">
        {/* 왼쪽 메뉴 - 왼쪽 정렬 */}
        <ul className="nav-list left-nav">
          <li className="nav-item">
            <Link to="/" className="nav-link">홈</Link>
          </li>
          <li className="nav-item">
            <Link to="/boards/general" className="nav-link">일반 게시판</Link>
          </li>
        </ul>
        
        {/* 오른쪽 메뉴 - 오른쪽 정렬 */}
        <ul className="nav-list right-nav">
          {isLoggedIn ? (
            <>
              {userAuthority >= 5 && (
                <li className="nav-item">
                  <Link to="/admin" className="nav-link admin-link">관리자</Link>
                </li>
              )}
              <li className="nav-item">
                <span className="user-info">
                {localStorage.getItem('userId')} (Lv.{userAuthority})
                </span>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="logout-btn">로그아웃</button>
              </li>
            </>
          ) : (
            <li className="nav-item">
              <Link to="/login" className="auth-link">로그인</Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header;

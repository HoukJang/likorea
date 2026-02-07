import React from 'react';
import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMessage } from '../contexts/MessageContext';
import '../styles/GlobalNavigation.css';

const GlobalNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useMessage();

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

  // 현재 경로 확인을 위한 helper function
  const isActive = (path) => {
    if (path === '/boards') {
      return location.pathname.startsWith('/boards');
    }
    return location.pathname === path;
  };

  return (
    <nav className="global-navigation">
      <div className="nav-container">
        <div className="nav-left">
          <a
            onClick={(e) => {
              e.preventDefault();
              navigate('/boards');
            }}
            className={`nav-link ${isActive('/boards') ? 'active' : ''}`}
            aria-label="게시판으로 이동"
            href="/boards"
          >
            <span className="nav-icon">📋</span>
            <span className="nav-text">게시판</span>
          </a>
          {user && (
            <>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/boards/new');
                }}
                className={`nav-link write-link ${isActive('/boards/new') ? 'active' : ''}`}
                aria-label="새 게시글 작성"
                href="/boards/new"
              >
                <span className="nav-icon">✍️</span>
                <span className="nav-text">글쓰기</span>
              </a>
              {user.authority >= 5 && (
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/bot-board');
                  }}
                  className={`nav-link bot-link ${isActive('/bot-board') ? 'active' : ''}`}
                  aria-label="봇 게시판으로 이동"
                  href="/bot-board"
                >
                  <span className="nav-icon">🤖</span>
                  <span className="nav-text">글쓰기봇</span>
                </a>
              )}
            </>
          )}
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  handleUserClick();
                }}
                className={`nav-link user-link ${isActive('/profile') || isActive('/admin') ? 'active' : ''}`}
                aria-label={user.authority >= 5 ? '관리자 페이지로 이동' : '프로필로 이동'}
                href={user.authority >= 5 ? '/admin' : '/profile'}
              >
                <span className="nav-icon">👤</span>
                <span className="nav-text">
                  {user.id}
                  {unreadCount > 0 && (
                    <span className="nav-badge">{unreadCount}</span>
                  )}
                </span>
              </a>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
                className="nav-link logout-link"
                aria-label="로그아웃"
                href="#"
              >
                <span className="nav-icon">🚪</span>
                <span className="nav-text">로그아웃</span>
              </a>
            </>
          ) : (
            <>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
                className={`nav-link login-link ${isActive('/login') ? 'active' : ''}`}
                aria-label="로그인 페이지로 이동"
                href="/login"
              >
                <span className="nav-icon">🔑</span>
                <span className="nav-text">로그인</span>
              </a>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/signup');
                }}
                className={`nav-link signup-link ${isActive('/signup') ? 'active' : ''}`}
                aria-label="회원가입 페이지로 이동"
                href="/signup"
              >
                <span className="nav-icon">✨</span>
                <span className="nav-text">회원가입</span>
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default React.memo(GlobalNavigation);
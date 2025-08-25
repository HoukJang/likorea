import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUnreadCount } from '../api/message';
import '../styles/UserMenu.css';

const UserMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // 읽지 않은 메시지 수 조회
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user) {
        try {
          const response = await getUnreadCount();
          setUnreadCount(response.data.count || 0);
        } catch (error) {
          console.error('읽지 않은 메시지 수 조회 실패:', error);
        }
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/');
    setIsOpen(false);
  }, [logout, navigate]);

  const handleNavigate = useCallback((path) => {
    navigate(path);
    setIsOpen(false);
  }, [navigate]);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // 로그인/회원가입 페이지에서는 UserMenu 숨기기
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  if (!user) {
    return (
      <div className="auth-float-buttons">
        <button
          className="auth-float-btn login"
          onClick={() => navigate('/login')}
          aria-label="로그인"
        >
          로그인
        </button>
        <button
          className="auth-float-btn signup"
          onClick={() => navigate('/signup')}
          aria-label="회원가입"
        >
          회원가입
        </button>
      </div>
    );
  }

  return (
    <div className="user-menu-float">
      <button
        className="user-menu-trigger-float"
        onClick={toggleMenu}
        aria-label={user.authority >= 5 ? '관리자 메뉴' : '사용자 메뉴'}
        aria-expanded={isOpen}
      >
        <span className="user-avatar-float">
          {user.id.charAt(0).toUpperCase()}
        </span>
        {unreadCount > 0 && (
          <span className="notification-dot-float" aria-label={`${unreadCount}개의 읽지 않은 메시지`} />
        )}
      </button>

      {isOpen && (
        <>
          <div className="menu-backdrop" onClick={() => setIsOpen(false)} />
          <div className="user-dropdown-float">
            <div className="dropdown-header">
              <span className="user-name">{user.id}</span>
              {unreadCount > 0 && (
                <button
                  className="message-count"
                  onClick={() => handleNavigate('/dashboard/messages')}
                >
                  {unreadCount} 새 메시지
                </button>
              )}
            </div>
            <div className="dropdown-divider" />
            <button className="dropdown-item" onClick={() => handleNavigate('/dashboard')}>
              {user.authority >= 5 ? '관리자 대시보드' : '내 정보'}
            </button>
            <button className="dropdown-item" onClick={() => handleNavigate('/dashboard/scraps')}>
              내 스크랩
            </button>
            <button className="dropdown-item" onClick={() => handleNavigate('/dashboard/messages')}>
              쪽지함
            </button>
            {user.authority >= 5 && (
              <button className="dropdown-item" onClick={() => handleNavigate('/bot-board')}>
                봇 관리
              </button>
            )}
            <div className="dropdown-divider" />
            <button className="dropdown-item danger" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(UserMenu);
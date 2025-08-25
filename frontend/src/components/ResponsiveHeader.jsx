import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUnreadCount } from '../api/message';
import '../styles/ResponsiveHeader.css';

const ResponsiveHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // 읽지 않은 메시지 수 조회
  React.useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user) {
        try {
          const response = await getUnreadCount();
          setUnreadCount(response.count || 0);
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
    setIsUserMenuOpen(false);
  }, [logout, navigate]);

  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen(prev => !prev);
  }, []);

  // 로그인/회원가입 페이지에서는 헤더 숨기기
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  return (
    <header className="responsive-header">
      <div className="header-container">
        {/* 로고 */}
        <div className="header-logo" onClick={() => navigate('/')}>
          <span className="logo-text">
            <span className="logo-li">Long Island</span>
            <span className="logo-korea">Korea</span>
          </span>
        </div>

        {/* 네비게이션 */}
        <nav className="header-nav">
          <button
            className={`nav-item ${location.pathname === '/boards' ? 'active' : ''}`}
            onClick={() => navigate('/boards')}
          >
            게시판
          </button>
          {user && (
            <button
              className="nav-item primary"
              onClick={() => navigate('/boards/new')}
            >
              글쓰기
            </button>
          )}
        </nav>

        {/* 사용자 메뉴 */}
        <div className="header-user">
          {!user ? (
            <div className="auth-buttons">
              <button
                className="auth-btn login"
                onClick={() => navigate('/login')}
              >
                로그인
              </button>
              <button
                className="auth-btn signup"
                onClick={() => navigate('/signup')}
              >
                회원가입
              </button>
            </div>
          ) : (
            <div className="user-menu-container">
              <button
                className="user-menu-trigger"
                onClick={toggleUserMenu}
                aria-expanded={isUserMenuOpen}
              >
                <span className="user-avatar">
                  {user.id.charAt(0).toUpperCase()}
                </span>
                <span className="user-name">{user.id}</span>
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>

              {isUserMenuOpen && (
                <>
                  <div className="menu-backdrop" onClick={() => setIsUserMenuOpen(false)} />
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <span className="dropdown-user-name">{user.id}</span>
                      {unreadCount > 0 && (
                        <button
                          className="message-link"
                          onClick={() => {
                            navigate('/dashboard/messages');
                            setIsUserMenuOpen(false);
                          }}
                        >
                          {unreadCount} 새 메시지
                        </button>
                      )}
                    </div>
                    <div className="dropdown-divider" />
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/dashboard');
                        setIsUserMenuOpen(false);
                      }}
                    >
                      {user.authority >= 5 ? '관리자 대시보드' : '내 정보'}
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/dashboard/scraps');
                        setIsUserMenuOpen(false);
                      }}
                    >
                      내 스크랩
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/dashboard/messages');
                        setIsUserMenuOpen(false);
                      }}
                    >
                      쪽지함
                    </button>
                    {user.authority >= 5 && (
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          navigate('/bot-board');
                          setIsUserMenuOpen(false);
                        }}
                      >
                        봇 관리
                      </button>
                    )}
                    <div className="dropdown-divider" />
                    <button
                      className="dropdown-item danger"
                      onClick={handleLogout}
                    >
                      로그아웃
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default React.memo(ResponsiveHeader);
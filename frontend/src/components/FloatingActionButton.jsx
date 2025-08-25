import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/FloatingActionButton.css';

const FloatingActionButton = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleNavigate = useCallback((path) => {
    navigate(path);
    setIsOpen(false);
  }, [navigate]);

  // 로그인/회원가입 페이지와 게시글 보기 페이지에서는 FAB 숨기기
  if (location.pathname === '/login' ||
      location.pathname === '/signup' ||
      location.pathname.match(/^\/boards\/\d+$/)) {  // 게시글 보기 페이지 패턴
    return null;
  }

  return (
    <>
      {/* 좌측 상단 미니 로고 */}
      <button
        className="mini-logo"
        onClick={() => navigate('/')}
        aria-label="홈으로 이동"
      >
        <span className="logo-li">L</span>
        <span className="logo-korea">K</span>
      </button>

      {/* FAB 컨테이너 */}
      <div className={`fab-container ${isOpen ? 'open' : ''}`}>
        {/* FAB 메뉴 아이템들 */}
        <div className="fab-menu">
          <button
            className="fab-menu-item"
            onClick={() => handleNavigate('/boards')}
            aria-label="게시판"
          >
            <span className="fab-icon">📋</span>
            <span className="fab-label">게시판</span>
          </button>

          {user && (
            <button
              className="fab-menu-item accent"
              onClick={() => handleNavigate('/boards/new')}
              aria-label="글쓰기"
            >
              <span className="fab-icon">✏️</span>
              <span className="fab-label">글쓰기</span>
            </button>
          )}
        </div>

        {/* 메인 FAB 버튼 */}
        <button
          className="fab-main"
          onClick={toggleMenu}
          aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={isOpen}
        >
          <span className="fab-main-icon">
            {isOpen ? '✕' : '☰'}
          </span>
        </button>
      </div>
    </>
  );
};

export default React.memo(FloatingActionButton);
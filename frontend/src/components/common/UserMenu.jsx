import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './UserMenu.css';

const UserMenu = ({ username, userId, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // 모바일 감지
  const isMobile = window.innerWidth <= 768;

  // 메뉴 토글
  const toggleMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 버튼 위치 확인하여 dropup 여부 및 위치 결정
    if (buttonRef.current && !isMobile) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // 아래 공간이 200px 미만이고 위 공간이 더 크면 dropup
      const shouldDropUp = spaceBelow < 200 && spaceAbove > spaceBelow;
      setDropUp(shouldDropUp);
      
      // 드롭다운 위치 계산
      setDropdownPosition({
        top: shouldDropUp ? rect.top - 8 : rect.bottom + 8,
        left: rect.left + rect.width / 2
      });
    }
    
    const newState = !isOpen;
    setIsOpen(newState);
    if (onOpenChange) {
      onOpenChange(newState);
    }
  }, [isMobile, isOpen, onOpenChange]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setIsOpen(false);
        if (onOpenChange) {
          onOpenChange(false);
        }
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        if (onOpenChange) {
          onOpenChange(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // 쪽지 보내기
  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (user.id === userId) {
      alert('자신에게는 쪽지를 보낼 수 없습니다.');
      return;
    }

    // 쪽지 작성 페이지로 이동, 수신자 정보 전달
    navigate('/messages/compose', {
      state: {
        recipient: {
          id: userId,
          username: username
        }
      }
    });

    setIsOpen(false);
  }, [user, userId, username, navigate]);

  // 키보드 접근성
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMenu(e);
    }
  }, [toggleMenu]);

  return (
    <div 
      className="user-menu-container"
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseLeave={(e) => e.stopPropagation()}
    >
      <button
        ref={buttonRef}
        className="user-menu-trigger"
        onClick={toggleMenu}
        onKeyDown={handleKeyDown}
        onMouseEnter={(e) => e.stopPropagation()}
        onMouseLeave={(e) => e.stopPropagation()}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`${username} 사용자 메뉴`}
      >
        {username}
      </button>

      {isOpen && ReactDOM.createPortal(
        <>
          {/* 백드롭 - 모바일과 데스크톱 모두 */}
          <div 
            className={`user-menu-backdrop ${isMobile ? 'mobile' : 'desktop'}`}
            onClick={() => {
              setIsOpen(false);
              if (onOpenChange) {
                onOpenChange(false);
              }
            }}
          />
          
          <div
            ref={menuRef}
            className={`user-menu-dropdown ${dropUp ? 'dropup' : ''} ${isMobile ? 'mobile' : ''}`}
            style={!isMobile ? {
              position: 'fixed',
              top: dropUp ? 'auto' : `${dropdownPosition.top}px`,
              bottom: dropUp ? `${window.innerHeight - dropdownPosition.top + 8}px` : 'auto',
              left: `${dropdownPosition.left}px`,
              transform: 'translateX(-50%)'
            } : {}}
            role="menu"
            aria-label="사용자 메뉴"
            onMouseEnter={(e) => e.stopPropagation()}
            onMouseLeave={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {isMobile && (
              <div className="bottom-sheet-header">
                <div className="bottom-sheet-handle" />
                <h3>{username} 님</h3>
              </div>
            )}
            
            <button
              className="user-menu-item"
              onClick={handleSendMessage}
              role="menuitem"
            >
              <span className="menu-icon">✉️</span>
              <span className="menu-text">쪽지 보내기</span>
            </button>
            {/* 나중에 추가할 기능들 */}
            {/*
            <button className="user-menu-item" role="menuitem">
              <span className="menu-icon">👤</span>
              <span className="menu-text">프로필 보기</span>
            </button>
            <button className="user-menu-item" role="menuitem">
              <span className="menu-icon">🚫</span>
              <span className="menu-text">차단하기</span>
            </button>
            */}
            
            {isMobile && (
              <button
                className="user-menu-item cancel-item"
                onClick={() => setIsOpen(false)}
                role="menuitem"
              >
                <span className="menu-text">취소</span>
              </button>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default UserMenu;
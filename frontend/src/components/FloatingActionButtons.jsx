import React, { useState, useEffect } from 'react';
import '../styles/FloatingActionButtons.css';

const FloatingActionButtons = ({
  onScrapToggle,
  isScraped,
  scrapLoading,
  showScrap = true,
  showShare = true,
  showTop = true,
  canModify = false,
  onEdit,
  onDelete
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // 페이지를 조금만 스크롤해도 표시 (모바일에서 바로 보이도록)
      setIsVisible(window.scrollY > 20);
    };

    // 댓글 입력창 포커스 시 숨김 처리
    const handleFocusIn = (e) => {
      if (e.target.classList.contains('comment-textarea') ||
          e.target.classList.contains('comment-edit-textarea')) {
        setIsVisible(false);
        setIsExpanded(false); // 확장된 상태도 닫기
      }
    };

    const handleFocusOut = (e) => {
      if (e.target.classList.contains('comment-textarea') ||
          e.target.classList.contains('comment-edit-textarea')) {
        // 포커스 아웃 후 스크롤 위치 확인하여 다시 표시
        setTimeout(() => {
          if (window.scrollY > 100) {
            setIsVisible(true);
          }
        }, 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    // 초기 상태 체크
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const handleShare = async () => {
    const url = window.location.href;
    const title = document.querySelector('.post-title')?.textContent || '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      // 클립보드에 복사
      navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다!');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`floating-action-container ${isVisible ? 'visible' : ''}`}>
      {/* 메인 FAB 버튼 */}
      <button
        className="fab-main"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="액션 메뉴"
      >
        <span className={`fab-icon ${isExpanded ? 'close' : 'menu'}`}>
          {isExpanded ? '✕' : '⋯'}
        </span>
      </button>

      {/* 액션 버튼들 */}
      <div className={`fab-actions ${isExpanded ? 'expanded' : ''}`}>
        {canModify && onDelete && (
          <button
            className="fab-action fab-delete"
            onClick={onDelete}
            aria-label="삭제"
          >
            <span className="fab-tooltip">삭제</span>
            <span className="fab-icon">🗑️</span>
          </button>
        )}

        {canModify && onEdit && (
          <button
            className="fab-action fab-edit"
            onClick={onEdit}
            aria-label="수정"
          >
            <span className="fab-tooltip">수정</span>
            <span className="fab-icon">✏️</span>
          </button>
        )}

        {showScrap && (
          <button
            className={`fab-action fab-scrap ${isScraped ? 'active' : ''}`}
            onClick={onScrapToggle}
            disabled={scrapLoading}
            aria-label={isScraped ? '스크랩 해제' : '스크랩'}
          >
            <span className="fab-tooltip">{isScraped ? '스크랩 해제' : '스크랩'}</span>
            <span className="fab-icon">📌</span>
          </button>
        )}

        {showShare && (
          <button
            className="fab-action fab-share"
            onClick={handleShare}
            aria-label="공유하기"
          >
            <span className="fab-tooltip">공유</span>
            <span className="fab-icon">🔗</span>
          </button>
        )}

        {showTop && (
          <button
            className="fab-action fab-top"
            onClick={scrollToTop}
            aria-label="맨 위로"
          >
            <span className="fab-tooltip">맨 위로</span>
            <span className="fab-icon">⬆️</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default FloatingActionButtons;
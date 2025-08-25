import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PostActionBar.css';

const PostActionBar = ({
  postId,
  onScrapToggle,
  isScraped,
  scrapLoading,
  showScrap = true,
  user = null,
  canModify = false,
  onEdit,
  onDelete
}) => {
  const navigate = useNavigate();

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

  const handleListClick = () => {
    navigate('/boards');
  };

  return (
    <div className="post-action-bar">
      <div className="action-bar-container">
        <div className="action-bar-left">
          <button
            className="action-bar-button"
            onClick={handleListClick}
            aria-label="목록으로"
          >
            <span className="action-icon">📋</span>
            <span className="action-label">목록</span>
          </button>
        </div>

        <div className="action-bar-center">
          {showScrap && user && (
            <button
              className={`action-bar-button scrap ${isScraped ? 'active' : ''}`}
              onClick={onScrapToggle}
              disabled={scrapLoading}
              aria-label={isScraped ? '스크랩 해제' : '스크랩'}
            >
              <span className="action-icon">📌</span>
              <span className="action-label">
                {scrapLoading ? '처리중' : (isScraped ? '스크랩됨' : '스크랩')}
              </span>
            </button>
          )}
        </div>

        <div className="action-bar-right">
          <button
            className="action-bar-button"
            onClick={handleShare}
            aria-label="공유하기"
          >
            <span className="action-icon">🔗</span>
            <span className="action-label">공유</span>
          </button>

          {canModify && (
            <>
              <button
                className="action-bar-button"
                onClick={onEdit}
                aria-label="수정"
              >
                <span className="action-icon">✏️</span>
                <span className="action-label">수정</span>
              </button>
              <button
                className="action-bar-button danger"
                onClick={onDelete}
                aria-label="삭제"
              >
                <span className="action-icon">🗑️</span>
                <span className="action-label">삭제</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostActionBar;
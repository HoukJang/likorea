import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTagDisplayName, getTagDisplayText } from '../../utils/tagUtils';
import { formatDate, getAuthorId } from '../../utils/dataUtils';
import UserMenu from '../common/UserMenu';

const BoardCards = React.memo(({ posts, tagList, pendingOnly = false, userScrapIds = new Set() }) => {
  const navigate = useNavigate();
  const [openMenuPostId, setOpenMenuPostId] = useState(null);

  const handleCardClick = (e, postId) => {
    // 메뉴 버튼이나 UserMenu를 클릭한 경우는 제외
    if (e.target.closest('.more-button') || e.target.closest('.user-menu-container')) {
      e.preventDefault();
      return;
    }
    
    navigate(pendingOnly ? `/boards/${postId}/edit?pending=true` : `/boards/${postId}`);
  };

  const handleMoreClick = (e, postId) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuPostId(openMenuPostId === postId ? null : postId);
  };

  return (
    <div className="mobile-card-view" role="region" aria-label="게시글 목록 카드">
      {posts.map((post, idx) => {
        const postType =
          tagList && post.tags && post.tags.type
            ? getTagDisplayName(post.tags.type, tagList, 'type')
            : post.type || '일반';
        const postId = post.id || post._id;

        return (
          <div
            key={postId || idx}
            className="mobile-card"
            data-post-type={postType}
            onClick={(e) => handleCardClick(e, postId)}
            style={{ cursor: 'pointer' }}
            aria-label={`게시글 ${post.postNumber}: ${post.title}, 작성자: ${getAuthorId(post.author)}, 조회수: ${post.viewCount ?? 0}`}
          >
            <div className="mobile-card-header">
              <div className="mobile-card-left">
                <span className="mobile-card-category">
                  {tagList && post.tags && post.tags.type
                    ? getTagDisplayName(post.tags.type, tagList, 'type')
                    : post.type || '일반'}
                </span>
                <span className="mobile-card-number">#{post.postNumber}</span>
              </div>
              <span className="mobile-card-views">{post.viewCount ?? 0}</span>
            </div>
            <div className="mobile-card-title">
              {userScrapIds.has(post._id || post.id) && (
                <span style={{ marginRight: '6px', color: '#f59e0b' }} title="스크랩한 글">📌</span>
              )}
              {post.title}
              {pendingOnly && <span style={{ marginLeft: '8px', padding: '2px 6px', backgroundColor: '#ff9800', color: 'white', borderRadius: '4px', fontSize: '0.75em' }}>승인 대기</span>}
              <span className="mobile-comment-count">[{post.commentCount || 0}]</span>
            </div>
            <div className="mobile-card-footer">
              <div className="mobile-card-info">
                <span className="mobile-card-author">
                  {pendingOnly && post.botId?.name ? (
                    <>🤖 {post.botId.name}</>
                  ) : post.author && typeof post.author === 'object' ? (
                    <div onClick={(e) => e.stopPropagation()}>
                      <UserMenu 
                        username={getAuthorId(post.author)}
                        userId={post.author._id || post.author.id}
                      />
                    </div>
                  ) : (
                    getAuthorId(post.author)
                  )}
                </span>
                <span className="mobile-card-region">
                  {tagList && post.tags && post.tags.region
                    ? post.tags.region === '0'
                      ? '전체'
                      : `Exit ${post.tags.region}`
                    : post.region === '0'
                      ? '전체'
                      : post.region
                        ? `Exit ${post.region}`
                        : '전체'}
                </span>
                <span className="mobile-card-date">{formatDate(post.createdAt)}</span>
              </div>
              <button
                className="more-button"
                onClick={(e) => handleMoreClick(e, postId)}
                aria-label="더보기 메뉴"
              >
                ⋮
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
});

BoardCards.displayName = 'BoardCards';

export default BoardCards;
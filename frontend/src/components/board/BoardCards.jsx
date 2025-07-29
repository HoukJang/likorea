import React from 'react';
import { Link } from 'react-router-dom';
import { getTagDisplayName, getTagDisplayText } from '../../utils/tagUtils';
import { formatDate, getAuthorId } from '../../utils/dataUtils';

const BoardCards = React.memo(({ posts, tagList }) => {
  return (
    <div className='mobile-card-view' role='region' aria-label='게시글 목록 카드'>
      {posts.map((post, idx) => {
        const postType =
          tagList && post.tags && post.tags.type
            ? getTagDisplayName(post.tags.type, tagList, 'type')
            : post.type || '일반';

        return (
          <Link
            key={post._id || post.id || idx}
            to={`/boards/${post.id}`}
            className='mobile-card'
            data-post-type={postType}
            style={{ textDecoration: 'none', color: 'inherit' }}
            aria-label={`게시글 ${post.postNumber}: ${post.title}, 작성자: ${getAuthorId(post.author)}, 조회수: ${post.viewCount ?? 0}`}
          >
            <div className='mobile-card-header'>
              <span className='mobile-card-number'>
                {tagList && post.tags && post.tags.type
                  ? getTagDisplayText(post.tags)
                  : post.type || '일반'}
              </span>
              <span className='mobile-card-views'>조회 {post.viewCount ?? 0}</span>
            </div>
            <div className='mobile-card-title'>
              {post.title}
              <span className='mobile-comment-count'>[{post.commentCount || 0}]</span>
            </div>
            <div className='mobile-card-footer'>
              <span className='mobile-card-author'>{getAuthorId(post.author)}</span>
              <span className='mobile-card-region'>
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
              <span className='mobile-card-date'>{formatDate(post.createdAt)}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
});

BoardCards.displayName = 'BoardCards';

export default BoardCards;
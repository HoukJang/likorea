import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTagDisplayName, getTagDisplayText } from '../../utils/tagUtils';
import { formatDate, getAuthorId } from '../../utils/dataUtils';

const BoardTable = React.memo(({ posts, tagList, pendingOnly = false }) => {
  const navigate = useNavigate();

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="table-responsive" role="region" aria-label="게시글 목록 테이블">
      <table className="board-table" role="table" aria-label="게시글 목록">
        <thead>
          <tr>
            <th scope="col" style={{ width: '8%' }}>
              글종류
            </th>
            <th scope="col" style={{ width: '45%' }}>
              제목
            </th>
            <th scope="col" style={{ width: '12%' }}>
              지역
            </th>
            <th scope="col" style={{ width: '12%' }}>
              글쓴이
            </th>
            <th scope="col" style={{ width: '13%' }}>
              날짜
            </th>
            <th scope="col" style={{ width: '10%' }}>
              조회수
            </th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post, idx) => {
            const postType =
              tagList && post.tags && post.tags.type
                ? getTagDisplayName(post.tags.type, tagList, 'type')
                : post.type || '일반';

            return (
              <tr
                key={post._id || post.id || idx}
                role="row"
                tabIndex={0}
                data-post-type={postType}
                aria-label={`게시글 ${post.postNumber}: ${post.title}`}
                onKeyDown={e => handleKeyDown(e, () => navigate(pendingOnly ? `/boards/${post.id || post._id}/edit?pending=true` : `/boards/${post.id}`))}
              >
                <td className="post-number" style={{ textAlign: 'center' }} role="cell">
                  {tagList && post.tags && post.tags.type
                    ? getTagDisplayText(post.tags)
                    : post.type || '일반'}
                </td>
                <td style={{ textAlign: 'left' }} role="cell">
                  <Link
                    to={pendingOnly ? `/boards/${post.id || post._id}/edit?pending=true` : `/boards/${post.id}`}
                    className="post-title"
                    style={{
                      color: 'inherit',
                      textDecoration: 'none'
                    }}
                    aria-label={`게시글 제목: ${post.title}`}
                  >
                    {post.title}
                    {pendingOnly && <span style={{ marginLeft: '8px', padding: '2px 6px', backgroundColor: '#ff9800', color: 'white', borderRadius: '4px', fontSize: '0.75em' }}>승인 대기</span>}
                    <span className="comment-count">[{post.commentCount || 0}]</span>
                  </Link>
                </td>
                <td className="post-region" style={{ textAlign: 'center' }} role="cell">
                  {tagList && post.tags && post.tags.region
                    ? post.tags.region === '0'
                      ? '전체'
                      : `Exit ${post.tags.region}`
                    : post.region === '0'
                      ? '전체'
                      : post.region
                        ? `Exit ${post.region}`
                        : '전체'}
                </td>
                <td className="post-author" style={{ textAlign: 'center' }} role="cell">
                  {pendingOnly && post.botId?.name ? (
                    <span style={{ fontStyle: 'italic' }}>🤖 {post.botId.name}</span>
                  ) : (
                    getAuthorId(post.author)
                  )}
                </td>
                <td className="post-date" style={{ textAlign: 'center' }} role="cell">
                  {formatDate(post.createdAt)}
                </td>
                <td className="post-views" style={{ textAlign: 'center' }} role="cell">
                  {post.viewCount ?? 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

BoardTable.displayName = 'BoardTable';

export default BoardTable;
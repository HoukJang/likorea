import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserScraps } from '../../api/scrap';
import { getTagDisplayText } from '../../utils/tagUtils';
import { formatDate } from '../../utils/dataUtils';
import Loading from '../common/Loading';
import '../../styles/Scraps.css';

function Scraps() {
  const [scraps, setScraps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // 스크랩 목록 조회
  const fetchScraps = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getUserScraps({ page, limit: 20 });
      
      if (response.success) {
        setScraps(response.scraps);
        setCurrentPage(response.currentPage);
        setTotalPages(response.totalPages);
        setTotalCount(response.totalCount);
      }
    } catch (err) {
      console.error('스크랩 목록 조회 실패:', err);
      setError('스크랩 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScraps();
  }, []);

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    fetchScraps(page);
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="scraps-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="scraps-container">
      <div className="scraps-header">
        <h2>스크랩한 글</h2>
        <p className="scraps-count">총 {totalCount}개의 글을 스크랩했습니다.</p>
      </div>

      {scraps.length === 0 ? (
        <div className="empty-scraps">
          <span className="empty-icon">📌</span>
          <p>아직 스크랩한 글이 없습니다.</p>
          <p className="empty-subtitle">관심있는 글을 스크랩해보세요!</p>
        </div>
      ) : (
        <>
          <div className="scraps-list">
            {scraps.map((scrap) => {
              const post = scrap.post;
              if (!post) return null; // 삭제된 게시글

              return (
                <Link
                  key={scrap._id}
                  to={`/boards/${post._id}`}
                  className="scrap-item"
                >
                  <div className="scrap-header-info">
                    <span className="scrap-type">
                      {post.tags ? getTagDisplayText(post.tags) : '일반'}
                    </span>
                    <span className="scrap-date">
                      스크랩: {formatDate(scrap.createdAt)}
                    </span>
                  </div>
                  
                  <h3 className="scrap-title">
                    {post.title}
                    {post.commentCount > 0 && (
                      <span className="comment-count">[{post.commentCount}]</span>
                    )}
                  </h3>
                  
                  <div className="scrap-meta">
                    <span className="scrap-author">
                      작성자: {post.author?.id || '알 수 없음'}
                    </span>
                    <span className="scrap-created">
                      작성일: {formatDate(post.createdAt)}
                    </span>
                    <span className="scrap-views">
                      조회: {post.viewCount || 0}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                이전
              </button>
              
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 2 && page <= currentPage + 2)
                ) {
                  return (
                    <button
                      key={page}
                      className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  );
                }
                if (page === currentPage - 3 || page === currentPage + 3) {
                  return <span key={page}>...</span>;
                }
                return null;
              })}
              
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Scraps;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllScrapsAdmin } from '../../api/scrap';
import { getTagDisplayText } from '../../utils/tagUtils';
import { formatDate } from '../../utils/dataUtils';
import Loading from '../../components/common/Loading';
import '../../styles/AdminScraps.css';

function AdminScraps() {
  const [scraps, setScraps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredScraps, setFilteredScraps] = useState([]);

  // 전체 스크랩 목록 조회 (관리자용)
  const fetchScraps = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getAllScrapsAdmin({ 
        page, 
        limit: 20,
        sortBy,
        sortOrder 
      });
      
      if (response.data.success) {
        setScraps(response.data.scraps);
        setCurrentPage(response.data.currentPage);
        setTotalPages(response.data.totalPages);
        setTotalCount(response.data.totalCount);
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
  }, [sortBy, sortOrder]);

  // 검색 필터링
  useEffect(() => {
    if (searchTerm) {
      const filtered = scraps.filter(scrap => {
        const post = scrap.post;
        const user = scrap.user;
        if (!post || !user) return false;

        const searchLower = searchTerm.toLowerCase();
        return (
          post.title.toLowerCase().includes(searchLower) ||
          user.id.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
        );
      });
      setFilteredScraps(filtered);
    } else {
      setFilteredScraps(scraps);
    }
  }, [searchTerm, scraps]);

  // 정렬 변경 핸들러
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    fetchScraps(page);
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="admin-scraps-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-scraps-container">
      <div className="admin-scraps-header">
        <h2>스크랩 관리</h2>
        <p className="admin-scraps-stats">
          총 {totalCount}개의 스크랩 | 
          {scraps.length > 0 && ` ${new Set(scraps.map(s => s.user?._id)).size}명의 사용자`}
        </p>
      </div>

      {/* 검색 및 필터 */}
      <div className="admin-scraps-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="제목, 사용자 ID, 이메일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="sort-controls">
          <button
            className={`sort-btn ${sortBy === 'createdAt' ? 'active' : ''}`}
            onClick={() => handleSort('createdAt')}
          >
            날짜순 {sortBy === 'createdAt' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            className={`sort-btn ${sortBy === 'postTitle' ? 'active' : ''}`}
            onClick={() => handleSort('postTitle')}
          >
            제목순 {sortBy === 'postTitle' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            className={`sort-btn ${sortBy === 'userId' ? 'active' : ''}`}
            onClick={() => handleSort('userId')}
          >
            사용자순 {sortBy === 'userId' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
        </div>
      </div>

      {filteredScraps.length === 0 ? (
        <div className="empty-scraps">
          <span className="empty-icon">📌</span>
          <p>{searchTerm ? '검색 결과가 없습니다.' : '아직 스크랩된 글이 없습니다.'}</p>
        </div>
      ) : (
        <>
          <div className="admin-scraps-table">
            <table>
              <thead>
                <tr>
                  <th>스크랩 날짜</th>
                  <th>사용자</th>
                  <th>게시글 제목</th>
                  <th>게시글 작성자</th>
                  <th>카테고리</th>
                  <th>조회수</th>
                </tr>
              </thead>
              <tbody>
                {filteredScraps.map((scrap) => {
                  const post = scrap.post;
                  const user = scrap.user;
                  
                  if (!post || !user) return null; // 삭제된 데이터

                  return (
                    <tr key={scrap._id}>
                      <td>{formatDate(scrap.createdAt)}</td>
                      <td>
                        <div className="user-info">
                          <span className="user-id">{user.id}</span>
                          <span className="user-email">{user.email}</span>
                        </div>
                      </td>
                      <td>
                        <Link to={`/boards/${post._id}`} className="post-link">
                          {post.title}
                          {post.commentCount > 0 && (
                            <span className="comment-count">[{post.commentCount}]</span>
                          )}
                        </Link>
                      </td>
                      <td>{post.author?.id || '알 수 없음'}</td>
                      <td>
                        <span className="tag-badge">
                          {post.tags ? getTagDisplayText(post.tags) : '일반'}
                        </span>
                      </td>
                      <td>{post.viewCount || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

export default AdminScraps;
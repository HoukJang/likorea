import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBoards } from '../api/boards';
import { getAllTags } from '../api/tags';
import { processPostsList, formatDate, getAuthorId } from '../utils/dataUtils';
import { getTagDisplayName } from '../utils/tagUtils';
import TagFilter from './TagFilter';
import '../styles/BoardList.css';

function BoardList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(20);
  const [filters, setFilters] = useState({ type: '', region: '' });
  const [isMobile, setIsMobile] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tagList, setTagList] = useState(null);

  // 컴포넌트 마운트 시 postsPerPage를 20으로 강제 설정
  useEffect(() => {
    setPostsPerPage(20);
  }, []);

  // 로그인 상태 확인
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsLoggedIn(!!token);
  }, []);

  // 태그 정보 가져오기
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagResponse = await getAllTags();
        setTagList(tagResponse.tags);
      } catch (error) {
        console.error('태그 정보 조회 오류:', error);
      }
    };
    fetchTags();
  }, []);

  // 화면 크기 변화 감지 및 페이지당 글 개수 조정
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // 모바일 화면 크기 기준
      
      // 화면 크기에 따른 자동 조정 로직 제거
      // 사용자가 선택한 글 개수를 유지
    };
    
    handleResize(); // 초기 설정
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const apiParams = {
          page: currentPage,
          limit: postsPerPage,
          ...filters
        };
        
        const data = await getBoards(apiParams);

        const postsData = data.posts || data;
        
        const processedPosts = processPostsList(postsData);
        
        // 게시글을 수정일(updatedAt) 기준으로 내림차순 정렬
        const sortedPosts = [...processedPosts].sort((a, b) => {
          const dateA = a.updatedAt || a.createdAt;
          const dateB = b.updatedAt || b.createdAt;
          return new Date(dateB) - new Date(dateA);
        });

        setPosts(sortedPosts);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error('게시글 목록 조회 오류:', error);
        setError(error.message || '게시글 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [currentPage, postsPerPage, filters]);

  // const indexOfLast = currentPage * postsPerPage;
  // const indexOfFirst = indexOfLast - postsPerPage;
  // const currentPosts = posts.slice(indexOfFirst, indexOfLast);
  const currentPosts = posts;

  // 페이지당 글 개수 변경 핸들러
  const handlePostsPerPageChange = (e) => {
    const value = parseInt(e.target.value);
    setPostsPerPage(value);
    setCurrentPage(1); // 페이지당 글 개수 변경 시 첫 페이지로 이동
  };

  // 필터 변경 핸들러
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  };

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="board-list-container" role="main" aria-label="게시판 목록">
      {/* 태그 필터 컴포넌트 */}
      <div className="user-controls" role="region" aria-label="사용자 컨트롤">
        <TagFilter 
          onFilterChange={handleFilterChange}
          currentFilters={filters}
        />
      </div>
      
      <div className="posts-per-page-container" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        margin: '20px 0' 
      }} role="region" aria-label="페이지 설정">
        <div>
          <label htmlFor="postsPerPage" style={{ marginRight: '10px', fontSize: '1rem', fontWeight: '600' }}>페이지당 글 개수:</label>
          <select 
            id="postsPerPage" 
            value={postsPerPage} 
            onChange={handlePostsPerPageChange}
            style={{ padding: '8px 12px', fontSize: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}
            aria-label="페이지당 표시할 게시글 개수 선택"
          >
            <option value="20">20개</option>
            <option value="50">50개</option>
            <option value="100">100개</option>
            <option value="200">200개</option>
          </select>
        </div>
        
        {isLoggedIn && (
          <Link 
            to="/boards/new" 
            className="write-btn"
            aria-label="새 게시글 작성"
          >
            ✏️ 글쓰기
          </Link>
        )}
      </div>
      
      {loading ? (
        <div className="loading-container" role="status" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>게시글을 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="error-container" role="alert" aria-live="assertive">
          <p>오류: {error}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state" role="status" aria-live="polite">
          <div className="empty-state-icon" aria-hidden="true">📝</div>
          <p>게시글이 없습니다.</p>
        </div>
      ) : (
        <>
          {/* 데스크톱 테이블 뷰 */}
          <div className="table-responsive" role="region" aria-label="게시글 목록 테이블">
            <table className="board-table" role="table" aria-label="게시글 목록">
              <thead>
                <tr>
                  <th scope="col" style={{ width: "10%" }}>글종류</th>
                  <th scope="col" style={{ width: "50%" }}>제목</th>
                  <th scope="col" style={{ width: "15%" }}>글쓴이</th>
                  <th scope="col" style={{ width: "15%" }}>날짜</th>
                  <th scope="col" style={{ width: "10%" }}>조회수</th>
                </tr>
              </thead>
              <tbody>
                {currentPosts.map((post, idx) => (
                  <tr 
                    key={post._id || post.id || idx}
                    role="row"
                    tabIndex={0}
                    aria-label={`게시글 ${post.postNumber}: ${post.title}`}
                    onKeyDown={(e) => handleKeyDown(e, () => navigate(`/boards/${post.id}`))}
                  >
                    <td className="post-number" style={{ textAlign: "center" }} role="cell">
                      {tagList && post.tags && post.tags.type 
                        ? getTagDisplayName(post.tags.type, tagList, 'type')
                        : (post.type || '일반')}
                    </td>
                    <td style={{ textAlign: "left" }} role="cell">
                      <Link 
                        to={`/boards/${post.id}`} 
                        className="post-title" 
                        style={{ 
                          color: 'inherit', 
                          textDecoration: 'none'
                        }}
                        aria-label={`게시글 제목: ${post.title}`}
                      >
                        {post.title}
                        <span className="comment-count">
                          [{post.commentCount || 0}]
                        </span>
                      </Link>
                    </td>
                    <td className="post-author" style={{ textAlign: "left" }} role="cell">
                      {getAuthorId(post.author)}
                    </td>
                    <td className="post-date" style={{ textAlign: "center" }} role="cell">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="post-views" style={{ textAlign: "center" }} role="cell">
                      {post.viewCount ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 뷰 */}
          <div className="mobile-card-view" role="region" aria-label="게시글 목록 카드">
            {currentPosts.map((post, idx) => (
              <Link 
                key={post._id || post.id || idx} 
                to={`/boards/${post.id}`} 
                className="mobile-card"
                style={{ textDecoration: 'none', color: 'inherit' }}
                aria-label={`게시글 ${post.postNumber}: ${post.title}, 작성자: ${getAuthorId(post.author)}, 조회수: ${post.viewCount ?? 0}`}
              >
                <div className="mobile-card-header">
                  <span className="mobile-card-number">#{post.postNumber}</span>
                  <span className="mobile-card-views">조회 {post.viewCount ?? 0}</span>
                </div>
                <div className="mobile-card-title">
                  {post.title}
                  <span className="mobile-comment-count">
                    [{post.commentCount || 0}]
                  </span>
                </div>
                <div className="mobile-card-footer">
                  <span className="mobile-card-author">{getAuthorId(post.author)}</span>
                  <span className="mobile-card-date">{formatDate(post.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
      
      {totalPages > 1 && (
        <nav className="pagination" role="navigation" aria-label="페이지 네비게이션">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
            aria-label="이전 페이지"
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentPage(i + 1)}
              className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
              aria-label={`${i + 1}페이지로 이동`}
              aria-current={currentPage === i + 1 ? 'page' : undefined}
            >
              {i + 1}
            </button>
          ))}
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
            aria-label="다음 페이지"
          >
            다음
          </button>
        </nav>
      )}
    </div>
  );
}

export default BoardList;
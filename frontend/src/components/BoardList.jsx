import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBoards } from '../api/boards';
import { processPostsList, formatDate, getAuthorId } from '../utils/dataUtils';
import { useErrorHandler } from '../utils/errorHandler';

function BoardList() {
  const { boardType } = useParams();
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(10);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { handleError } = useErrorHandler();

  // 페이지네이션 버튼 스타일 크기 증가
  const paginationButtonStyle = {
    fontSize: "1.1rem", // 글자 크기를 키움
    padding: "8px 12px", // 패딩 증가
    border: "1px solid #ccc",
    background: "#f8f9fa",
    cursor: "pointer",
    borderRadius: "4px", // 모서리 둥글게
    minWidth: "40px", // 최소 너비 설정
    textAlign: "center" // 숫자 중앙 정렬
  };

  // 화면 크기 변화 감지 및 페이지당 글 개수 조정
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
      
      // 화면 높이에 따라 페이지당 글 개수 동적 조정
      const availableHeight = window.innerHeight - 250; // 헤더, 여백 등 고려
      const rowHeight = 40; // 대략적인 행 높이
      const calculatedPostsPerPage = Math.max(5, Math.floor(availableHeight / rowHeight));
      
      setPostsPerPage(calculatedPostsPerPage);
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
        
        const data = await getBoards(boardType);
        const postsData = data.posts || data;

        // 안전한 데이터 처리
        const processedPosts = processPostsList(postsData);
        
        // 게시글을 수정일(updatedAt) 기준으로 내림차순 정렬
        const sortedPosts = [...processedPosts].sort((a, b) => {
          const dateA = a.updatedAt || a.createdAt;
          const dateB = b.updatedAt || b.createdAt;
          return new Date(dateB) - new Date(dateA);
        });

        setPosts(sortedPosts);
        setCurrentPage(1);
      } catch (error) {
        const processedError = handleError(error, '게시글 목록 조회');
        setError(processedError.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [boardType, handleError]);

  const totalPages = Math.ceil(posts.length / postsPerPage);
  const indexOfLast = currentPage * postsPerPage;
  const indexOfFirst = indexOfLast - postsPerPage;
  const currentPosts = posts.slice(indexOfFirst, indexOfLast);

  // 페이지당 글 개수 변경 핸들러
  const handlePostsPerPageChange = (e) => {
    const value = parseInt(e.target.value);
    setPostsPerPage(value);
    setCurrentPage(1); // 페이지당 글 개수 변경 시 첫 페이지로 이동
  };

  return (
    <div className="board-list-container" style={{ 
      maxWidth: "1200px", 
      margin: "0 auto",  // 중앙 정렬
      padding: "0 20px"  // 좌우 패딩 추가
    }}>
      <header className="page-header">
        <h1 style={{ textAlign: "center" }}>
          {boardType === "general" ? "일반" : boardType} 게시판
        </h1>
      </header>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        margin: '20px 0' 
      }}>
        <div>
          <label htmlFor="postsPerPage" style={{ marginRight: '10px' }}>페이지당 글 개수:</label>
          <select 
            id="postsPerPage" 
            value={postsPerPage} 
            onChange={handlePostsPerPageChange}
            style={{ padding: '5px' }}
          >
            <option value="5">5개</option>
            <option value="10">10개</option>
            <option value="15">15개</option>
            <option value="20">20개</option>
          </select>
        </div>
        <Link 
          to={`/boards/${boardType}/new`} 
          style={{ 
            backgroundColor: '#337ab7', 
            color: '#fff', 
            padding: '10px 20px', 
            borderRadius: '4px', 
            textDecoration: 'none', 
            fontWeight: 'bold',
            marginRight: "10px" // 추가된 오른쪽 margin
          }}
        >
          글쓰기
        </Link>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>게시글을 불러오는 중...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
          <p>오류: {error}</p>
        </div>
      ) : posts.length === 0 ? (
        <p>게시글이 없습니다.</p>
      ) : (
        <div className="table-responsive" style={{ overflowX: "auto" }}>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse",
            marginLeft: "auto",  // 테이블 자체에도 좌우 마진 자동
            marginRight: "auto"
          }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                <th style={{ textAlign: "center", padding: "8px", width: "5%" }}>글번호</th>
                <th style={{ textAlign: "center", padding: "8px", width: "50%" }}>제목</th>
                <th style={{ textAlign: "center", padding: "8px", width: "15%" }}>글쓴이</th>
                <th style={{ textAlign: "center", padding: "8px", width: "15%" }}>날짜</th>
                <th style={{ textAlign: "center", padding: "8px", width: "20%" }}>조회수</th>
              </tr>
            </thead>
            <tbody>
              {currentPosts.map((post, idx) => (
                <tr key={post._id || post.id || idx} style={{ borderBottom: "1px solid #ccc" }}>
                  <td style={{ padding: "8px", width: "5%", textAlign: "center" }}>
                    {post.postNumber}
                  </td>
                  <td style={{ padding: "8px", width: "50%", textAlign: "left" }}>
                    <Link to={`/boards/${boardType}/${post.id}`}>{post.title}</Link>
                  </td>
                  <td style={{ padding: "8px", width: "15%", textAlign: "left" }}>
                    {getAuthorId(post.author)}
                  </td>
                  <td style={{ padding: "8px", width: "15%", textAlign: "center" }}>
                    {formatDate(post.createdAt)}
                  </td>
                  <td style={{ padding: "8px", width: "20%", textAlign: "center" }}>
                    {post.viewCount ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{ 
              ...paginationButtonStyle,
              marginRight: "10px",
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentPage(i + 1)}
              style={{ 
                ...paginationButtonStyle,
                margin: "0 5px", 
                fontWeight: currentPage === i + 1 ? "bold" : "normal",
                background: currentPage === i + 1 ? "#e7f1ff" : "#f8f9fa"
              }}
            >
              {i + 1}
            </button>
          ))}
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{ 
              ...paginationButtonStyle,
              marginLeft: "10px",
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default BoardList;
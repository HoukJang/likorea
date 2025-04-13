import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBoards } from '../api/boards';

function BoardList() {
  console.log("BoardList 컴포넌트 마운트");
  const { boardType } = useParams();
  console.log("useParams boardType:", boardType);
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 5;

  useEffect(() => {
    console.log("useEffect 실행 - boardType:", boardType);
    const fetchPosts = async () => {
      try {
        const data = await getBoards(boardType);
        console.log("백엔드에서 반환된 데이터:", data);
        const postsData = data.posts || data;
        setPosts(postsData.slice().reverse());
      } catch (error) {
        console.error("게시글 목록 조회 오류:", error);
      }
    };
    fetchPosts();
  }, [boardType]);

  const totalPages = Math.ceil(posts.length / postsPerPage);
  const indexOfLast = currentPage * postsPerPage;
  const indexOfFirst = indexOfLast - postsPerPage;
  const currentPosts = posts.slice(indexOfFirst, indexOfLast);

  console.log("BoardList 렌더링 - posts 길이:", posts.length);

  return (
    <div>
      <header className="page-header">
        <h1 style={{ textAlign: "center" }}>
          {boardType === "general" ? "일반" : boardType} 게시판
        </h1>
      </header>
      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '20px 0' }}>
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
      {posts.length === 0 ? (
        <p>게시글이 없습니다.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                  {typeof post.author === 'object' ? post.author.email : post.author}
                </td>
                <td style={{ padding: "8px", width: "15%", textAlign: "center" }}>
                  {new Date(post.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: "8px", width: "20%", textAlign: "center" }}>
                  {post.viewCount ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{ marginRight: "10px" }}
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentPage(i + 1)}
              style={{ margin: "0 5px", fontWeight: currentPage === i + 1 ? "bold" : "normal" }}
            >
              {i + 1}
            </button>
          ))}
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{ marginLeft: "10px" }}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default BoardList;
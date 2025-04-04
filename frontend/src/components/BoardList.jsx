import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBoards } from '../api/boards';

function BoardList() {
  console.log("BoardList 컴포넌트 마운트");
  const { boardType } = useParams();
  console.log("useParams boardType:", boardType);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    console.log("useEffect 실행 - boardType:", boardType);
    const fetchPosts = async () => {
      try {
        const data = await getBoards(boardType);
        console.log("게시글 fetch 성공, data:", data);
        setPosts(data);
      } catch (error) {
        console.error("게시글 목록 조회 오류:", error);
      }
    };
    fetchPosts();
  }, [boardType]);

  console.log("BoardList 렌더링 - posts 길이:", posts.length);

  return (
    <div>
      <header className="page-header">
        <h1 style={{ textAlign: "center" }}>
          {boardType === "general" ? "일반" : boardType} 게시판
        </h1>
      </header>
      <div>
        <Link to={`/boards/${boardType}/new`} className="write-btn">글쓰기</Link>
      </div>
      {posts.length === 0 ? (
        <p>게시글이 없습니다.</p>
      ) : (
        <ul>
          {posts.map(post => (
            <li key={post.id}>
              <Link to={`/boards/${boardType}/${post.id}`}>{post.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BoardList;
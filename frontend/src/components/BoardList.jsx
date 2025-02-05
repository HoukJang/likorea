import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function BoardList() {
  const { boardType } = useParams();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/boards/${boardType}`)
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(err => console.error(err));
  }, [boardType]);

  return (
    <div>
      <h2>{boardType === 'free' ? '자유게시판' : '사고팔고 게시판'}</h2>
      <Link to={`/boards/${boardType}/new`}>새 글 작성</Link>
      <table border="1">
        <thead>
          <tr>
            <th>글번호</th>
            <th>제목</th>
            <th>글쓴이</th>
            <th>작성날짜</th>
            <th>조회수</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr key={post._id}>
              <td>{post.postNumber}</td>
              <td>{post.title}</td>
              <td>{post.author.nickname}</td>
              <td>{new Date(post.createdAt).toLocaleDateString()}</td>
              <td>{post.viewCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BoardList;
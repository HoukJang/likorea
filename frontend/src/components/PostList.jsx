import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './PostList.css';
import { API_BASE_URL } from '../config';

function PostList() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/posts`);
        if (!res.ok) throw new Error('게시글 로딩 실패');
        const data = await res.json();
        // 내림차순 정렬: 최신글이 위에 위치
        const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPosts(sortedData);
      } catch (error) {
        console.error(error);
      }
    }
    fetchPosts();
  }, []);

  const handleNewPostClick = () => {
    if (!token) {
      alert('새 글 작성은 로그인이 필요합니다.');
      navigate('/login');
    }
  };

  return (
    <div className="post-list-container">
      <h2>
        자유 게시판
        {token 
          ? <Link to="/new" className="new-post-link">새 글 작성</Link>
          : <button className="new-post-link" onClick={handleNewPostClick}>새 글 작성</button>
        }
      </h2>
      <ul className="post-list">
        <li className="post-list-header">
          <span className="column number">글번호</span>
          <span className="column title">제목</span>
          <span className="column author">글쓴이</span>
          <span className="column date">날짜</span>
          <span className="column views">조회수</span>
        </li>
        {posts.map((post, idx) => (
          <li key={post._id} className="post-item">
            <span className="column number">{posts.length - idx}</span>
            <span className="column title">
              <Link to={`/posts/${post._id}`} className="post-title">
                {post.title}
              </Link>
            </span>
            <span className="column author">{post.author}</span>
            <span className="column date">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
            <span className="column views">{post.viewCount || 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PostList;
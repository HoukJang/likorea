import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './PostList.css';
import { API_BASE_URL } from '../config';

function PostList() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/posts`);
        if (!res.ok) throw new Error('게시글 로딩 실패');
        const data = await res.json();
        setPosts(data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchPosts();
  }, []);

  return (
    <div className="post-list-container">
      <h2>게시글 목록</h2>
      <ul className="post-list">
        {posts.map(post => (
          <li key={post._id} className="post-item">
            <Link to={`/posts/${post._id}`}>
              <h3>{post.title}</h3>
            </Link>
            <p>작성자: {post.author}</p>
            <p>등록일: {new Date(post.createdAt).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PostList;
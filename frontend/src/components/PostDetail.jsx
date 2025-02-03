import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './PostDetail.css';
import { API_BASE_URL } from '../config';

function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/posts/${id}`);
        if (!res.ok) throw new Error('게시글 로딩 실패');
        const data = await res.json();
        setPost(data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchPost();
  }, [id]);

  if (!post) return <div>Loading...</div>;

  return (
    <div className="post-detail-container">
      <h2>{post.title}</h2>
      <p>작성자: {post.author}</p>
      <p>등록일: {new Date(post.createdAt).toLocaleDateString()}</p>
      <div className="post-content">{post.content}</div>
    </div>
  );
}

export default PostDetail;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NewPost.css';
import { API_BASE_URL } from '../config';

function NewPost() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!token) {
      alert('새 글 작성은 로그인이 필요합니다.');
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newPost = { title, content }; // 글쓴이(author) 필드는 제거됨

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newPost),
      });
      if (!res.ok) throw new Error('서버 오류');
      alert('게시글 작성 성공!');
      navigate('/');
    } catch (error) {
      console.error('게시글 작성 실패:', error);
    }
  };

  return (
    <div className="new-post-container">
      <form className="new-post-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>제목:</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>내용:</label>
          <textarea
            rows="10"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <button type="submit" className="submit-button">등록</button>
      </form>
    </div>
  );
}

export default NewPost;
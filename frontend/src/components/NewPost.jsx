import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NewPost.css';
import { API_BASE_URL } from '../config';

function NewPost() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const newPost = { title, author, content };
    console.log('새 게시글 데이터:', newPost);

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });
      if (!res.ok) throw new Error('서버 오류');
      alert('게시글 작성 성공!');
      navigate('/');
    } catch (error) {
      console.error('게시글 작성 실패:', error);
    }
  }

  return (
    <div className="new-post-container">
      <form onSubmit={handleSubmit} className="new-post-form">
        <div className="form-group">
          <label>제목:</label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <label>작성자:</label>
          <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
        <div className="form-group">
          <label>내용:</label>
          <textarea rows="10" required value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <button type="submit" className="submit-button">등록</button>
      </form>
    </div>
  );
}

export default NewPost;
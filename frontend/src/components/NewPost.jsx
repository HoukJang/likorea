

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 백엔드 서버 주소
const BASE_URL = process.env.REACT_APP_API_URL;


function NewPost() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const newPost = { title, author, content };

    try {
      const res = await fetch(BASE_URL, {
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
    <div>
      <h2>새 글 작성</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>제목:</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label>작성자:</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>
        <div>
          <label>내용:</label><br/>
          <textarea
            rows="5"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <button type="submit">등록</button>
      </form>
    </div>
  );
}

export default NewPost;

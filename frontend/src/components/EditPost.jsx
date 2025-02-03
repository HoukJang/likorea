import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EditPost.css';
import { API_BASE_URL } from '../config';

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/posts/${id}`);
        if (!res.ok) throw new Error('게시글 로딩 실패');
        const data = await res.json();
        setTitle(data.title);
        setContent(data.content);
      } catch (error) {
        console.error(error);
      }
    }
    fetchPost();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedPost = { title, content };

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedPost),
      });
      if (!res.ok) throw new Error('게시글 수정 실패');
      alert('게시글이 수정되었습니다.');
      navigate(`/posts/${id}`);
    } catch (error) {
      console.error('게시글 수정 실패:', error);
    }
  };

  return (
    <div className="edit-post-container">
      <form className="edit-post-form" onSubmit={handleSubmit}>
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
        <button type="submit" className="submit-button">수정</button>
      </form>
    </div>
  );
};

export default EditPost;
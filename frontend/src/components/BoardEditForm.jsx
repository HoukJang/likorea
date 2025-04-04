// src/components/BoardEditForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BACKEND_URL } from '../config';

function BoardEditForm() {
  const { boardType, postId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const [post, setPost] = useState(null);
  const currentUser = { username: 'currentUser' }; // Dummy current user; replace with real authentication info

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/boards/${boardType}/${postId}`);
        if (!response.ok) throw new Error('게시글 조회 실패');
        const data = await response.json();
        setPost(data);
        setTitle(data.title);
        setContent(data.content);
      } catch(error) {
        setMessage(error.message);
      }
    };
    fetchPost();
  }, [boardType, postId]);

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (!localStorage.getItem('authToken')) {
      setMessage('로그인 후 수정이 가능합니다.');
      return;
    }
    // Only allow edit if the current user is the author
    if (post && post.author !== currentUser.username) {
      setMessage('자신의 게시글만 수정할 수 있습니다.');
      return;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/boards/${boardType}/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      if (!response.ok) throw new Error('게시글 수정 실패');
      setMessage('게시글이 수정되었습니다.');
      navigate(`/boards/${boardType}/${postId}`);
    } catch(error) {
      setMessage(error.message);
    }
  };

  return (
    <div>
      <h2>{boardType} 게시판 - 게시글 수정</h2>
      {post ? (
        <form onSubmit={handleSubmit}>
          <div>
            <label>제목:</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e)=> setTitle(e.target.value)}
              required 
            />
          </div>
          <div>
            <label>내용:</label>
            <textarea 
              value={content} 
              onChange={(e)=> setContent(e.target.value)}
              required 
            />
          </div>
          <button type="submit">게시글 수정</button>
        </form>
      ) : (
        <p>게시글을 불러오는 중...</p>
      )}
      {message && <p>{message}</p>}
    </div>
  );
}

export default BoardEditForm;
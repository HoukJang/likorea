// src/components/CommentForm.jsx
import React, { useState } from 'react';
import '../styles/CommentForm.css'; // Import the CSS file

function CommentForm({ boardType, postId, onCommentAdded }) {
  const [comment, setComment] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    const author = localStorage.getItem('userEmail');
    try {
      const res = await fetch(`http://localhost:5000/api/boards/${boardType}/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment, author }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('댓글 작성 성공!');
        setComment('');
        onCommentAdded(); // 부모에게 전달해 리스트 업데이트 요청
      } else {
        alert(data.message);
      }
    } catch (error) {
      // 댓글 작성 실패 시 조용히 처리
    }
  };

  return (
    <form className='comment-form' onSubmit={handleSubmit}>
      <div className='form-group'>
        <label className='form-label'>댓글:</label>
        <textarea
          className='comment-textarea'
          value={comment}
          onChange={e => setComment(e.target.value)}
          required
        />
      </div>
      <button type='submit' className='submit-button'>
        댓글 작성
      </button>
    </form>
  );
}

export default CommentForm;

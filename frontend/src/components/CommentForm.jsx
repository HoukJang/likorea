// src/components/CommentForm.jsx
import React, { useState } from 'react';

function CommentForm({ boardType, postId, onCommentAdded }) {
  const [comment, setComment] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const author = "로그인한 사용자의 ID 또는 닉네임"; // 실제 로그인 정보 사용
    try {
      const res = await fetch(`http://localhost:5000/api/boards/${boardType}/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment, author })
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
      console.error('댓글 작성 실패', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>댓글:</label>
        <textarea name="comment" value={comment} onChange={(e) => setComment(e.target.value)} required />
      </div>
      <button type="submit">댓글 작성</button>
    </form>
  );
}

export default CommentForm;
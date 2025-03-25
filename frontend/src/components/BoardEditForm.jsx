// src/components/BoardEditForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function BoardEditForm() {
  const { boardType, postId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', content: '' });

  useEffect(() => {
    // Fetch the post details to prefill the form
    fetch(`http://localhost:5000/api/boards/${boardType}/${postId}`)
      .then(res => res.json())
      .then(data => setForm({ title: data.title, content: data.content }))
      .catch(err => console.error(err));
  }, [boardType, postId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/boards/${boardType}/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        alert('게시글 수정 성공!');
        navigate(`/boards/${boardType}`);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('게시글 수정 실패', error);
    }
  };

  return (
    <div>
      <h2>게시글 수정</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>제목:</label>
          <input type="text" name="title" value={form.title} onChange={handleChange} required />
        </div>
        <div>
          <label>내용:</label>
          <textarea name="content" value={form.content} onChange={handleChange} required />
        </div>
        <button type="submit">수정</button>
      </form>
    </div>
  );
}

export default BoardEditForm;
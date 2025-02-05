import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function BoardPostForm() {
  const { boardType } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', content: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 실제로는 로그인한 사용자의 ID를 사용하거나 토큰을 이용해 인증 후 author 정보를 자동으로 설정합니다.
    const author = "사용자ID_예시";
    try {
      const res = await fetch(`http://localhost:5000/api/boards/${boardType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, author })
      });
      const data = await res.json();
      if (res.ok) {
        alert('게시글 작성 성공!');
        navigate(`/boards/${boardType}`);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('게시글 작성 실패', error);
    }
  };

  return (
    <div>
      <h2>{boardType === 'free' ? '자유게시판' : '사고팔고 게시판'} - 새 글 작성</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>제목:</label>
          <input type="text" name="title" value={form.title} onChange={handleChange} required />
        </div>
        <div>
          <label>내용:</label>
          <textarea name="content" value={form.content} onChange={handleChange} required />
        </div>
        <button type="submit">등록</button>
      </form>
    </div>
  );
}

export default BoardPostForm;
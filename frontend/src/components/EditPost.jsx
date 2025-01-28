import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// 백엔드 서버 주소
const BASE_URL = process.env.REACT_APP_API_URL;

function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');

  // 마운트 시 기존 글 불러오기
  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line
  }, []);

  async function fetchPost() {
    try {
      const res = await fetch(`${BASE_URL}/${id}`);
      if (!res.ok) throw new Error('해당 글을 찾을 수 없음');
      const data = await res.json();
      setTitle(data.title);
      setAuthor(data.author || '');
      setContent(data.content);
    } catch (error) {
      console.error('글 불러오기 실패:', error);
      alert('글을 불러오는 중 오류가 발생했습니다.');
      navigate('/');
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    const updatedPost = { title, author, content };

    try {
      const res = await fetch(`${BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPost),
      });
      if (!res.ok) throw new Error('서버 오류');
      alert('수정 완료!');
      navigate('/');
    } catch (error) {
      console.error('게시글 수정 실패:', error);
    }
  }

  return (
    <div>
      <h2>글 수정</h2>
      <form onSubmit={handleUpdate}>
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
        <button type="submit">수정</button>
      </form>
    </div>
  );
}

export default EditPost;

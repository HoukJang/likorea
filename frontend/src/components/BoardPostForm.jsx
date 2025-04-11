import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BACKEND_URL } from '../config';

function BoardPostForm() {
  const navigate = useNavigate();
  const { boardType } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');

  // 새로 추가: 텍스트를 HTML로 변환하는 함수 (예: 줄바꿈을 <br>로 변환)
  const convertContentToHtml = (text) => {
    return text.replace(/\n/g, '<br>');
  };

  // 새로 추가: 붙여넣기 이벤트 핸들러 (클립보드 이미지 처리)
  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (const index in items) {
      const item = items[index];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onload = function(event) {
          document.execCommand('insertHTML', false, `<img src="${event.target.result}" alt="pasted-image" />`);
        };
        reader.readAsDataURL(file);
        e.preventDefault();
      }
    }
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (!localStorage.getItem('authToken')) {
      setMessage('로그인 후 게시글 생성이 가능합니다.');
      return;
    }
    const email = localStorage.getItem('userEmail');
    console.log(localStorage); // 디버깅용 로그

    try {
      const response = await fetch(`${BACKEND_URL}/api/boards/${boardType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: convertContentToHtml(content), email })
      });
      if (!response.ok) throw new Error('게시글 생성 실패');
      setMessage('게시글이 생성되었습니다!');
      console.log('게시글 생성 성공:', response);
      navigate(`/boards/${boardType}`);
    } catch(error) {
      setMessage(error.message);
    }
  };

  return (
    <div style={{ textAlign: "center", fontSize: "1.2rem", margin: "0 auto", maxWidth: "800px", padding: "0 2rem" }}>
      <h2 style={{ textAlign: "center", fontSize: "2rem" }}>
        {boardType === "general" ? "일반" : boardType} 게시판 - 게시글 생성
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <input 
            type="text" 
            placeholder="제목:" 
            value={title} 
            onChange={(e)=> setTitle(e.target.value)}
            required
            style={{ width: "100%", fontSize: "1.2rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          {/* 기존 textarea를 contentEditable div로 교체 */}
          <div 
            contentEditable
            onInput={(e) => setContent(e.currentTarget.innerHTML)}
            onPaste={handlePaste}
            style={{ width: "100%", minHeight: "500px", fontSize: "1.2rem", border: "1px solid #ccc", padding: "0.5rem", textAlign: "left" }}
          ></div>
        </div>
        <button type="submit" style={{ fontSize: "1.2rem" }}>게시글 생성</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default BoardPostForm;
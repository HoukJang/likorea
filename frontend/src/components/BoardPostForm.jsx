import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import { getBoardPost } from '../api/boards';
import '../styles/BoardPostForm.css';

function BoardPostForm() {
  const navigate = useNavigate();
  const { boardType, postId } = useParams(); // postId is optional for editing
  const isEditMode = Boolean(postId);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const contentRef = useRef(null);

  // If editing, fetch post data and update state
  useEffect(() => {
    if (isEditMode) {
      async function fetchPost() {
        try {
          const data = await getBoardPost(boardType, postId);
          setTitle(data.title);
          setContent(data.content);
          if (contentRef.current) {
            contentRef.current.innerHTML = data.content;
          }
        } catch (error) {
          console.error("게시글 조회 오류:", error);
        }
      }
      fetchPost();
    }
  }, [boardType, postId, isEditMode]);

  // Convert text newlines to <br>
  const convertContentToHtml = (text) => text.replace(/\n/g, '<br>');

  // Handle paste for images
  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (const index in items) {
      const item = items[index];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onload = function(event) {
          const img = document.createElement('img');
          img.src = event.target.result;
          img.alt = "pasted-image";
          img.style.maxWidth = "100%";
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);
            range.setStartAfter(img);
            selection.removeAllRanges();
            selection.addRange(range);
            const target = e.currentTarget || e.target;
            if (target) {
              target.dispatchEvent(new Event('input', { bubbles: true }));
            }
          } else {
            const target = e.currentTarget || e.target;
            if (target) {
              target.appendChild(img);
              target.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }
        };
        reader.readAsDataURL(file);
        e.preventDefault();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!localStorage.getItem('authToken')) {
      setMessage('로그인 후 게시글 생성이 가능합니다.');
      return;
    }
    const email = localStorage.getItem('userEmail');
    const currentContent = contentRef.current ? contentRef.current.innerHTML : content;

    try {
      let response;
      if (isEditMode) {
        // Update existing post
        response = await fetch(`${BACKEND_URL}/api/boards/${boardType}/${postId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content: currentContent, email })
        });
      } else {
        // Create new post
        response = await fetch(`${BACKEND_URL}/api/boards/${boardType}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content: currentContent, email })
        });
      }

      if (!response.ok) throw new Error(isEditMode ? '게시글 수정 실패' : '게시글 생성 실패');
      setMessage(isEditMode ? '게시글이 수정되었습니다!' : '게시글이 생성되었습니다!');
      navigate(`/boards/${boardType}`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">
        {isEditMode ? "게시글 수정" : `${boardType === "general" ? "일반" : boardType} 게시판 - 게시글 생성`}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input 
            type="text" 
            placeholder="제목:" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            required
            className="title-input"
          />
        </div>
        <div className="form-group">
          <div 
            contentEditable
            ref={contentRef}
            onInput={(e) => setContent(e.currentTarget.innerHTML)}
            onPaste={handlePaste}
            className="content-editor"
          ></div>
        </div>
        <button type="submit" className="submit-button">
          {isEditMode ? "수정 완료" : "게시글 생성"}
        </button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default BoardPostForm;
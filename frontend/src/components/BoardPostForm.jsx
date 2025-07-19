import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import { getBoardPost, createBoard, updateBoard } from '../api/boards';
import { getCurrentUser, isAuthenticated } from '../api/auth';
import '../styles/BoardPostForm.css';

function BoardPostForm() {
  const navigate = useNavigate();
  const { boardType, postId } = useParams(); // postId is optional for editing
  const isEditMode = Boolean(postId);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const contentRef = useRef(null);
  const [originalAuthor, setOriginalAuthor] = useState(null); // 원본 게시글 작성자 저장
  const [currentUser, setCurrentUser] = useState(null);

  // 현재 사용자 정보 확인
  useEffect(() => {
    const user = getCurrentUser();
    const authenticated = isAuthenticated();
    
    if (!authenticated || !user) {
      setMessage('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
    
    setCurrentUser(user);
  }, [navigate]);

  // If editing, fetch post data and update state
  useEffect(() => {
    if (isEditMode && currentUser) {
      async function fetchPost() {
        try {
          const data = await getBoardPost(boardType, postId);
          setTitle(data.post.title);
          setContent(data.post.content);
          if (contentRef.current) {
            contentRef.current.innerHTML = data.post.content;
          }
          // 원 작성자 정보 저장
          if (data.post.author) {
            setOriginalAuthor(data.post.author);
          }
        } catch (error) {
          console.error("게시글 조회 오류:", error);
          setMessage('게시글을 불러오는데 실패했습니다.');
        }
      }
      fetchPost();
    }
  }, [boardType, postId, isEditMode, currentUser]);

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
    
    // 로그인 상태 재확인
    if (!isAuthenticated() || !currentUser) {
      setMessage('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
    
    if (!title.trim()) {
      setMessage('제목을 입력해주세요.');
      return;
    }
    
    if (!content.trim()) {
      setMessage('내용을 입력해주세요.');
      return;
    }
    
    const currentContent = contentRef.current ? contentRef.current.innerHTML : content;
    
    try {
      let response;
      if (isEditMode) {
        // Update existing post
        console.log('수정 요청 데이터:', {
          title,
          content: currentContent
        });

        response = await updateBoard(boardType, postId, {
          title,
          content: currentContent
        });
      } else {
        // Create new post
        console.log('생성 요청 데이터:', {
          title,
          content: currentContent
        });

        response = await createBoard(boardType, {
          title,
          content: currentContent
        });
      }

      setMessage(isEditMode ? '게시글이 수정되었습니다!' : '게시글이 생성되었습니다!');
      
      // 게시글 상세 페이지로 이동
      setTimeout(() => {
        navigate(`/boards/${boardType}/${isEditMode ? postId : response.post._id}`);
      }, 1000);
    } catch (error) {
      setMessage(error.message || (isEditMode ? '게시글 수정 실패' : '게시글 생성 실패'));
      console.error('게시글 저장 오류:', error);
    }
  };

  // 로그인되지 않은 경우 로딩 표시
  if (!currentUser) {
    return (
      <div className="form-container">
        <div className="loading">로그인 상태를 확인하는 중...</div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2 className="form-title">
        {isEditMode ? "게시글 수정" : `${boardType === "general" ? "일반" : boardType} 게시판 - 게시글 생성`}
      </h2>
      <div className="user-info">
        작성자: {currentUser.email} (ID: {currentUser.id})
      </div>
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
            placeholder="내용을 입력하세요..."
          ></div>
        </div>
        <button type="submit" className="submit-button">
          {isEditMode ? "수정 완료" : "게시글 생성"}
        </button>
      </form>
      {message && <p className={`message ${message.includes('성공') ? 'success' : 'error'}`}>{message}</p>}
    </div>
  );
}

export default BoardPostForm;
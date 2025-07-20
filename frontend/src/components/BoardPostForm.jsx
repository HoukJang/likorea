import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import { getBoardPost, createBoard, updateBoard } from '../api/boards';
import { getCurrentUser, isAuthenticated } from '../api/auth';
import TagSelector from './TagSelector';
import '../styles/BoardPostForm.css';

function BoardPostForm() {
  const navigate = useNavigate();
  const { postId } = useParams(); // postId is optional for editing
  const isEditMode = Boolean(postId);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState({ type: '', region: '' });
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
          const data = await getBoardPost(postId);
          setTitle(data.post.title);
          setContent(data.post.content);
          setTags(data.post.tags || { type: '', region: '' });
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
  }, [postId, isEditMode, currentUser]);

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
          img.style.height = "auto";
          img.style.margin = "10px 0";
          img.style.display = "block";
          
          const target = e.currentTarget || e.target;
          if (target) {
            // 현재 커서 위치에 이미지 삽입
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              range.insertNode(img);
              range.setStartAfter(img);
              selection.removeAllRanges();
              selection.addRange(range);
            } else {
              // 커서가 없으면 끝에 추가
              target.appendChild(img);
            }
            
            // 입력 이벤트 발생시켜 상태 업데이트
            target.dispatchEvent(new Event('input', { bubbles: true }));
          }
        };
        reader.readAsDataURL(file);
        e.preventDefault();
        return; // 이미지 처리 후 다른 붙여넣기 방지
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
    
    if (!tags.type || !tags.region) {
      setMessage('Type과 Region 태그를 모두 선택해주세요.');
      return;
    }
    
    const currentContent = contentRef.current ? contentRef.current.innerHTML : content;
    
    try {
      let response;
      if (isEditMode) {
        // Update existing post
        console.log('수정 요청 데이터:', {
          title,
          content: currentContent,
          tags
        });

        response = await updateBoard(postId, {
          title,
          content: currentContent,
          tags
        });
      } else {
        // Create new post
        console.log('생성 요청 데이터:', {
          title,
          content: currentContent,
          tags
        });

        response = await createBoard({
          title,
          content: currentContent,
          tags
        });
      }

      // 성공 메시지 제거 - 바로 게시글 상세 페이지로 이동
      
      // 게시글 상세 페이지로 이동
      setTimeout(() => {
        navigate(`/boards/${isEditMode ? postId : response.post._id}`);
      }, 100); // 시간을 100ms로 단축
    } catch (error) {
      console.error('게시글 저장 오류 상세:', error);
      console.error('오류 응답:', error.response);
      console.error('오류 데이터:', error.data);
      
      let errorMessage = '게시글 저장에 실패했습니다.';
      
      if (error.message && error.message !== '입력 정보를 확인해주세요.') {
        errorMessage = error.message;
      } else if (error.data && error.data.error) {
        errorMessage = error.data.error;
      } else if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // 구체적인 에러 메시지로 변환
      if (errorMessage.includes('입력 정보를 확인해주세요')) {
        errorMessage = '입력한 정보에 문제가 있습니다. 제목, 내용, 태그를 다시 확인해주세요.';
      } else if (errorMessage.includes('내용은 1-10000자 사이여야 합니다')) {
        errorMessage = errorMessage; // 백엔드에서 이미 구체적인 메시지 제공
      } else if (errorMessage.includes('제목은 1-100자 사이여야 합니다')) {
        errorMessage = errorMessage; // 백엔드에서 이미 구체적인 메시지 제공
      } else if (errorMessage.includes('Type과 Region 태그를 모두 선택해주세요')) {
        errorMessage = 'Type과 Region 태그를 모두 선택해주세요.';
      } else if (errorMessage.includes('권한이 부족합니다')) {
        errorMessage = '게시글을 수정할 권한이 없습니다. 작성자만 수정할 수 있습니다.';
      } else if (errorMessage.includes('토큰이 만료되었습니다')) {
        errorMessage = '로그인이 만료되었습니다. 다시 로그인해주세요.';
      } else if (errorMessage.includes('인증 토큰이 필요합니다')) {
        errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.';
      }
      
      setMessage(errorMessage);
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
        
        <div className="user-info">
          작성자: {currentUser.id} (ID: {currentUser.id})
        </div>
        
        {/* 태그 선택 컴포넌트 */}
        <div className="form-group">
          <TagSelector 
            selectedTags={tags}
            onTagChange={setTags}
            required={true}
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
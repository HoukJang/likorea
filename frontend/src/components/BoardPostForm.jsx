import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { getBoardPost, createBoard, updateBoard } from '../api/boards';
import { getCurrentUser, isAuthenticated } from '../api/auth';
import { approvePost, rejectPost, updatePendingPost } from '../api/approval';
import TagSelector from './TagSelector';
import { domPurifyConfig } from '../utils/domPurifyConfig';
// Lazy load image compression library
let imageCompression;
const loadImageCompression = async () => {
  if (!imageCompression) {
    const module = await import('browser-image-compression');
    imageCompression = module.default;
  }
  return imageCompression;
};
import '../styles/BoardPostForm.css';

function BoardPostForm() {
  const navigate = useNavigate();
  const { postId } = useParams(); // postId is optional for editing
  const location = useLocation();
  const isEditMode = Boolean(postId);
  const isPendingMode = new URLSearchParams(location.search).get('pending') === 'true';
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState({ type: '', region: '0' });
  const [message, setMessage] = useState('');
  const contentRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // 현재 사용자 정보 확인
  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      const authenticated = await isAuthenticated();

      if (!authenticated || !user) {
        setMessage('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      setCurrentUser(user);
    };
    
    checkAuth();
  }, [navigate]);

  // If editing, fetch post data and update state
  useEffect(() => {
    if (isEditMode && currentUser) {
      const fetchPost = async () => {
        try {
          const data = await getBoardPost(postId);
          setTitle(data.post.title);
          setContent(data.post.content);
          setTags(data.post.tags || { type: '', region: '0', subcategory: '' });
          if (contentRef.current) {
            // DOMPurify로 HTML을 새니타이즈하여 안전하게 표시
            const sanitizedContent = DOMPurify.sanitize(data.post.content, domPurifyConfig);
            contentRef.current.innerHTML = sanitizedContent;
          }
          // 원 작성자 정보는 현재 사용하지 않음
        } catch (error) {
          setMessage('게시글을 불러오는데 실패했습니다.');
        }
      }
      fetchPost();
    }
  }, [postId, isEditMode, currentUser]);

  // 이미지 압축 설정
  const compressionOptions = {
    maxSizeMB: 1, // 최대 1MB로 압축
    maxWidthOrHeight: 1920, // 최대 너비/높이 1920px
    useWebWorker: true,
    quality: 0.8, // 품질 80%
  };

  // Handle paste for images
  const handlePaste = async e => {
    // 먼저 이미지가 있는지 확인
    const items = e.clipboardData.items;
    let hasImage = false;
    
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        hasImage = true;
        break;
      }
    }
    
    // 이미지가 있으면 기본 동작 방지
    if (hasImage) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    for (const index in items) {
      const item = items[index];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        
        try {
          // 이미지 압축 라이브러리 동적 로드
          const compress = await loadImageCompression();
          const compressedFile = await compress(file, compressionOptions);
          
          const reader = new FileReader();
          reader.onload = function (event) {
            const img = document.createElement('img');
            img.src = event.target.result;
            img.alt = 'pasted-image';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '600px';
            img.style.width = 'auto';
            img.style.height = 'auto';
            img.style.margin = '10px auto';
            img.style.display = 'block';
            img.style.objectFit = 'contain';
            
            console.log('Image created with src:', img.src.substring(0, 100) + '...');
            console.log('Image src starts with data:', img.src.startsWith('data:'));

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
          reader.readAsDataURL(compressedFile); // 압축된 파일을 읽음
        } catch (error) {
          alert('이미지 압축 중 오류가 발생했습니다. 원본 이미지가 너무 큽니다.');
        }
        return; // 이미지 처리 후 다른 붙여넣기 방지
      }
    }
  };

  // 승인 처리
  const handleApprove = async () => {
    if (!window.confirm('이 게시글을 승인하시겠습니까?')) return;

    try {
      setLoading(true);
      setMessage('');
      
      // 내용이 수정되었다면 먼저 업데이트
      if (isPendingMode && isEditMode) {
        const rawContent = contentRef.current ? contentRef.current.innerHTML : content;
        const sanitizedContent = DOMPurify.sanitize(rawContent, domPurifyConfig);

        await updatePendingPost(postId, {
          title,
          content: sanitizedContent,
          tags,
        });
      }
      
      // 승인 처리
      await approvePost(postId);
      setMessage('게시글이 승인되었습니다.');
      setTimeout(() => {
        navigate('/admin');
      }, 1000);
    } catch (error) {
      let errorMessage = '게시글 승인에 실패했습니다.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 거절 처리
  const handleReject = async () => {
    const reason = window.prompt('거절 사유를 입력하세요 (선택사항):');
    if (reason === null) return; // 취소 클릭

    try {
      setLoading(true);
      setMessage('');
      await rejectPost(postId, reason);
      setMessage('게시글이 거절되었습니다.');
      setTimeout(() => {
        navigate('/admin');
      }, 1000);
    } catch (error) {
      let errorMessage = '게시글 거절에 실패했습니다.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // 로그인 상태 재확인
    const authenticated = await isAuthenticated();
    if (!authenticated || !currentUser) {
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

    if (!tags.type) {
      setMessage('글종류 태그를 선택해주세요.');
      return;
    }

    // HTML 컨텐츠를 새니타이즈
    const rawContent = contentRef.current ? contentRef.current.innerHTML : content;
    console.log('Raw content before sanitization:', rawContent);
    const sanitizedContent = DOMPurify.sanitize(rawContent, domPurifyConfig);
    console.log('Sanitized content:', sanitizedContent);
    console.log('Has data: URLs after sanitization:', sanitizedContent.includes('data:image'));

    try {
      let response;
      if (isEditMode) {
        // Update existing post
        response = await updateBoard(postId, {
          title,
          content: sanitizedContent,
          tags,
        });
      } else {
        // Create new post
        response = await createBoard({
          title,
          content: sanitizedContent,
          tags,
        });
      }

      // 성공 메시지 제거 - 바로 게시글 상세 페이지로 이동

      // 게시글 상세 페이지로 이동
      setTimeout(() => {
        navigate(`/boards/${isEditMode ? postId : response.post._id}`);
      }, 100); // 시간을 100ms로 단축
    } catch (error) {
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

      // 백엔드 에러 메시지에 따른 사용자 친화적 메시지 변환
      if (errorMessage.includes('로그인이 필요합니다')) {
        errorMessage = '로그인이 만료되었습니다. 다시 로그인해주세요.';
      } else if (errorMessage.includes('권한이 없습니다')) {
        errorMessage = '게시글을 수정할 권한이 없습니다. 작성자만 수정할 수 있습니다.';
      } else if (errorMessage.includes('게시글을 찾을 수 없습니다')) {
        errorMessage = '게시글을 찾을 수 없습니다. 삭제되었거나 잘못된 링크일 수 있습니다.';
      } else if (errorMessage.includes('네트워크')) {
        errorMessage = '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
      } else if (errorMessage.includes('서버 오류')) {
        errorMessage = '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }

      setMessage(errorMessage);
    }
  };

  // 로그인되지 않은 경우 로딩 표시
  if (!currentUser) {
    return (
      <div className='form-container'>
        <div className='loading'>로그인 상태를 확인하는 중...</div>
      </div>
    );
  }

  return (
    <div className='form-container'>
      <form onSubmit={handleSubmit}>
        <div className='form-group'>
          <input
            type='text'
            placeholder='제목:'
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className='title-input'
          />
          {isPendingMode && (
            <span style={{ 
              marginLeft: '10px', 
              padding: '4px 8px', 
              backgroundColor: '#ff9800', 
              color: 'white', 
              borderRadius: '4px', 
              fontSize: '0.9em',
              display: 'inline-block'
            }}>
              승인 대기
            </span>
          )}
        </div>

        {/* 태그 선택 컴포넌트 */}
        <div className='form-group'>
          <TagSelector selectedTags={tags} onTagChange={setTags} required={true} />
        </div>

        <div className='form-group'>
          <div
            contentEditable
            ref={contentRef}
            onInput={e => setContent(e.currentTarget.innerHTML)}
            onPaste={handlePaste}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.execCommand('insertParagraph');
              }
            }}
            className='content-editor'
            placeholder='내용을 입력하세요...'
          ></div>
        </div>
        {isPendingMode ? (
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              type='button' 
              onClick={handleApprove}
              className='submit-button'
              style={{ backgroundColor: '#4caf50' }}
              disabled={loading}
            >
              {loading ? '처리 중...' : '승인'}
            </button>
            <button 
              type='button' 
              onClick={handleReject}
              className='submit-button'
              style={{ backgroundColor: '#f44336' }}
              disabled={loading}
            >
              {loading ? '처리 중...' : '거절'}
            </button>
          </div>
        ) : (
          <button type='submit' className='submit-button' disabled={loading}>
            {loading ? '처리 중...' : (isEditMode ? '수정 완료' : '게시글 생성')}
          </button>
        )}
      </form>
      {message && (
        <p className={`message ${message.includes('성공') ? 'success' : 'error'}`}>{message}</p>
      )}
    </div>
  );
}

export default BoardPostForm;

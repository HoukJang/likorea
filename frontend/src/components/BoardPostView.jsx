import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  getBoardPost, 
  deleteBoard, 
  addComment, 
  deleteComment, 
  updateComment,
  getComments
} from '../api/boards';
import { getUser } from '../api/auth';
import { getAllTags } from '../api/tags';
import { processPostData, processCommentsList, formatDate, getAuthorId } from '../utils/dataUtils';
import { createTagDisplayData } from '../utils/tagUtils';
import { usePermission } from '../hooks/usePermission';
import { useErrorHandler } from '../utils/errorHandler';
import '../styles/BoardPostView.css';

function BoardPostView() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [canModify, setCanModify] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tagList, setTagList] = useState(null);
  
  const { canModify: checkCanModify } = usePermission();
  const { handleError } = useErrorHandler();

  // 게시글과 댓글을 함께 불러오는 함수 업데이트
  const fetchPostAndComments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 태그 정보 가져오기
      const tagResponse = await getAllTags();
      setTagList(tagResponse.tags);
      
      // 게시글 데이터 가져오기
      const response = await getBoardPost(postId);
      console.log('API 응답 데이터:', response);
      
      // API 응답에서 post 필드 추출
      const data = response.post || response;
      console.log('추출된 게시글 데이터:', data);
      
      const processedPost = processPostData(data);
      console.log('처리된 게시글 데이터:', processedPost);
      
      setPost(processedPost);
      
      // 댓글 데이터 별도로 가져오기
      try {
        const commentsData = await getComments(postId);
        const processedComments = processCommentsList(commentsData.comments || commentsData);
        setComments(processedComments);
      } catch (commentError) {
        const processedError = handleError(commentError, '댓글 로드');
        console.error("댓글 로드 중 오류:", processedError);
        
        // 댓글 로드 실패 시 게시글의 댓글 데이터 사용 시도
        if (data.comments && Array.isArray(data.comments)) {
          const fallbackComments = processCommentsList(data.comments);
          setComments(fallbackComments);
        } else {
          setComments([]);
        }
      }
      
      // 권한 확인
      checkEditDeletePermission(processedPost);
    } catch (error) {
      const processedError = handleError(error, '게시글 조회');
      setError(processedError.message);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 또는 페이지 이동 시 데이터 로드
  useEffect(() => {
    fetchPostAndComments();
  }, [postId]);

  // 필요할 때 데이터 새로고침
  useEffect(() => {
    if (isRefreshing) {
      fetchPostAndComments();
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const checkEditDeletePermission = (postData) => {
    if (!postData) {
      setCanModify(false);
      return;
    }
    
    const canModifyPost = checkCanModify(postData);
    setCanModify(canModifyPost);
  };

  const handleDelete = async () => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        const userId = localStorage.getItem('userId');
        await deleteBoard(postId, userId);
        navigate('/boards');
      } catch (error) {
        console.error("게시글 삭제 실패:", error);
        alert("삭제 권한이 없거나 오류가 발생했습니다.");
      }
    }
  };

  // 댓글 수정/삭제 권한 확인 함수
  const canModifyComment = (comment) => {
    return checkCanModify(comment);
  };

  // 작성자 정보 추출 함수는 dataUtils에서 가져온 함수 사용

  // 댓글 작성 핸들러 - API 문서에 맞게 업데이트
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }
    
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      alert('로그인 후 댓글을 작성할 수 있습니다.');
      return;
    }

    const userId = localStorage.getItem('userId');
    const userAuthority = localStorage.getItem('userAuthority');
    
    console.log('댓글 작성 시도 - 사용자 ID:', userId, '권한 레벨:', userAuthority);
    console.log('인증 토큰 존재:', !!authToken);
    console.log('토큰 일부:', authToken ? authToken.substring(0, 20) + '...' : '없음');
    
    try {
      setLoading(true);
      // API 문서에 맞게 요청 데이터 구성
      const response = await addComment(postId, {
        content: commentText,  // 댓글 내용
        id: userId             // 사용자 ID
      });
      
      console.log("댓글 작성 응답:", response);
      
      if (response && response.comment) {

        // 입력 필드 초기화
        setCommentText('');
        
        fetchPostAndComments();
      } else {
        // 응답에 댓글 정보가 없는 경우 전체 데이터 다시 로드
        fetchPostAndComments();
      }
    } catch (error) {
      console.error("댓글 작성 오류:", error);
      console.error("댓글 작성 오류 상세:", {
        message: error.message,
        originalError: error.originalError,
        response: error.response,
        data: error.data,
        status: error.response?.status
      });
      
      let errorMessage = '댓글 작성에 실패했습니다.';
      
      // originalError 확인
      const originalError = error.originalError || error.message;
      
      if (originalError && typeof originalError === 'string') {
        if (originalError.includes('토큰이 만료되었습니다') || 
            originalError.includes('jwt expired') ||
            originalError.includes('접근 권한이 없습니다')) {
          errorMessage = '로그인이 만료되었습니다. 다시 로그인해주세요.';
          // 로그아웃 처리
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userAuthority');
          // 로그인 페이지로 리다이렉트
          navigate('/login');
          return;
        } else if (originalError.includes('댓글 내용과 사용자 ID는 필수입니다')) {
          errorMessage = '댓글 내용과 사용자 정보가 필요합니다. 다시 시도해주세요.';
        } else if (originalError.includes('댓글 내용은 1-1000자 사이여야 합니다')) {
          errorMessage = originalError; // 백엔드에서 이미 구체적인 메시지 제공
        } else if (originalError.includes('권한이 부족합니다')) {
          errorMessage = '댓글을 작성할 권한이 없습니다.';
        } else if (originalError.includes('인증 토큰이 필요합니다')) {
          errorMessage = '로그인이 필요합니다. 댓글을 작성하려면 로그인해주세요.';
        } else if (originalError.includes('사용자를 찾을 수 없습니다')) {
          errorMessage = '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.';
        } else if (error.message && error.message !== '입력 정보를 확인해주세요.') {
          errorMessage = error.message;
        } else {
          errorMessage = originalError;
        }
      } else if (error.message && error.message !== '입력 정보를 확인해주세요.') {
        errorMessage = error.message;
      } else {
        // 기본 에러 메시지
        errorMessage = '댓글 작성 중 오류가 발생했습니다. 다시 시도해주세요.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id || comment._id);
    setEditCommentText(comment.content);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  // 댓글 수정 저장 - API 문서에 맞게 업데이트
  const handleUpdateComment = async (commentId) => {
    if (!editCommentText.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      
      // API 문서에 맞게 요청 데이터 구성
      const response = await updateComment(postId, commentId, {
        content: editCommentText,  // 수정할 댓글 내용
        id: userId                 // 사용자 ID
      });
      
      console.log("댓글 수정 응답:", response);
      
      if (response && response.comment) {

        fetchPostAndComments();
      } else {
        // 응답에 댓글 정보가 없는 경우 전체 데이터 다시 로드
        fetchPostAndComments();
      }
      
      // 수정 모드 종료 및 입력 필드 초기화
      setEditingCommentId(null);
      setEditCommentText('');
      
    } catch (error) {
      console.error("댓글 수정 오류:", error);
      console.error("댓글 수정 오류 상세:", {
        message: error.message,
        originalError: error.originalError,
        response: error.response,
        data: error.data,
        status: error.response?.status
      });
      
      let errorMessage = '댓글 수정에 실패했습니다.';
      
      // originalError 확인
      const originalError = error.originalError || error.message;
      
      if (originalError && typeof originalError === 'string') {
        if (originalError.includes('댓글 내용은 1-1000자 사이여야 합니다')) {
          errorMessage = originalError; // 백엔드에서 이미 구체적인 메시지 제공
        } else if (originalError.includes('권한이 부족합니다')) {
          errorMessage = '댓글을 수정할 권한이 없습니다. 작성자만 수정할 수 있습니다.';
        } else if (originalError.includes('인증 토큰이 필요합니다')) {
          errorMessage = '로그인이 필요합니다. 댓글을 수정하려면 로그인해주세요.';
        } else if (originalError.includes('댓글을 찾을 수 없습니다')) {
          errorMessage = '수정할 댓글을 찾을 수 없습니다.';
        } else if (originalError.includes('사용자를 찾을 수 없습니다')) {
          errorMessage = '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.';
        } else if (error.message && error.message !== '입력 정보를 확인해주세요.') {
          errorMessage = error.message;
        } else {
          errorMessage = originalError;
        }
      } else if (error.message && error.message !== '입력 정보를 확인해주세요.') {
        errorMessage = error.message;
      } else {
        // 기본 에러 메시지
        errorMessage = '댓글 수정 중 오류가 발생했습니다. 다시 시도해주세요.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 댓글 삭제 - API 문서에 맞게 업데이트
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      
      // API 문서에 맞게 요청
              await deleteComment(postId, commentId, userId);
      
      // 로컬 상태에서 삭제된 댓글 제거
      setComments(prevComments => 
        prevComments.filter(c => (c.id || c._id) !== commentId)
      );
      
      // 게시글의 댓글 목록에서도 삭제 (필요한 경우)
      if (post && post.comments) {
        setPost(prevPost => ({
          ...prevPost,
          comments: (prevPost.comments || []).filter(c => 
            (c.id || c._id) !== commentId
          )
        }));
      }
      
    } catch (error) {
      console.error("댓글 삭제 오류:", error);
      console.error("댓글 삭제 오류 상세:", {
        message: error.message,
        originalError: error.originalError,
        response: error.response,
        data: error.data,
        status: error.response?.status
      });
      
      let errorMessage = '댓글 삭제에 실패했습니다.';
      
      // originalError 확인
      const originalError = error.originalError || error.message;
      
      if (originalError && typeof originalError === 'string') {
        if (originalError.includes('사용자 ID는 필수입니다')) {
          errorMessage = '사용자 정보가 필요합니다. 다시 시도해주세요.';
        } else if (originalError.includes('권한이 부족합니다')) {
          errorMessage = '댓글을 삭제할 권한이 없습니다. 작성자만 삭제할 수 있습니다.';
        } else if (originalError.includes('인증 토큰이 필요합니다')) {
          errorMessage = '로그인이 필요합니다. 댓글을 삭제하려면 로그인해주세요.';
        } else if (originalError.includes('댓글을 찾을 수 없습니다')) {
          errorMessage = '삭제할 댓글을 찾을 수 없습니다.';
        } else if (originalError.includes('사용자를 찾을 수 없습니다')) {
          errorMessage = '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.';
        } else if (error.message && error.message !== '입력 정보를 확인해주세요.') {
          errorMessage = error.message;
        } else {
          errorMessage = originalError;
        }
      } else if (error.message && error.message !== '입력 정보를 확인해주세요.') {
        errorMessage = error.message;
      } else {
        // 기본 에러 메시지
        errorMessage = '댓글 삭제 중 오류가 발생했습니다. 다시 시도해주세요.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !post) return <p>게시글을 불러오는 중...</p>;
  if (error) return <p>오류 발생: {error}</p>;
  if (!post) return <p>게시글을 찾을 수 없습니다</p>;

  return (
    <div className="post-container">
      <div className="post-header">
        <h1 className="post-title">{post.title}</h1>
        {canModify && (
          <div className="post-actions">
            <button 
              onClick={() => navigate(`/boards/${postId}/edit`)} 
              className="action-button edit-button"
            >
              수정
            </button>
            <button 
              onClick={handleDelete}
              className="action-button delete-button"
            >
              삭제
            </button>
          </div>
        )}
      </div>
      
      <div className="post-meta">
        <span className="post-author">
          <strong>작성자:</strong> {post.author && post.author.id ? post.author.id : '알 수 없음'}
        </span>
        <span className="post-date">
          <strong>작성일:</strong> {new Date(post.createdAt).toLocaleString()}
        </span>
        {post.updatedAt && post.updatedAt !== post.createdAt && (
          <span className="update-date">
            <strong>수정일:</strong> {new Date(post.updatedAt).toLocaleString()}
          </span>
        )}
        <span className="post-views">
          <strong>조회수:</strong> {post.viewCount || 0}
        </span>
        {post.tags && (
          <div className="post-tags">
            {createTagDisplayData(post.tags, tagList).map((tag, index) => (
              <span key={index} className={`tag ${tag.category}-tag`}>
                {tag.category === 'type' ? 'Type' : 'Region'}: {tag.displayName}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <hr className="post-divider" />

      <div className="post-content">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>

      <div className="comment-section">
        <h3>댓글 ({comments.length})</h3>
        <hr className="comment-divider" />
        
        {comments.length > 0 ? (
          <div className="comment-list">
            {comments.map((comment, index) => {
              const commentId = comment.id || comment._id || index;
              const isEditing = editingCommentId === commentId;
              const commentDate = new Date(comment.createdAt);
              
              // 작성자 ID 추출 로직
              let authorId = '익명';
              
              if (comment.author) {
                if (typeof comment.author === 'object') {
                  authorId = comment.author.id || '익명';
                } else {
                  authorId = comment.author;
                }
              }
              
              // 수정 삭제 권한 확인
              const hasPermission = canModifyComment(comment);
              console.log('댓글 권한 확인:', {
                commentId,
                authorId,
                currentUserId: localStorage.getItem('userId'),
                hasPermission,
                commentAuthor: comment.author
              });
              
              return (
                <div key={commentId} className="comment-item">
                  {isEditing ? (
                    <div className="comment-edit-form">
                      <textarea
                        className="comment-edit-textarea"
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                      />
                      <div className="comment-edit-actions">
                        <button 
                          onClick={() => handleUpdateComment(commentId)} 
                          disabled={loading}
                          className="comment-edit-button"
                        >
                          저장
                        </button>
                        <button 
                          onClick={handleCancelEditComment}
                          className="comment-cancel-button"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="comment-content-wrapper">
                      <div className="comment-author-info">
                        <div className="comment-author-id">{authorId}</div>
                        <div className="comment-date">
                          <div>{commentDate.toLocaleDateString()}</div>
                          <div>{commentDate.toLocaleTimeString()}</div>
                        </div>
                      </div>
                      <div className="comment-main">
                        <div className="comment-text">{comment.content}</div>
                        {hasPermission && (
                          <div className="comment-actions">
                            <button 
                              className="comment-action-button edit-button"
                              onClick={() => handleEditComment(comment)}
                            >
                              수정
                            </button>
                            <button 
                              className="comment-action-button delete-button"
                              onClick={() => handleDeleteComment(commentId)}
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="no-comments">댓글이 없습니다.</p>
        )}
        
        {localStorage.getItem('authToken') ? (
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <textarea 
              placeholder="댓글 작성..." 
              className="comment-textarea"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={loading}
              required
            />
            <button 
              type="submit" 
              className="comment-submit-button"
              disabled={loading}
            >
              {loading ? '작성 중...' : '댓글 달기'}
            </button>
          </form>
        ) : (
          <p className="login-message">댓글을 작성하려면 로그인이 필요합니다.</p>
        )}
      </div>
    </div>
  );
}

export default BoardPostView;

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  getBoardPost, 
  deleteBoard, 
  getUser, 
  addComment, 
  deleteComment, 
  updateComment,
  getComments
} from '../api/boards';
import '../styles/BoardPostView.css';

function BoardPostView() {
  const { boardType, postId } = useParams();
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

  // 게시글과 댓글을 함께 불러오는 함수 업데이트
  const fetchPostAndComments = async () => {
    setLoading(true);
    try {
      // 게시글 데이터 가져오기
      const data = await getBoardPost(boardType, postId);
      setPost(data);
      
      // 댓글 데이터 별도로 가져오기 (새 API 사용)
      try {
        const commentsData = await getComments(boardType, postId);
        if (commentsData && commentsData.comments && Array.isArray(commentsData.comments)) {
          setComments(commentsData.comments);
        } else {
          console.log("댓글 없음 또는 배열 아님:", commentsData);
          setComments([]);
        }
      } catch (commentError) {
        console.error("댓글 로드 중 오류:", commentError);
        // 댓글 로드 실패 시 게시글의 댓글 데이터 사용 시도
        if (data.comments && Array.isArray(data.comments)) {
          setComments(data.comments);
        } else {
          setComments([]);
        }
      }
      
      // 권한 확인
      checkEditDeletePermission(data);
    } catch (error) {
      console.error("게시글 조회 오류:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 또는 페이지 이동 시 데이터 로드
  useEffect(() => {
    fetchPostAndComments();
  }, [boardType, postId]);

  // 필요할 때 데이터 새로고침
  useEffect(() => {
    if (isRefreshing) {
      fetchPostAndComments();
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const checkEditDeletePermission = async (postData) => {
    if (!postData || !localStorage.getItem('authToken')) {
      setCanModify(false);
      return;
    }
    
    const currentUserId = localStorage.getItem('userId');
    const currentUserAuthority = parseInt(localStorage.getItem('userAuthority') || '0');
    
    const isSameUser = postData.author && postData.author.id === currentUserId;
    
    if (isSameUser) {
      setCanModify(true);
      return;
    }
    
    try {
      const authorData = await getUser(postData.author.id);
      const authorAuthority = authorData && authorData.authority ? 
        parseInt(authorData.authority) : 0;

      setCanModify(currentUserAuthority > authorAuthority);
    } catch (error) {
      console.error("작성자 정보 조회 실패:", error);
      setCanModify(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        const userId = localStorage.getItem('userId');
        await deleteBoard(boardType, postId, userId);
        navigate(`/boards/${boardType}`);
      } catch (error) {
        console.error("게시글 삭제 실패:", error);
        alert("삭제 권한이 없거나 오류가 발생했습니다.");
      }
    }
  };

  // 댓글 수정/삭제 권한 확인 함수 - 비동기 호출 없이 단순화
  const canModifyComment = (comment) => {
    if (!localStorage.getItem('authToken') || !comment) return false;
    
    const currentUserId = localStorage.getItem('userId');
    const currentUserAuthority = parseInt(localStorage.getItem('userAuthority') || '0');
    
    // 댓글의 작성자 정보 추출 (로컬에서만 확인)
    let commentAuthorId = '';
    let commentAuthorAuthority = 0;
    
    if (typeof comment.author === 'object' && comment.author !== null) {
      // author가 객체인 경우
      commentAuthorId = comment.author.id || '';
      commentAuthorAuthority = parseInt(comment.author.authority || '0', 10);
    } else {
      // author가 문자열인 경우
      commentAuthorId = comment.author || '';
    }
    
    // console.log('댓글 권한 확인:', {
    //   commentId: comment.id || comment._id,
    //   commentAuthorId,
    //   commentAuthorAuthority,
    //   currentUserId,
    //   currentUserAuthority,
    //   isSameUser: commentAuthorId === currentUserId,
    //   hasHigherAuthority: currentUserAuthority > commentAuthorAuthority
    // });
    
    // 1. 본인 댓글일 경우 항상 수정/삭제 가능
    if (commentAuthorId === currentUserId) {
      return true;
    }
    
    // 2. 본인 댓글이 아닌 경우, 현재 사용자의 권한이 작성자보다 높을 때만 수정/삭제 가능
    return currentUserAuthority > commentAuthorAuthority;
  };

  // 작성자 정보 추출 함수 - 안전하게 가져오기 (표시용)
  const getAuthorId = (author) => {
    if (!author) return '익명';
    
    if (typeof author === 'object' && author !== null) {
      return author.id || '익명';
    }
    
    return author || '익명';
  };

  // 댓글 작성 핸들러 - API 문서에 맞게 업데이트
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }
    
    if (!localStorage.getItem('authToken')) {
      alert('로그인 후 댓글을 작성할 수 있습니다.');
      return;
    }

    const userId = localStorage.getItem('userId');
    
    try {
      setLoading(true);
      // API 문서에 맞게 요청 데이터 구성
      const response = await addComment(boardType, postId, {
        content: commentText,  // 댓글 내용
        id: userId             // 사용자 ID
      });
      
      console.log("댓글 작성 응답:", response);
      
      if (response && response.comment) {

        // 입력 필드 초기화
        setCommentText('');
        
        alert('댓글이 성공적으로 작성되었습니다.');
        fetchPostAndComments();
      } else {
        // 응답에 댓글 정보가 없는 경우 전체 데이터 다시 로드
        fetchPostAndComments();
      }
    } catch (error) {
      console.error("댓글 작성 오류:", error);
      alert(`댓글 작성 실패: ${error.message}`);
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
      const response = await updateComment(boardType, postId, commentId, {
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
      
      alert('댓글이 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error("댓글 수정 오류:", error);
      alert(`댓글 수정 실패: ${error.message}`);
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
      await deleteComment(boardType, postId, commentId, userId);
      
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
      
      alert('댓글이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error("댓글 삭제 오류:", error);
      alert(`댓글 삭제 실패: ${error.message}`);
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
              onClick={() => navigate(`/boards/${boardType}/${postId}/edit`)} 
              className="action-button edit-button"
            >
              수정
            </button>
            <button 
              onClick={handleDelete}
              className="action-button"
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
          {post.updatedAt && post.updatedAt !== post.createdAt && (
            <span className="update-date"> 
              (수정일: {new Date(post.updatedAt).toLocaleString()})
            </span>
          )}
        </span>
        <span className="post-views">
          <strong>조회수:</strong> {post.viewCount || 0}
        </span>
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
              
              return (
                <div key={commentId} className="comment-item">
                  {isEditing ? (
                    <div className="comment-edit-form">
                      <textarea
                        className="comment-edit-textarea"
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                      />
                      <div className="comment-edit-buttons">
                        <button 
                          onClick={() => handleUpdateComment(commentId)} 
                          disabled={loading}
                        >
                          저장
                        </button>
                        <button onClick={handleCancelEditComment}>취소</button>
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
                              className="comment-action-btn"
                              onClick={() => handleEditComment(comment)}
                            >
                              수정
                            </button>
                            <button 
                              className="comment-action-btn"
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
              className="action-button"
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

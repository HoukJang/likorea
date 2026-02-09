import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  getBoardPost,
  deleteBoard,
  addComment,
  deleteComment,
  updateComment,
  getComments
} from '../api/boards';
import { getAllTags } from '../api/tags';
import { getPendingPost, approvePost, rejectPost } from '../api/approval';
import { toggleScrap, checkScrapStatus } from '../api/scrap';
import DOMPurify from 'dompurify';
import { processPostData, processCommentsList } from '../utils/dataUtils';
import { createTagDisplayData } from '../utils/tagUtils';
import { linkifyContentSafe } from '../utils/linkifyContentSafe';
import { processContent } from '../utils/optimizeImages';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../hooks/useAuth';
import { useErrorHandler } from '../utils/errorHandler';
import { useToast } from '../contexts/ToastContext';
import FloatingActionButtons from './FloatingActionButtons';
import PostActionBar from './PostActionBar';
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
  const [isPending, setIsPending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isScraped, setIsScraped] = useState(false);
  const [scrapLoading, setScrapLoading] = useState(false);

  const { canModify: checkCanModify } = usePermission();
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const { toast, confirm, prompt } = useToast();

  // 게시글과 댓글을 함께 불러오는 함수 업데이트
  const fetchPostAndComments = async () => {
    setLoading(true);
    setError(null);

    try {
      // 태그 정보 가져오기
      const tagResponse = await getAllTags();
      setTagList(tagResponse.tags);

      // URL 경로에서 승인 대기 여부 확인
      const isPendingPath = window.location.pathname.includes('pending');

      // 게시글 데이터 가져오기
      let response;
      if (isPendingPath) {
        response = await getPendingPost(postId);
      } else {
        response = await getBoardPost(postId);
      }

      // API 응답에서 post 필드 추출
      const data = response.post || response;

      const processedPost = processPostData(data);

      setPost(processedPost);

      // 댓글 데이터 별도로 가져오기
      try {
        const commentsData = await getComments(postId);
        const processedComments = processCommentsList(commentsData.comments || commentsData);
        setComments(processedComments);
      } catch (commentError) {
        handleError(commentError, '댓글 로드');

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

      // 관리자 권한 및 승인 대기 상태 확인
      setIsAdmin(user?.authority >= 5);
      setIsPending(processedPost.isApproved === false);

      // 로그인한 사용자의 스크랩 여부 확인
      if (user) {
        try {
          const scrapResponse = await checkScrapStatus(postId);
          setIsScraped(scrapResponse.isScraped);
        } catch (error) {
          console.error('스크랩 상태 확인 실패:', error);
        }
      }
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

  const checkEditDeletePermission = postData => {
    if (!postData) {
      setCanModify(false);
      return;
    }

    const canModifyPost = checkCanModify(postData);
    setCanModify(canModifyPost);
  };

  const handleDelete = async () => {
    if (!(await confirm('정말 삭제하시겠습니까?'))) return;

    try {
      const userId = user?.id || localStorage.getItem('userId');
      await deleteBoard(postId, userId);
      navigate('/');
    } catch (error) {
      toast.error('삭제 권한이 없거나 오류가 발생했습니다.');
    }
  };

  // 스크랩 토글 핸들러
  const handleScrapToggle = async () => {
    if (!user) {
      toast.warning('로그인 후 스크랩할 수 있습니다.');
      return;
    }

    try {
      setScrapLoading(true);
      const response = await toggleScrap(postId);

      if (response.success) {
        setIsScraped(response.isScraped);
        const message = response.isScraped ? '스크랩되었습니다.' : '스크랩이 해제되었습니다.';
        toast.success(message);
      }
    } catch (error) {
      console.error('스크랩 토글 실패:', error);
      toast.error('스크랩 처리 중 오류가 발생했습니다.');
    } finally {
      setScrapLoading(false);
    }
  };

  // 승인 처리
  const handleApprove = async () => {
    if (!(await confirm('이 게시글을 승인하시겠습니까?'))) return;

    try {
      setLoading(true);
      await approvePost(postId);
      toast.success('게시글이 승인되었습니다.');
      navigate('/admin');
    } catch (error) {
      const processedError = handleError(error, '게시글 승인');
      toast.error(processedError.message);
    } finally {
      setLoading(false);
    }
  };

  // 거절 처리
  const handleReject = async () => {
    const reason = await prompt('거절 사유를 입력하세요 (선택사항):');
    if (reason === null) return;

    try {
      setLoading(true);
      await rejectPost(postId, reason);
      toast.success('게시글이 거절되었습니다.');
      navigate('/admin');
    } catch (error) {
      const processedError = handleError(error, '게시글 거절');
      toast.error(processedError.message);
    } finally {
      setLoading(false);
    }
  };

  // 댓글 수정/삭제 권한 확인 함수
  const canModifyComment = comment => {
    return checkCanModify(comment);
  };

  // 작성자 정보 추출 함수는 dataUtils에서 가져온 함수 사용

  // 댓글 작성 핸들러 - API 문서에 맞게 업데이트
  const handleCommentSubmit = async e => {
    e.preventDefault();

    if (!commentText.trim()) {
      toast.warning('댓글 내용을 입력해주세요.');
      return;
    }

    if (!user) {
      toast.warning('로그인 후 댓글을 작성할 수 있습니다.');
      return;
    }

    const userId = user?.id || localStorage.getItem('userId');

    try {
      setLoading(true);
      // API 문서에 맞게 요청 데이터 구성
      const response = await addComment(postId, {
        content: commentText, // 댓글 내용
        id: userId // 사용자 ID
      });

      if (response && response.comment) {
        // 입력 필드 초기화
        setCommentText('');

        fetchPostAndComments();
      } else {
        // 응답에 댓글 정보가 없는 경우 전체 데이터 다시 로드
        fetchPostAndComments();
      }
    } catch (error) {
      let errorMessage = '댓글 작성에 실패했습니다.';

      // originalError 확인
      const originalError = error.originalError || error.message;

      if (originalError && typeof originalError === 'string') {
        if (
          originalError.includes('토큰이 만료되었습니다') ||
          originalError.includes('jwt expired') ||
          originalError.includes('접근 권한이 없습니다')
        ) {
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

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = comment => {
    setEditingCommentId(comment.id || comment._id);
    setEditCommentText(comment.content);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  // 댓글 수정 저장 - API 문서에 맞게 업데이트
  const handleUpdateComment = async commentId => {
    if (!editCommentText.trim()) {
      toast.warning('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const userId = user?.id || localStorage.getItem('userId');

      // API 문서에 맞게 요청 데이터 구성
      const response = await updateComment(postId, commentId, {
        content: editCommentText, // 수정할 댓글 내용
        id: userId // 사용자 ID
      });

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

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 댓글 삭제 - API 문서에 맞게 업데이트
  const handleDeleteComment = async commentId => {
    if (!(await confirm('댓글을 삭제하시겠습니까?'))) return;

    try {
      setLoading(true);
      const userId = user?.id || localStorage.getItem('userId');

      // API 문서에 맞게 요청
      await deleteComment(postId, commentId, userId);

      // 로컬 상태에서 삭제된 댓글 제거
      setComments(prevComments => prevComments.filter(c => (c.id || c._id) !== commentId));

      // 게시글의 댓글 목록에서도 삭제 (필요한 경우)
      if (post && post.comments) {
        setPost(prevPost => ({
          ...prevPost,
          comments: (prevPost.comments || []).filter(c => (c.id || c._id) !== commentId)
        }));
      }
    } catch (error) {
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

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !post) return <p>게시글을 불러오는 중...</p>;
  if (error) return <p>오류 발생: {error}</p>;
  if (!post) return <p>게시글을 찾을 수 없습니다</p>;

  // 게시글 설명 생성 (HTML 태그 제거)
  const getDescription = () => {
    if (!post.content) return '롱아일랜드 한인 커뮤니티 게시글';
    const plainText = post.content.replace(/<[^>]*>/g, '').substring(0, 155);
    return plainText || '롱아일랜드 한인 커뮤니티 게시글';
  };

  return (
    <>
      <Helmet>
        <title>{post.title} | 롱아일랜드 한인 커뮤니티</title>
        <meta name="description" content={getDescription()} />
        <link rel="canonical" href={`https://likorea.com/boards/${postId}`} />
        {/* Open Graph 태그 */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={getDescription()} />
        <meta property="og:url" content={`https://likorea.com/boards/${postId}`} />
        <meta property="og:type" content="article" />
        {post.createdAt && <meta property="article:published_time" content={new Date(post.createdAt).toISOString()} />}
        {post.updatedAt && <meta property="article:modified_time" content={new Date(post.updatedAt).toISOString()} />}
        {post.author?.id && <meta property="article:author" content={post.author.id} />}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            datePublished: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
            dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
            author: { '@type': 'Person', name: post.author?.id || '익명' },
            publisher: {
              '@type': 'Organization',
              name: '롱아일랜드 한인 커뮤니티',
              url: 'https://likorea.com'
            },
            mainEntityOfPage: `https://likorea.com/boards/${postId}`,
            articleSection: post.tags?.type || '게시판'
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: '홈', item: 'https://likorea.com/' },
              { '@type': 'ListItem', position: 2, name: '게시판', item: 'https://likorea.com/boards' },
              { '@type': 'ListItem', position: 3, name: post.title, item: `https://likorea.com/boards/${postId}` }
            ]
          })}
        </script>
      </Helmet>

      <div className="post-container">
      <div className="post-header">
        <h1 className="post-title">
          {post.title}
          {isPending && <span style={{ marginLeft: '12px', padding: '4px 8px', backgroundColor: '#ff9800', color: 'white', borderRadius: '4px', fontSize: '0.8em' }}>승인 대기</span>}
        </h1>
        <div className="post-actions-minimal">
          {user && (
            <button
              onClick={handleScrapToggle}
              className={`minimal-action-button ${isScraped ? 'active' : ''}`}
              disabled={scrapLoading}
              aria-label={isScraped ? '스크랩 해제' : '스크랩'}
            >
              <span className="action-icon">📌</span>
              <span className="action-text">
                {scrapLoading ? '처리중' : (isScraped ? '스크랩됨' : '스크랩')}
              </span>
            </button>
          )}
          {canModify && (
            <div className="modify-actions">
              <button
                onClick={() => navigate(`/boards/${postId}/edit`)}
                className="minimal-action-button text-only"
                aria-label="게시글 수정"
              >
                수정
              </button>
              <span className="action-divider">·</span>
              <button
                onClick={handleDelete}
                className="minimal-action-button text-only danger"
                aria-label="게시글 삭제"
              >
                삭제
              </button>
            </div>
          )}
          {isAdmin && isPending && (
            <div className="admin-actions">
              <button
                onClick={handleApprove}
                className="minimal-action-button approve"
                disabled={loading}
                aria-label="게시글 승인"
              >
                {loading ? '처리중' : '승인'}
              </button>
              <button
                onClick={handleReject}
                className="minimal-action-button reject"
                disabled={loading}
                aria-label="게시글 거절"
              >
                {loading ? '처리중' : '거절'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="post-meta">
        <span className="post-author">
          <strong>작성자:</strong> {post.author?.id || '알 수 없음'}
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
                {tag.category === 'type' ? 'Type' :
                 tag.category === 'subcategory' ? 'Sub' : 'Region'}: {tag.displayName}
              </span>
            ))}
          </div>
        )}
      </div>

      <hr className="post-divider" />

      <div className="post-content">
        <div className="post-content-html" dangerouslySetInnerHTML={{
          __html: processContent(post.content, linkifyContentSafe)
        }} />
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

              // 작성자 ID 추출
              const authorId = comment.author?.id || '익명';

              // 수정 삭제 권한 확인
              const hasPermission = canModifyComment(comment);

              return (
                <div key={commentId} className="comment-item">
                  {isEditing ? (
                    <div className="comment-edit-form">
                      <textarea
                        className="comment-edit-textarea"
                        value={editCommentText}
                        onChange={e => setEditCommentText(e.target.value)}
                      />
                      <div className="comment-edit-actions">
                        <button
                          onClick={() => handleUpdateComment(commentId)}
                          disabled={loading}
                          className="minimal-comment-button primary"
                        >
                          저장
                        </button>
                        <button onClick={handleCancelEditComment} className="minimal-comment-button">
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
                      <div className="comment-divider-vertical"></div>
                      <div className="comment-main">
                        <div className="comment-text" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }} />
                        {hasPermission && (
                          <div className="comment-actions-minimal">
                            <button
                              className="minimal-comment-action"
                              onClick={() => handleEditComment(comment)}
                            >
                              수정
                            </button>
                            <span className="action-divider">·</span>
                            <button
                              className="minimal-comment-action danger"
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

        {user ? (
          <div className="comment-form-container">
            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <textarea
                placeholder="생각을 공유해주세요..."
                className="comment-textarea"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                disabled={loading}
                required
              />
              <button type="submit" className="minimal-submit-button" disabled={loading || !commentText.trim()} aria-label="댓글 전송">
                <span className="sr-only">{loading ? '전송 중' : '전송'}</span>
              </button>
            </form>
          </div>
        ) : (
          <p className="login-message">💬 댓글을 작성하려면 로그인이 필요합니다.</p>
        )}
      </div>

      {/* Desktop Action Bar */}
      <PostActionBar
        postId={postId}
        onScrapToggle={handleScrapToggle}
        isScraped={isScraped}
        scrapLoading={scrapLoading}
        showScrap={true}
        user={user}
        canModify={canModify}
        onEdit={() => navigate(`/boards/${postId}/edit`)}
        onDelete={handleDelete}
      />
    </div>

    {/* Floating Action Buttons - Mobile Only */}
    <div className="mobile-only">
      <FloatingActionButtons
        onScrapToggle={handleScrapToggle}
        isScraped={isScraped}
        scrapLoading={scrapLoading}
        showScrap={user ? true : false}
        showShare={true}
        showTop={true}
        canModify={canModify}
        onEdit={() => navigate(`/boards/${postId}/edit`)}
        onDelete={handleDelete}
      />
    </div>
    </>
  );
}

export default BoardPostView;

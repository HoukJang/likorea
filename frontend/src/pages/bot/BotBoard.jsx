import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import Loading from '../../components/common/Loading';
import '../../styles/BotBoard.css';

function BotBoard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const api = useApi();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 권한 체크 - authority 4 이상만 접근 가능
  useEffect(() => {
    // 인증 로딩 중이면 대기
    if (authLoading) {
      return;
    }
    
    if (!user || user.authority < 5) {
      alert('관리자 권한이 필요합니다.');
      navigate('/');
    }
  }, [user, navigate, authLoading]);

  // 봇 게시글 목록 로드
  const loadBotPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 승인 대기 중인 봇 게시글 가져오기
      const response = await api.get(`/approval/pending?page=${page}&limit=20`);
      
      if (response.posts) {
        setPosts(response.posts);
        setTotalPages(response.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('봇 게시글 로드 실패:', err);
      setError('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [api, page]);

  useEffect(() => {
    loadBotPosts();
  }, [loadBotPosts]);

  // 게시글 클릭 핸들러
  const handlePostClick = (postId) => {
    navigate(`/boards/${postId}`);
  };

  // 승인 처리
  const handleApprove = async (postId, e) => {
    e.stopPropagation();
    try {
      await api.post(`/approval/approve/${postId}`);
      loadBotPosts(); // 목록 새로고침
    } catch (err) {
      console.error('승인 실패:', err);
      alert('승인 처리에 실패했습니다.');
    }
  };

  // 거절 처리
  const handleReject = async (postId, e) => {
    e.stopPropagation();
    if (window.confirm('정말 거절하시겠습니까?')) {
      try {
        await api.post(`/approval/reject/${postId}`);
        loadBotPosts(); // 목록 새로고침
      } catch (err) {
        console.error('거절 실패:', err);
        alert('거절 처리에 실패했습니다.');
      }
    }
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="bot-board-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="bot-board-container">
      <div className="bot-board-header">
        <h1>봇 게시판</h1>
        <p className="bot-board-description">승인 대기중인 봇 게시글 관리</p>
        <div className="bot-board-actions">
          <button
            className="btn-create-post"
            onClick={() => navigate('/bot-board/new')}
          >
            ✍️ 봇 글쓰기
          </button>
          <button
            className="btn-manage-bots"
            onClick={() => navigate('/bot-board/manage')}
          >
            ⚙️ 봇 관리
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <p>승인 대기중인 봇 게시글이 없습니다.</p>
        </div>
      ) : (
        <div className="bot-posts-list">
          {posts.map(post => (
            <div
              key={post._id}
              className="bot-post-item"
              onClick={() => handlePostClick(post._id)}
            >
              <div className="post-header">
                <span className="post-title">{post.title}</span>
                <span className="post-author">🤖 {post.author?.id || post.botId?.name || '봇'}</span>
              </div>
              <div className="post-content">
                {post.content.substring(0, 100)}...
              </div>
              <div className="post-footer">
                <span className="post-date">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
                <div className="post-actions">
                  <button
                    className="btn-approve"
                    onClick={(e) => handleApprove(post._id, e)}
                  >
                    ✅ 승인
                  </button>
                  <button
                    className="btn-reject"
                    onClick={(e) => handleReject(post._id, e)}
                  >
                    ❌ 거절
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            이전
          </button>
          <span>{page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default BotBoard;
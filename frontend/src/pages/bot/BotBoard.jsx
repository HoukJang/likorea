import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import BoardList from '../../components/BoardList';
import Loading from '../../components/common/Loading';
import '../../styles/BotBoard.css';

function BotBoard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // 권한 체크 - authority 5 이상만 접근 가능
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

  if (authLoading) {
    return <Loading />;
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

      {/* 기존 BoardList 컴포넌트를 사용하여 승인 대기 게시글 표시 */}
      <BoardList pendingOnly={true} />
    </div>
  );
}

export default BotBoard;
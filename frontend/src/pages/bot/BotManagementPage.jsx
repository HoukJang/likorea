import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getBots, deleteBot } from '../../api/bots';
import Loading from '../../components/common/Loading';
import '../../styles/BotManagementPage.css';

function BotManagementPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingBot, setDeletingBot] = useState(null);

  // 권한 체크 - authority 4 이상만 접근 가능
  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (!user || user.authority < 5) {
      alert('관리자 권한이 필요합니다.');
      navigate('/');
    }
  }, [user, navigate, authLoading]);

  // 봇 목록 로드
  const loadBots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getBots();

      if (response) {
        setBots(response.bots || []);
      }
    } catch (err) {
      console.error('봇 목록 로드 실패:', err);
      if (err.status === 404 || err.statusCode === 404) {
        setBots([]);
      } else {
        setError('봇 목록을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBots();
  }, [loadBots]);

  // 봇 삭제 핸들러
  const handleDeleteBot = async (botId) => {
    if (!window.confirm('정말 이 봇을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setDeletingBot(botId);
      await deleteBot(botId);
      loadBots(); // 목록 새로고침
    } catch (err) {
      console.error('봇 삭제 실패:', err);
      alert('봇 삭제에 실패했습니다.');
    } finally {
      setDeletingBot(null);
    }
  };

  // 봇 타입 표시
  const getBotTypeDisplay = (type) => {
    switch (type) {
      case 'restaurant':
        return '🍽️ 맛집봇';
      case 'news':
        return '📰 뉴스봇';
      default:
        return '🤖 일반봇';
    }
  };

  // 봇 상태 표시
  const getBotStatusDisplay = (bot) => {
    if (bot.taskStatus === 'generating') {
      return <span className="status generating">🔄 작성중</span>;
    }
    if (bot.active) {
      return <span className="status active">✅ 활성</span>;
    }
    return <span className="status inactive">⏸️ 비활성</span>;
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="bot-management-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="bot-management-container">
      <div className="bot-management-header">
        <h1>봇 관리</h1>
        <p className="bot-management-description">봇을 생성하고 관리합니다.</p>
        <div className="bot-management-actions">
          <button
            className="btn-back"
            onClick={() => navigate('/bot-board')}
          >
            ← 봇 게시판
          </button>
          <button
            className="btn-create-bot"
            onClick={() => navigate('/bot-board/manage/new')}
          >
            ➕ 새 봇 만들기
          </button>
        </div>
      </div>

      {bots.length === 0 ? (
        <div className="empty-state">
          <p>생성된 봇이 없습니다.</p>
          <button
            className="btn-create-first"
            onClick={() => navigate('/bot-board/manage/new')}
          >
            첫 번째 봇 만들기
          </button>
        </div>
      ) : (
        <div className="bots-grid">
          {bots.map(bot => (
            <div key={bot._id} className="bot-card">
              <div className="bot-card-header">
                <h3>{bot.name}</h3>
                {getBotStatusDisplay(bot)}
              </div>

              <div className="bot-card-body">
                <p className="bot-type">{getBotTypeDisplay(bot.type)}</p>
                <p className="bot-description">{bot.description}</p>

                {bot.persona && (
                  <div className="bot-persona">
                    <strong>페르소나:</strong>
                    <p>{bot.persona.age}세 {bot.persona.gender}, {bot.persona.occupation}</p>
                  </div>
                )}

                <div className="bot-stats">
                  <span>생성된 글: {bot.postCount || 0}개</span>
                  <span>마지막 활동: {bot.lastActivity ?
                    new Date(bot.lastActivity).toLocaleDateString() :
                    '없음'
                  }</span>
                </div>
              </div>

              <div className="bot-card-actions">
                <button
                  className="btn-edit"
                  onClick={() => navigate(`/bot-board/manage/edit/${bot._id}`)}
                >
                  수정
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteBot(bot._id)}
                  disabled={deletingBot === bot._id}
                >
                  {deletingBot === bot._id ? '삭제중...' : '삭제'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BotManagementPage;
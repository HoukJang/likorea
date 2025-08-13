import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  getBots, 
  deleteBot, 
  updateBotStatus, 
  resetBotTask, 
  retryBotTask,
  getAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead 
} from '../../api/bots';
import Loading from '../../components/common/Loading';
import '../../styles/BotManagementPage.css';

function BotManagementPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingBot, setDeletingBot] = useState(null);
  const [retryingBot, setRetryingBot] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

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

  // 알림 로드
  const loadNotifications = useCallback(async () => {
    try {
      const data = await getAdminNotifications(false, 20);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('알림 로드 실패:', err);
    }
  }, []);

  useEffect(() => {
    loadBots();
    loadNotifications();
  }, [loadBots, loadNotifications]);

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

  // 봇 상태 토글 핸들러
  const handleToggleStatus = async (botId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const statusText = newStatus === 'active' ? '활성화' : '비활성화';

    try {
      await updateBotStatus(botId, newStatus);
      alert(`봇이 ${statusText}되었습니다.`);
      loadBots(); // 목록 새로고침
    } catch (err) {
      console.error('봇 상태 변경 실패:', err);
      alert('봇 상태 변경에 실패했습니다.');
    }
  };

  // 봇 작업 상태 리셋 핸들러
  const handleResetTask = async (botId, botName) => {
    if (!window.confirm(`${botName}의 작업 상태를 리셋하시겠습니까?`)) {
      return;
    }

    try {
      await resetBotTask(botId);
      alert('작업 상태가 리셋되었습니다.');
      loadBots(); // 목록 새로고침
    } catch (err) {
      console.error('작업 상태 리셋 실패:', err);
      alert('작업 상태 리셋에 실패했습니다.');
    }
  };

  // 실패한 작업 재시도 핸들러
  const handleRetryTask = async (botId, botName) => {
    if (!window.confirm(`${botName}의 실패한 작업을 다시 시도하시겠습니까?`)) {
      return;
    }

    try {
      setRetryingBot(botId);
      await retryBotTask(botId);
      alert('작업 재시도를 시작했습니다.');
      loadBots(); // 목록 새로고침
      loadNotifications(); // 알림 새로고침
    } catch (err) {
      console.error('재시도 실패:', err);
      alert('작업 재시도에 실패했습니다: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setRetryingBot(null);
    }
  };

  // 알림 읽음 처리
  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      loadNotifications();
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
    }
  };

  // 모든 알림 읽음 처리
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      loadNotifications();
    } catch (err) {
      console.error('모든 알림 읽음 처리 실패:', err);
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
    if (bot.taskStatus === 'failed') {
      return <span className="status failed">❌ 실패</span>;
    }
    if (bot.status === 'active') {
      return <span className="status active">✅ 활성</span>;
    }
    if (bot.status === 'maintenance') {
      return <span className="status maintenance">🔧 유지보수</span>;
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
            className="btn-notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: 'relative' }}
          >
            🔔 알림
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          <button
            className="btn-create-bot"
            onClick={() => navigate('/bot-board/manage/new')}
          >
            ➕ 새 봇 만들기
          </button>
        </div>
      </div>

      {/* 알림 패널 */}
      {showNotifications && (
        <div className="notifications-panel">
          <div className="notifications-header">
            <h3>관리자 알림</h3>
            {unreadCount > 0 && (
              <button className="btn-mark-all-read" onClick={handleMarkAllRead}>
                모두 읽음
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="no-notifications">알림이 없습니다.</p>
          ) : (
            <div className="notifications-list">
              {notifications.map(notification => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => !notification.isRead && handleMarkNotificationRead(notification._id)}
                >
                  <div className="notification-header">
                    <span className={`severity-badge severity-${notification.severity}`}>
                      {notification.severity === 'critical' ? '🚨' : 
                       notification.severity === 'high' ? '⚠️' : 
                       notification.severity === 'medium' ? '📢' : 'ℹ️'}
                    </span>
                    <strong>{notification.title}</strong>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <small className="notification-time">
                    {new Date(notification.createdAt).toLocaleString()}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

                {bot.settings?.autoPost && (
                  <div className="bot-schedule">
                    <span className="schedule-badge">
                      ⏰ 자동 게시: {Math.round(bot.settings.postInterval / 3600000)}시간마다
                    </span>
                  </div>
                )}

                {/* 실패한 작업 정보 표시 */}
                {bot.taskStatus === 'failed' && bot.currentTask && (
                  <div className="bot-error-info">
                    <p className="error-message">
                      ⚠️ 마지막 작업 실패: {bot.currentTask.error || '알 수 없는 오류'}
                    </p>
                    <button
                      className="btn-retry"
                      onClick={() => handleRetryTask(bot._id, bot.name)}
                      disabled={retryingBot === bot._id}
                    >
                      {retryingBot === bot._id ? '재시도 중...' : '🔄 재시도'}
                    </button>
                  </div>
                )}
              </div>

              <div className="bot-card-actions">
                <button
                  className={`btn-toggle ${bot.status === 'active' ? 'btn-deactivate' : 'btn-activate'}`}
                  onClick={() => handleToggleStatus(bot._id, bot.status)}
                  disabled={bot.taskStatus === 'generating'}
                >
                  {bot.status === 'active' ? '비활성화' : '활성화'}
                </button>
                {bot.taskStatus === 'generating' && (
                  <button
                    className="btn-reset"
                    onClick={() => handleResetTask(bot._id, bot.name)}
                    title="작업 상태 리셋"
                  >
                    리셋
                  </button>
                )}
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
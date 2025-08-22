import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getUnreadCount } from '../../api/message';
import '../../styles/Profile.css';

function ProfileLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // URL 경로에서 현재 탭 결정
  const getActiveTab = () => {
    const path = location.pathname.split('/').pop();
    return path === 'profile' ? 'info' : path;
  };

  const activeTab = getActiveTab();

  // 읽지 않은 메시지 수 조회
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await getUnreadCount();
        setUnreadCount(response.data.count || 0);
      } catch (error) {
        console.error('읽지 않은 메시지 수 조회 실패:', error);
      }
    };

    fetchUnreadCount();
    // 30초마다 읽지 않은 메시지 수 업데이트
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  // 탭 변경 핸들러
  const handleTabChange = (tab) => {
    navigate(`/profile/${tab}`);
  };

  return (
    <div className="profile-layout-container">
      <header className="profile-header">
        <h1>내 정보</h1>
        <p className="profile-subtitle">프로필 및 메시지 관리</p>
      </header>

      <nav className="profile-tabs" role="tablist" aria-label="프로필 기능 탭">
        <button
          className={activeTab === 'info' ? 'active' : ''}
          onClick={() => handleTabChange('info')}
          role="tab"
          aria-selected={activeTab === 'info'}
          aria-controls="info-panel"
        >
          <span className="tab-icon">👤</span>
          <span className="tab-text">프로필</span>
        </button>
        <button
          className={activeTab === 'scraps' ? 'active' : ''}
          onClick={() => handleTabChange('scraps')}
          role="tab"
          aria-selected={activeTab === 'scraps'}
          aria-controls="scraps-panel"
        >
          <span className="tab-icon">📌</span>
          <span className="tab-text">스크랩</span>
        </button>
        <button
          className={activeTab === 'messages' ? 'active' : ''}
          onClick={() => handleTabChange('messages')}
          role="tab"
          aria-selected={activeTab === 'messages'}
          aria-controls="messages-panel"
        >
          <span className="tab-icon">✉️</span>
          <span className="tab-text">쪽지함</span>
          {unreadCount > 0 && (
            <span className="unread-count">{unreadCount}</span>
          )}
        </button>
      </nav>

      {/* 하위 라우트 컴포넌트가 여기에 렌더링됨 */}
      <Outlet />
    </div>
  );
}

export default ProfileLayout;
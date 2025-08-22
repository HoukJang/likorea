import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getUnreadCount } from '../../api/message';
import packageJson from '../../../package.json';
import '../../styles/Admin.css';

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // URL 경로에서 현재 탭 결정
  const getActiveTab = () => {
    const path = location.pathname.split('/').pop();
    return path === 'admin' ? 'users' : path;
  };

  const activeTab = getActiveTab();

  // 사용자 권한 검증
  useEffect(() => {
    const userAuthority = parseInt(localStorage.getItem('userAuthority')) || 0;
    if (userAuthority !== 5) {
      alert('관리자 권한이 필요합니다.');
      navigate('/');
    }
  }, [navigate]);

  // 읽지 않은 메시지 수 조회
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await getUnreadCount();
        setUnreadCount(response.count || 0);
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
    navigate(`/admin/${tab}`);
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>관리자 대시보드</h1>
        <p className="admin-subtitle">시스템 관리 및 모니터링</p>
      </header>

      <nav className="admin-tabs" role="tablist" aria-label="관리자 기능 탭">
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => handleTabChange('users')}
          role="tab"
          aria-selected={activeTab === 'users'}
          aria-controls="users-panel"
        >
          <span className="tab-icon">👥</span>
          <span className="tab-text">사용자 관리</span>
        </button>
        <button
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => handleTabChange('stats')}
          role="tab"
          aria-selected={activeTab === 'stats'}
          aria-controls="stats-panel"
        >
          <span className="tab-icon">📊</span>
          <span className="tab-text">통계</span>
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
          className={activeTab === 'traffic' ? 'active' : ''}
          onClick={() => handleTabChange('traffic')}
          role="tab"
          aria-selected={activeTab === 'traffic'}
          aria-controls="traffic-panel"
        >
          <span className="tab-icon">📈</span>
          <span className="tab-text">트래픽</span>
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
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => handleTabChange('profile')}
          role="tab"
          aria-selected={activeTab === 'profile'}
          aria-controls="profile-panel"
        >
          <span className="tab-icon">⚙️</span>
          <span className="tab-text">프로필</span>
        </button>
      </nav>

      {message && (
        <div
          className={`admin-message ${message.includes('성공') ? 'success' : 'error'}`}
          role="alert"
        >
          {message}
        </div>
      )}

      {/* 하위 라우트 컴포넌트가 여기에 렌더링됨 */}
      <Outlet context={{ setMessage }} />

      {/* 버전 정보 */}
      <footer className="admin-footer">
        <div className="version-info">
          <span className="version-label">Version</span>
          <span className="version-number">v{packageJson.version}</span>
        </div>
      </footer>
    </div>
  );
}

export default AdminLayout;
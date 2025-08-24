import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getUnreadCount } from '../api/message';
import { useAuth } from '../hooks/useAuth';
import packageJson from '../../package.json';
import '../styles/Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [message, setMessage] = useState('');

  const userAuthority = user?.authority || 0;
  const isAdmin = userAuthority === 5;

  // URL 경로에서 현재 탭 결정
  const getActiveTab = () => {
    const path = location.pathname.split('/').pop();
    return path === 'dashboard' ? 'profile' : path;
  };

  const activeTab = getActiveTab();

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
    navigate(`/dashboard/${tab}`);
  };

  // 공통 탭 정의
  const commonTabs = [
    {
      id: 'profile',
      label: '프로필',
      icon: '👤',
      description: '내 정보 관리'
    },
    {
      id: 'scraps',
      label: '스크랩',
      icon: '📌',
      description: '저장한 게시글'
    },
    {
      id: 'messages',
      label: '쪽지함',
      icon: '✉️',
      description: '메시지 관리',
      badge: unreadCount
    }
  ];

  // 관리자 전용 탭
  const adminTabs = [
    {
      id: 'users',
      label: '사용자 관리',
      icon: '👥',
      description: '사용자 정보 관리'
    },
    {
      id: 'stats',
      label: '통계',
      icon: '📊',
      description: '사이트 통계'
    },
    {
      id: 'traffic',
      label: '트래픽',
      icon: '📈',
      description: '실시간 트래픽 모니터링'
    },
    {
      id: 'banners',
      label: '배너 관리',
      icon: '📢',
      description: '공지 배너 관리'
    }
  ];

  // 권한에 따른 탭 목록
  const availableTabs = isAdmin ? [...commonTabs, ...adminTabs] : commonTabs;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>{isAdmin ? '관리자 대시보드' : '사용자 대시보드'}</h1>
          <p className="dashboard-subtitle">
            {isAdmin ? '시스템 관리 및 모니터링' : '프로필 및 메시지 관리'}
          </p>
        </div>
        {isAdmin && (
          <div className="dashboard-badge">
            <span className="badge-label">관리자</span>
            <span className="authority-level">Level 5</span>
          </div>
        )}
      </header>

      <nav className="dashboard-tabs" role="tablist" aria-label="대시보드 기능 탭">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-text">{tab.label}</span>
            {tab.badge > 0 && (
              <span className="tab-badge">{tab.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {message && (
        <div
          className={`dashboard-message ${message.includes('성공') ? 'success' : 'error'}`}
          role="alert"
        >
          {message}
        </div>
      )}

      <main className="dashboard-content">
        {/* 하위 라우트 컴포넌트가 여기에 렌더링됨 */}
        <Outlet context={{ setMessage, isAdmin, userAuthority }} />
      </main>

      {/* 버전 정보 */}
      <footer className="dashboard-footer">
        <div className="version-info">
          <span className="version-label">Version</span>
          <span className="version-number">v{packageJson.version}</span>
        </div>
        <div className="user-info">
          <span className="user-label">로그인 계정:</span>
          <span className="user-id">{user?.id || '알 수 없음'}</span>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
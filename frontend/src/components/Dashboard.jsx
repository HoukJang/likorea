import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMessage } from '../contexts/MessageContext';
import packageJson from '../../package.json';
import '../styles/Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { unreadCount } = useMessage();
  const [message, setMessage] = useState('');
  const tabsRef = useRef(null);
  const [isScrollable, setIsScrollable] = useState(false);

  const isAdmin = useMemo(() => {
    if (authLoading || !user) return false;
    const authority = user?.authority;
    return authority === 5 || authority === '5';
  }, [user, authLoading]);


  // URL 경로에서 현재 탭 결정
  const activeTab = useMemo(() => {
    const pathParts = location.pathname.split('/');
    // /dashboard/messages/compose 같은 경우 messages를 반환
    const tabName = pathParts[2] || 'profile';
    return tabName === 'dashboard' ? 'profile' : tabName;
  }, [location.pathname]);

  // 스크롤 가능 여부 체크
  const checkScrollable = useCallback(() => {
    if (tabsRef.current) {
      const { scrollWidth, clientWidth } = tabsRef.current;
      setIsScrollable(scrollWidth > clientWidth);
    }
  }, []);

  // 탭 스크롤 가능 여부 체크
  useEffect(() => {
    checkScrollable();
    window.addEventListener('resize', checkScrollable);

    return () => window.removeEventListener('resize', checkScrollable);
  }, [checkScrollable, isAdmin]); // isAdmin 변경 시에도 체크

  // 탭 변경 핸들러
  const handleTabChange = (tab) => {
    navigate(`/dashboard/${tab}`);
  };

  // 권한에 따른 탭 목록 - useMemo로 메모이제이션
  const availableTabs = useMemo(() => {
    // 공통 탭 정의 (useMemo 내부에서)
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
        description: '메시지 관리'
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

    if (authLoading || !isAdmin) {
      return commonTabs;
    }

    return [...commonTabs, ...adminTabs];
  }, [isAdmin, authLoading, user]); // user도 의존성에 추가

  // 메시지 뱃지를 위해 별도로 처리
  const tabsWithBadge = useMemo(() => {
    return availableTabs.map(tab => {
      if (tab.id === 'messages') {
        return { ...tab, badge: unreadCount };
      }
      return tab;
    });
  }, [availableTabs, unreadCount]);

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

      {/* 로딩 중이거나 user가 없을 때는 탭을 숨기지 않고 일반 탭만 표시 */}
      <nav
        className={`dashboard-tabs ${isScrollable ? 'scrollable' : ''}`}
        role="tablist"
        aria-label="대시보드 기능 탭"
        ref={tabsRef}
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          overflowY: 'hidden',
          whiteSpace: 'nowrap',
          width: '100%',
          maxWidth: '100vw',
          WebkitOverflowScrolling: 'touch'  // iOS 스크롤 개선
        }}
      >
        {tabsWithBadge.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              title={tab.description}
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
        <Outlet context={{ setMessage, isAdmin, userAuthority: user?.authority || 0 }} />
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
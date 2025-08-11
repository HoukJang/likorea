import { lazy, Suspense } from 'react';
import Loading from '../../components/common/Loading';
import '../../styles/Admin.css';

// BotManagement를 lazy loading으로 import
const BotManagement = lazy(() => import('../BotManagement'));

function AdminBots() {
  return (
    <section
      className="admin-section"
      id="bots-panel"
      role="tabpanel"
      aria-labelledby="bots-tab"
    >
      <div className="section-header">
        <h2>봇 관리 시스템</h2>
        <p className="section-description">AI 봇 생성, 관리 및 게시글 승인 시스템</p>
      </div>
      <div className="bots-management">
        <Suspense fallback={<Loading />}>
          <BotManagement embedded={true} />
        </Suspense>
      </div>
    </section>
  );
}

export default AdminBots;
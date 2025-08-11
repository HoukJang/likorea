import TrafficDashboardWrapper from '../../components/TrafficDashboardWrapper';
import '../../styles/Admin.css';

function AdminTraffic() {
  return (
    <section
      className="admin-section"
      id="traffic-panel"
      role="tabpanel"
      aria-labelledby="traffic-tab"
    >
      <div className="section-header">
        <h2>트래픽 대시보드</h2>
        <p className="section-description">실시간 사이트 방문 통계 및 트래픽 분석</p>
      </div>
      <TrafficDashboardWrapper />
    </section>
  );
}

export default AdminTraffic;
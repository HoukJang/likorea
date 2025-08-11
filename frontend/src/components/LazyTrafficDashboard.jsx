import { lazy, Suspense } from 'react';
import Loading from './common/Loading';

// Lazy load with error boundary
const TrafficDashboardComponent = lazy(() => 
  import('./TrafficDashboard').catch(err => {
    console.error('Failed to load TrafficDashboard:', err);
    // Return a fallback component in case of error
    return { 
      default: () => (
        <div className="error-message">
          <p>트래픽 대시보드를 불러오는데 실패했습니다.</p>
          <button onClick={() => window.location.reload()}>새로고침</button>
        </div>
      )
    };
  })
);

function LazyTrafficDashboard() {
  return (
    <Suspense fallback={
      <div className="loading-container">
        <Loading />
        <p>트래픽 대시보드를 불러오는 중...</p>
      </div>
    }>
      <TrafficDashboardComponent />
    </Suspense>
  );
}

export default LazyTrafficDashboard;
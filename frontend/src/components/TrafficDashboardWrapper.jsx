import { useState, useEffect } from 'react';
import Loading from './common/Loading';

// Dynamic import with proper error handling and retry
function TrafficDashboardWrapper() {
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadComponent = async () => {
      try {
        // Clear any previous errors
        setError(null);
        
        // Dynamic import with timeout
        const module = await Promise.race([
          import('./TrafficDashboard'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Loading timeout')), 10000)
          )
        ]);
        
        if (mounted) {
          setComponent(() => module.default);
        }
      } catch (err) {
        console.error('Failed to load TrafficDashboard:', err);
        if (mounted) {
          setError(err.message || 'Failed to load component');
        }
      }
    };

    loadComponent();

    return () => {
      mounted = false;
    };
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (error) {
    return (
      <div className="error-container" style={{ padding: '20px', textAlign: 'center' }}>
        <h3>트래픽 대시보드를 불러올 수 없습니다</h3>
        <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={handleRetry}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          다시 시도
        </button>
        <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          문제가 계속되면 페이지를 새로고침해주세요.
        </p>
      </div>
    );
  }

  if (!Component) {
    return (
      <div className="loading-container" style={{ padding: '40px', textAlign: 'center' }}>
        <Loading />
        <p style={{ marginTop: '20px' }}>트래픽 대시보드를 불러오는 중...</p>
      </div>
    );
  }

  return <Component />;
}

export default TrafficDashboardWrapper;
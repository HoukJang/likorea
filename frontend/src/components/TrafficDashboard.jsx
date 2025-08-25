import { useState, useEffect } from 'react';
import { getTrafficDashboard, getRealtimeTraffic } from '../api/traffic';
// Chart.js v3 imports with tree-shaking
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
import '../styles/TrafficDashboard.css';

function TrafficDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [realtimeData, setRealtimeData] = useState([]);
  const [period, setPeriod] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 대시보드 데이터 로드
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getTrafficDashboard(period);
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      setError('대시보드 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 실시간 데이터 로드
  const fetchRealtimeData = async () => {
    try {
      const response = await getRealtimeTraffic();
      setRealtimeData(response.data);
    } catch (err) {
      // 실시간 데이터 로드 실패 시 조용히 처리
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchDashboardData();
    fetchRealtimeData();
  }, [period]);

  // 실시간 데이터 자동 업데이트 (30초마다)
  useEffect(() => {
    const interval = setInterval(fetchRealtimeData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 권한 레벨 표시
  const getAuthorityLabel = level => {
    switch (parseInt(level)) {
      case 1:
        return '게스트';
      case 2:
        return '제한 사용자';
      case 3:
        return '일반 사용자';
      case 4:
        return '매니저';
      case 5:
        return '관리자';
      default:
        return '알 수 없음';
    }
  };

  // HTTP 상태 코드 색상
  const getStatusCodeColor = code => {
    if (code >= 200 && code < 300) return '#4CAF50';
    if (code >= 300 && code < 400) return '#2196F3';
    if (code >= 400 && code < 500) return '#FF9800';
    if (code >= 500) return '#F44336';
    return '#757575';
  };

  // HTTP 메서드 색상
  const getMethodColor = method => {
    switch (method) {
      case 'GET':
        return '#4CAF50';
      case 'POST':
        return '#2196F3';
      case 'PUT':
        return '#FF9800';
      case 'DELETE':
        return '#F44336';
      case 'PATCH':
        return '#9C27B0';
      default:
        return '#757575';
    }
  };

  // 시간별 요청 수 차트 데이터
  const getHourlyChartData = () => {
    if (!dashboardData?.hourlyStats) return null;

    const labels = dashboardData.hourlyStats.map(
      stat => `${stat._id.month}/${stat._id.day} ${stat._id.hour}:00`
    );
    const data = dashboardData.hourlyStats.map(stat => stat.count);

    return {
      labels,
      datasets: [
        {
          label: '요청 수',
          data,
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  };

  // 상태 코드별 분포 차트 데이터
  const getStatusCodeChartData = () => {
    if (!dashboardData?.statusCodeStats) return null;

    const labels = dashboardData.statusCodeStats.map(stat => `${stat._id}`);
    const data = dashboardData.statusCodeStats.map(stat => stat.count);
    const backgroundColor = dashboardData.statusCodeStats.map(stat => getStatusCodeColor(stat._id));

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    };
  };

  // HTTP 메서드별 분포 차트 데이터
  const getMethodChartData = () => {
    if (!dashboardData?.methodStats) return null;

    const labels = dashboardData.methodStats.map(stat => stat._id);
    const data = dashboardData.methodStats.map(stat => stat.count);
    const backgroundColor = dashboardData.methodStats.map(stat => getMethodColor(stat._id));

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    };
  };

  // 인기 경로별 차트 데이터
  const getPathChartData = () => {
    if (!dashboardData?.pathStats) return null;

    const labels = dashboardData.pathStats
      .slice(0, 8)
      .map(stat => (stat._id.length > 20 ? stat._id.substring(0, 20) + '...' : stat._id));
    const data = dashboardData.pathStats.slice(0, 8).map(stat => stat.count);

    return {
      labels,
      datasets: [
        {
          label: '요청 수',
          data,
          backgroundColor: 'rgba(76, 175, 80, 0.8)',
          borderColor: '#4CAF50',
          borderWidth: 1
        }
      ]
    };
  };

  if (loading) {
    return <div className="traffic-loading">트래픽 데이터를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="traffic-error">{error}</div>;
  }

  return (
    <div className="traffic-dashboard">
      <div className="traffic-header">
        <h2>트래픽 대시보드</h2>
        <div className="period-selector">
          <select value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="1h">최근 1시간</option>
            <option value="6h">최근 6시간</option>
            <option value="24h">최근 24시간</option>
            <option value="7d">최근 7일</option>
            <option value="30d">최근 30일</option>
          </select>
        </div>
      </div>

      {dashboardData && (
        <>
          {/* 요약 통계 */}
          <div className="summary-stats">
            <div className="stat-card">
              <h3>총 요청 수</h3>
              <p className="stat-number">{dashboardData.summary.totalRequests.toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <h3>고유 사용자</h3>
              <p className="stat-number">{dashboardData.summary.uniqueUsers.toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <h3>평균 응답 시간</h3>
              <p className="stat-number">{Math.round(dashboardData.summary.avgResponseTime)}ms</p>
            </div>
          </div>

          {/* 차트 섹션 */}
          <div className="charts-section">
            {/* 시간별 요청 수 차트 */}
            {getHourlyChartData() && (
              <div className="chart-container">
                <h3>시간별 요청 수 (EST/EDT)</h3>
                <Line
                  data={getHourlyChartData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0, // 정수로만 표시
                          callback: function(value) {
                            return value.toLocaleString(); // 천 단위 구분
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            )}

            {/* 차트 그리드 */}
            <div className="charts-grid">
              {/* 상태 코드별 분포 */}
              {getStatusCodeChartData() && (
                <div className="chart-container">
                  <h3>HTTP 상태 코드별 분포</h3>
                  <Doughnut
                    data={getStatusCodeChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </div>
              )}

              {/* HTTP 메서드별 분포 */}
              {getMethodChartData() && (
                <div className="chart-container">
                  <h3>HTTP 메서드별 분포</h3>
                  <Doughnut
                    data={getMethodChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* 인기 경로별 차트 */}
            {getPathChartData() && (
              <div className="chart-container">
                <h3>인기 경로별 요청 수 (상위 8개)</h3>
                <Bar
                  data={getPathChartData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0, // 정수로만 표시
                          callback: function(value) {
                            return value.toLocaleString(); // 천 단위 구분
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* 기존 통계 섹션들 */}
          <div className="stats-section">
            <h3>HTTP 상태 코드별 통계</h3>
            <div className="status-code-stats">
              {dashboardData.statusCodeStats.map(stat => (
                <div key={stat._id} className="status-code-item">
                  <span
                    className="status-code"
                    style={{ backgroundColor: getStatusCodeColor(stat._id) }}
                  >
                    {stat._id}
                  </span>
                  <span className="status-count">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="stats-section">
            <h3>HTTP 메서드별 통계</h3>
            <div className="method-stats">
              {dashboardData.methodStats.map(stat => (
                <div key={stat._id} className="method-item">
                  <span
                    className="method-badge"
                    style={{ backgroundColor: getMethodColor(stat._id) }}
                  >
                    {stat._id}
                  </span>
                  <span className="method-count">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="stats-section">
            <h3>인기 경로별 통계 (상위 10개)</h3>
            <div className="path-stats">
              <table className="path-table">
                <thead>
                  <tr>
                    <th>경로</th>
                    <th>요청 수</th>
                    <th>평균 응답 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.pathStats.map(stat => (
                    <tr key={stat._id}>
                      <td className="path-name">{stat._id}</td>
                      <td className="path-count">{stat.count}</td>
                      <td className="path-response-time">{Math.round(stat.avgResponseTime)}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 에러 통계 */}
          {dashboardData.errorStats.length > 0 && (
            <div className="stats-section">
              <h3>에러 통계</h3>
              <div className="error-stats">
                {dashboardData.errorStats.map(stat => (
                  <div key={stat._id} className="error-item">
                    <span className="error-code">{stat._id}</span>
                    <span className="error-count">{stat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 사용자 권한별 통계 */}
          {dashboardData.authorityStats.length > 0 && (
            <div className="stats-section">
              <h3>사용자 권한별 통계</h3>
              <div className="authority-stats">
                {dashboardData.authorityStats.map(stat => (
                  <div key={stat._id} className="authority-item">
                    <span className="authority-label">{getAuthorityLabel(stat._id)}</span>
                    <span className="authority-count">{stat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 실시간 트래픽 */}
      <div className="stats-section">
        <h3>실시간 트래픽 (최근 1시간)</h3>
        <div className="realtime-traffic">
          {realtimeData.length > 0 ? (
            <div className="traffic-list">
              {realtimeData.slice(0, 20).map((log, index) => (
                <div key={index} className="traffic-item">
                  <div className="traffic-time">{new Date(log.timestamp).toLocaleTimeString('en-US', { timeZone: 'America/New_York' })}</div>
                  <div className="traffic-method">
                    <span
                      className="method-badge"
                      style={{ backgroundColor: getMethodColor(log.method) }}
                    >
                      {log.method}
                    </span>
                  </div>
                  <div className="traffic-path">{log.path}</div>
                  <div className="traffic-status">
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusCodeColor(log.statusCode) }}
                    >
                      {log.statusCode}
                    </span>
                  </div>
                  <div className="traffic-response-time">{log.responseTime}ms</div>
                  <div className="traffic-user">{log.userId ? log.userId.id : '익명'}</div>
                </div>
              ))}
            </div>
          ) : (
            <p>실시간 트래픽 데이터가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrafficDashboard;

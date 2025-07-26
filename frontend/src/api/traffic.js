import apiClient from './client';

/**
 * 트래픽 대시보드 데이터 조회
 * @param {string} period - 조회 기간 (1h, 6h, 24h, 7d, 30d)
 * @returns {Promise} 트래픽 대시보드 데이터
 */
export const getTrafficDashboard = async (period = '24h') => {
  return apiClient.get(`/api/traffic/dashboard?period=${period}`);
};

/**
 * 실시간 트래픽 데이터 조회
 * @returns {Promise} 실시간 트래픽 데이터
 */
export const getRealtimeTraffic = async () => {
  return apiClient.get('/api/traffic/realtime');
};

/**
 * 특정 경로 트래픽 분석
 * @param {string} path - 분석할 API 경로
 * @param {string} period - 조회 기간 (24h, 7d)
 * @returns {Promise} 경로별 트래픽 분석 데이터
 */
export const getPathAnalysis = async (path, period = '24h') => {
  return apiClient.get(`/api/traffic/analysis/${encodeURIComponent(path)}?period=${period}`);
};

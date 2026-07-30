const express = require('express');
const router = express.Router();
const {
  getTrafficDashboard,
  getRealtimeTraffic,
  getPathAnalysis,
  getTrafficTrend
} = require('../controllers/trafficController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/traffic/dashboard:
 *   get:
 *     summary: 트래픽 대시보드 데이터 조회
 *     description: 관리자용 트래픽 대시보드 데이터를 조회합니다.
 *     tags: [Traffic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 24h, 7d, 30d]
 *         description: 조회 기간 (기본값 24h)
 *     responses:
 *       200:
 *         description: 트래픽 대시보드 데이터
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalRequests:
 *                           type: number
 *                         uniqueUsers:
 *                           type: number
 *                         avgResponseTime:
 *                           type: number
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 부족
 */
router.get('/dashboard', authenticateToken, requireAdmin, getTrafficDashboard);

/**
 * @swagger
 * /api/traffic/realtime:
 *   get:
 *     summary: 실시간 트래픽 데이터 조회
 *     description: 최근 1시간의 실시간 트래픽 데이터를 조회합니다.
 *     tags: [Traffic]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 실시간 트래픽 데이터
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 부족
 */
router.get('/realtime', authenticateToken, requireAdmin, getRealtimeTraffic);

/**
 * @swagger
 * /api/traffic/analysis/{path}:
 *   get:
 *     summary: 특정 경로 트래픽 분석
 *     description: 특정 API 경로의 상세 트래픽 분석 데이터를 조회합니다.
 *     tags: [Traffic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 분석할 API 경로
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [24h, 7d]
 *         description: 조회 기간 (기본값 24h)
 *     responses:
 *       200:
 *         description: 경로별 트래픽 분석 데이터
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 부족
 */
router.get('/analysis/:path', authenticateToken, requireAdmin, getPathAnalysis);

/**
 * @swagger
 * /api/traffic/trend:
 *   get:
 *     summary: 일별 트래픽 추세 조회
 *     description: TrafficDaily 집계 컬렉션을 기반으로 최근 N일의 일별 트래픽 추세를 조회합니다. (30일 TTL을 넘는 장기 추세 조회 가능)
 *     tags: [Traffic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *         description: 조회할 일수 (기본값 30, 최대 365)
 *     responses:
 *       200:
 *         description: 일별 트래픽 추세 데이터
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 부족
 */
router.get('/trend', authenticateToken, requireAdmin, getTrafficTrend);

module.exports = router;

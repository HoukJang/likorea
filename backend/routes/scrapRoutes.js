const express = require('express');
const {
  toggleScrap,
  getUserScraps,
  checkScrapStatus,
  getScrapCount,
  getAllScrapsAdmin
} = require('../controllers/scrapController');
const { authenticateToken, requireAuth } = require('../middleware/auth');
const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken, requireAuth);

/**
 * @swagger
 * tags:
 *   name: Scraps
 *   description: 스크랩 관리 API
 */

/**
 * @swagger
 * /api/scraps/toggle/{postId}:
 *   post:
 *     summary: 스크랩 추가/제거 토글
 *     tags: [Scraps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시글 ID
 *     responses:
 *       200:
 *         description: 스크랩 토글 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 isScraped:
 *                   type: boolean
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 게시글을 찾을 수 없음
 */
router.post('/toggle/:postId', toggleScrap);

/**
 * @swagger
 * /api/scraps/user:
 *   get:
 *     summary: 사용자의 스크랩 목록 조회
 *     tags: [Scraps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 페이지당 항목 수
 *     responses:
 *       200:
 *         description: 스크랩 목록 조회 성공
 *       401:
 *         description: 인증 실패
 */
router.get('/user', getUserScraps);

/**
 * @swagger
 * /api/scraps/check/{postId}:
 *   get:
 *     summary: 특정 게시글의 스크랩 여부 확인
 *     tags: [Scraps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시글 ID
 *     responses:
 *       200:
 *         description: 스크랩 상태 확인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 isScraped:
 *                   type: boolean
 *       401:
 *         description: 인증 실패
 */
router.get('/check/:postId', checkScrapStatus);

/**
 * @swagger
 * /api/scraps/count/{postId}:
 *   get:
 *     summary: 특정 게시글의 스크랩 수 조회
 *     tags: [Scraps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시글 ID
 *     responses:
 *       200:
 *         description: 스크랩 수 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *       401:
 *         description: 인증 실패
 */
router.get('/count/:postId', getScrapCount);

/**
 * @swagger
 * /api/scraps/admin/all:
 *   get:
 *     summary: 전체 스크랩 목록 조회 (관리자용)
 *     tags: [Scraps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, postTitle, userId]
 *           default: createdAt
 *         description: 정렬 필드
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 정렬 순서
 *     responses:
 *       200:
 *         description: 전체 스크랩 목록 조회 성공
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 관리자 권한 필요
 */
router.get('/admin/all', getAllScrapsAdmin);

module.exports = router;
const express = require('express');
const {
  sendMessage,
  getInbox,
  getSentMessages,
  getMessage,
  markAsRead,
  deleteMessage,
  getUnreadCount,
  getConversation
} = require('../controllers/messageController');
const { authenticateToken, requireAuth } = require('../middleware/auth');
const { createRateLimiters } = require('../middleware/security');
const router = express.Router();

// 메시지 전송 레이트 리미터 생성
const { messageLimiter } = createRateLimiters();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken, requireAuth);

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: 메시지(쪽지) 관리 API
 */

/**
 * @swagger
 * /api/messages/send:
 *   post:
 *     summary: 메시지 전송
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *               - subject
 *               - content
 *             properties:
 *               receiverId:
 *                 type: string
 *                 description: 수신자 ID
 *               subject:
 *                 type: string
 *                 description: 제목 (최대 100자)
 *               content:
 *                 type: string
 *                 description: 내용 (최대 1000자)
 *     responses:
 *       201:
 *         description: 메시지 전송 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 수신자를 찾을 수 없음
 */
router.post('/send', messageLimiter, sendMessage);

/**
 * @swagger
 * /api/messages/inbox:
 *   get:
 *     summary: 받은 메시지함 조회
 *     tags: [Messages]
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
 *         description: 받은 메시지 목록 조회 성공
 *       401:
 *         description: 인증 실패
 */
router.get('/inbox', getInbox);

/**
 * @swagger
 * /api/messages/sent:
 *   get:
 *     summary: 보낸 메시지함 조회
 *     tags: [Messages]
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
 *         description: 보낸 메시지 목록 조회 성공
 *       401:
 *         description: 인증 실패
 */
router.get('/sent', getSentMessages);

/**
 * @swagger
 * /api/messages/unread-count:
 *   get:
 *     summary: 읽지 않은 메시지 수 조회
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 읽지 않은 메시지 수 조회 성공
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
 *                     count:
 *                       type: integer
 *       401:
 *         description: 인증 실패
 */
router.get('/unread-count', getUnreadCount);

/**
 * @swagger
 * /api/messages/conversation/{otherUserId}:
 *   get:
 *     summary: 특정 사용자와의 대화 조회
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: otherUserId
 *         required: true
 *         schema:
 *           type: string
 *         description: 대화 상대방 사용자 ID
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
 *         description: 대화 메시지 조회 성공
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.get('/conversation/:otherUserId', getConversation);

/**
 * @swagger
 * /api/messages/{messageId}:
 *   get:
 *     summary: 특정 메시지 조회
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: 메시지 ID
 *     responses:
 *       200:
 *         description: 메시지 조회 성공
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 메시지를 찾을 수 없음
 */
router.get('/:messageId', getMessage);

/**
 * @swagger
 * /api/messages/{messageId}/read:
 *   put:
 *     summary: 메시지 읽음 처리
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: 메시지 ID
 *     responses:
 *       200:
 *         description: 메시지 읽음 처리 성공
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 메시지를 찾을 수 없음
 */
router.put('/:messageId/read', markAsRead);

/**
 * @swagger
 * /api/messages/{messageId}:
 *   delete:
 *     summary: 메시지 삭제
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: 메시지 ID
 *     responses:
 *       200:
 *         description: 메시지 삭제 성공
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 메시지를 찾을 수 없음
 */
router.delete('/:messageId', deleteMessage);

module.exports = router;
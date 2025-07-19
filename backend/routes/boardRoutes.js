const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const commentController = require('../controllers/commentController');
const { createRateLimiters } = require('../middleware/security');
const { validatePostInput, validateCommentInput, validateParams } = require('../middleware/validation');
const { authenticateToken, requireAuthority } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Boards
 *   description: 게시판 관리 API
 */

const { postLimiter } = createRateLimiters();

/**
 * @swagger
 * /api/boards/{boardType}:
 *   post:
 *     summary: 게시글 생성
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardType
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시판 타입 (예: general, notice)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: 게시글 제목
 *               content:
 *                 type: string
 *                 description: 게시글 내용
 *     responses:
 *       201:
 *         description: 게시글 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 post:
 *                   $ref: '#/components/schemas/BoardPost'
 *       400:
 *         description: 유효하지 않은 입력
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 인증 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:boardType', validateParams, authenticateToken, requireAuthority(1), postLimiter, validatePostInput, boardController.createPost);

/**
 * @swagger
 * /api/boards/{boardType}:
 *   get:
 *     summary: 게시글 목록 조회
 *     tags: [Boards]
 *     parameters:
 *       - in: path
 *         name: boardType
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시판 타입
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
 *           default: 10
 *         description: 페이지당 항목 수
 *     responses:
 *       200:
 *         description: 게시글 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BoardPost'
 *                 totalPosts:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */
router.get('/:boardType', validateParams, boardController.getPosts);

/**
 * @swagger
 * /api/boards/{boardType}/{postId}:
 *   get:
 *     summary: 게시글 상세 조회
 *     tags: [Boards]
 *     parameters:
 *       - in: path
 *         name: boardType
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시판 타입
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시글 ID
 *     responses:
 *       200:
 *         description: 게시글 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 post:
 *                   $ref: '#/components/schemas/BoardPost'
 *       404:
 *         description: 게시글을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:boardType/:postId', validateParams, boardController.getPost);

/**
 * @swagger
 * /api/boards/{boardType}/{postId}:
 *   put:
 *     summary: 게시글 수정
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardType
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시판 타입
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시글 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: 게시글 제목
 *               content:
 *                 type: string
 *                 description: 게시글 내용
 *     responses:
 *       200:
 *         description: 게시글 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 post:
 *                   $ref: '#/components/schemas/BoardPost'
 *       401:
 *         description: 인증 필요 또는 권한 부족
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 게시글을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:boardType/:postId', validateParams, authenticateToken, requireAuthority(1), validatePostInput, boardController.updatePost);

/**
 * @swagger
 * /api/boards/{boardType}/{postId}:
 *   delete:
 *     summary: 게시글 삭제
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardType
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시판 타입
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시글 ID
 *     responses:
 *       200:
 *         description: 게시글 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: 인증 필요 또는 권한 부족
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 게시글을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:boardType/:postId', validateParams, authenticateToken, requireAuthority(1), boardController.deletePost);

/**
 * @swagger
 * /api/boards/{boardType}/{postId}/comments:
 *   post:
 *     summary: 댓글 생성
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardType
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시판 타입
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시글 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: 댓글 내용
 *     responses:
 *       201:
 *         description: 댓글 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 comment:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: 유효하지 않은 입력
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 인증 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:boardType/:postId/comments', validateParams, authenticateToken, requireAuthority(1), postLimiter, validateCommentInput, commentController.createComment);

/**
 * @swagger
 * /api/boards/{boardType}/{postId}/comments:
 *   get:
 *     summary: 댓글 목록 조회
 *     tags: [Boards]
 *     parameters:
 *       - in: path
 *         name: boardType
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시판 타입
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시글 ID
 *     responses:
 *       200:
 *         description: 댓글 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 */
router.get('/:boardType/:postId/comments', validateParams, commentController.getComments);

/**
 * @swagger
 * /api/boards/{boardType}/{postId}/comments/{commentId}:
 *   put:
 *     summary: 댓글 수정
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardType
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시판 타입
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시글 ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 댓글 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: 댓글 내용
 *     responses:
 *       200:
 *         description: 댓글 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 comment:
 *                   $ref: '#/components/schemas/Comment'
 *       401:
 *         description: 인증 필요 또는 권한 부족
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 댓글을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:boardType/:postId/comments/:commentId', validateParams, authenticateToken, requireAuthority(1), validateCommentInput, commentController.updateComment);

/**
 * @swagger
 * /api/boards/{boardType}/{postId}/comments/{commentId}:
 *   delete:
 *     summary: 댓글 삭제
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardType
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시판 타입
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시글 ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 댓글 ID
 *     responses:
 *       200:
 *         description: 댓글 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: 인증 필요 또는 권한 부족
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 댓글을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:boardType/:postId/comments/:commentId', validateParams, authenticateToken, requireAuthority(1), commentController.deleteComment);

module.exports = router;
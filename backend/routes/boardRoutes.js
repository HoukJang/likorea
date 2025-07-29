const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const commentController = require('../controllers/commentController');
const { createRateLimiters } = require('../middleware/security');
const {
  validatePostInput,
  validateCommentInput,
  validateParams,
} = require('../middleware/validation');
const { authenticateToken, requireAuthority } = require('../middleware/auth');
const { cache, invalidatePostCache } = require('../middleware/cache');

/**
 * @swagger
 * tags:
 *   name: Boards
 *   description: 게시판 관리 API
 */

const { postLimiter } = createRateLimiters();

/**
 * @swagger
 * /api/boards:
 *   post:
 *     summary: 게시글 생성
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - tags
 *             properties:
 *               title:
 *                 type: string
 *                 description: 게시글 제목
 *               content:
 *                 type: string
 *                 description: 게시글 내용
 *               tags:
 *                 type: object
 *                 required:
 *                   - type
 *                   - region
 *                 properties:
 *                   type:
 *                     type: string
 *                     description: 게시글 타입 태그
 *                   region:
 *                     type: string
 *                     description: 게시글 지역 태그
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
router.post(
  '/',
  authenticateToken,
  requireAuthority(1),
  postLimiter,
  validatePostInput,
  invalidatePostCache,
  boardController.createPost
);

/**
 * @swagger
 * /api/boards:
 *   get:
 *     summary: 게시글 목록 조회
 *     tags: [Boards]
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
 *           default: 10
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: 타입 태그 필터
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *         description: 지역 태그 필터
 *       - in: query
 *         name: subcategory
 *         schema:
 *           type: string
 *         description: 소주제 필터
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 검색어
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
 *                 filters:
 *                   type: object
 */
router.get('/', cache(), boardController.getPosts);

/**
 * @swagger
 * /api/boards/subcategories:
 *   get:
 *     summary: 소주제 정보 조회
 *     tags: [Boards]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: 글종류 (선택사항, 없으면 전체 소주제 반환)
 *     responses:
 *       200:
 *         description: 소주제 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 subCategories:
 *                   type: object
 *                   description: 글종류별 소주제 목록
 */
router.get('/subcategories', cache(), boardController.getSubCategories);

/**
 * @swagger
 * /api/boards/{postId}:
 *   get:
 *     summary: 게시글 상세 조회
 *     tags: [Boards]
 *     parameters:
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
router.get('/:postId', validateParams, cache(), boardController.getPost);

/**
 * @swagger
 * /api/boards/{postId}:
 *   put:
 *     summary: 게시글 수정
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *               tags:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     description: 게시글 타입 태그
 *                   region:
 *                     type: string
 *                     description: 게시글 지역 태그
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
router.put(
  '/:postId',
  validateParams,
  authenticateToken,
  requireAuthority(1),
  validatePostInput,
  invalidatePostCache,
  boardController.updatePost
);

/**
 * @swagger
 * /api/boards/{postId}:
 *   delete:
 *     summary: 게시글 삭제
 *     tags: [Boards]
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
router.delete(
  '/:postId',
  validateParams,
  authenticateToken,
  requireAuthority(1),
  invalidatePostCache,
  boardController.deletePost
);

// 댓글 관련 라우트
router.get('/:postId/comments', validateParams, commentController.getComments);
router.post(
  '/:postId/comments',
  validateParams,
  authenticateToken,
  commentController.createComment
);
router.put(
  '/:postId/comments/:commentId',
  validateParams,
  authenticateToken,
  requireAuthority(1),
  validateCommentInput,
  commentController.updateComment
);
router.delete(
  '/:postId/comments/:commentId',
  validateParams,
  authenticateToken,
  requireAuthority(1),
  commentController.deleteComment
);

module.exports = router;

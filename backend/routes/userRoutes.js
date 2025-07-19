const express = require('express');
const { signup, login, logout, getUsers, getUser, checkEmailExists, checkIdExists, updateUser, deleteUser, verifyToken } = require('../controllers/userController');
const { createRateLimiters } = require('../middleware/security');
const { validateUserInput } = require('../middleware/validation');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 사용자 관리 API
 */

const { loginLimiter, signupLimiter } = createRateLimiters();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 사용자 목록 조회
 *     tags: [Users]
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
 *     responses:
 *       200:
 *         description: 사용자 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/', getUsers);

/**
 * @swagger
 * /api/users/exists:
 *   get:
 *     summary: 이메일 중복 확인
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: 확인할 이메일
 *     responses:
 *       200:
 *         description: 이메일 중복 확인 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 */
router.get('/exists', checkEmailExists);

/**
 * @swagger
 * /api/users/exists-id:
 *   get:
 *     summary: 아이디 중복 확인
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 확인할 아이디
 *     responses:
 *       200:
 *         description: 아이디 중복 확인 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 */
router.get('/exists-id', checkIdExists);

/**
 * @swagger
 * /api/users/verify:
 *   get:
 *     summary: 토큰 유효성 검증
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 토큰 유효성 검증 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 토큰이 유효하지 않음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/verify', verifyToken);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 사용자 상세 정보 조회
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: 사용자를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getUser);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 회원가입
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - email
 *               - password
 *             properties:
 *               id:
 *                 type: string
 *                 description: 사용자 ID
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 이메일
 *               password:
 *                 type: string
 *                 description: 비밀번호
 *               authority:
 *                 type: integer
 *                 default: 1
 *                 description: 권한 레벨 (1-5)
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: 유효하지 않은 입력
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: 중복된 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', signupLimiter, validateUserInput, signup);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: 사용자 정보 수정
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               authority:
 *                 type: integer
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 사용자 정보 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: 사용자를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', validateUserInput, updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: 사용자 삭제
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: 사용자를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', deleteUser);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: 로그인
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - password
 *             properties:
 *               id:
 *                 type: string
 *                 description: 사용자 ID
 *               password:
 *                 type: string
 *                 description: 비밀번호
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', loginLimiter, validateUserInput, login);

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: 로그아웃
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/logout', logout);

module.exports = router;
const express = require('express');
const { signup, login, logout, getUsers, getUser, checkEmailExists, checkIdExists, updateUser, deleteUser, verifyToken } = require('../controllers/userController');
const router = express.Router();

// 사용자 목록 조회
router.get('/', getUsers);
// 이메일 중복 여부 확인
router.get('/exists', checkEmailExists);
// 아이디 중복 여부 확인
router.get('/exists-id', checkIdExists);
// 토큰 유효성 검증
router.get('/verify', verifyToken);
// 사용자 상세 정보 조회
router.get('/:id', getUser);
// 신규 사용자 등록
router.post('/', signup);
// 사용자 정보 수정
router.put('/:id', updateUser);
// 사용자 삭제
router.delete('/:id', deleteUser);

// 인증 관련 API
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;
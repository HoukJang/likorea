const express = require('express');
const { signup, login, getUsers, getUser, checkEmailExists, logout } = require('../controllers/userController');
const router = express.Router();

// 사용자 목록 조회
router.get('/', getUsers);
// 이메일 중복 여부 확인 ("/exists" 라우트는 ":id"보다 위에 있어야 함)
router.get('/exists', checkEmailExists);
// 사용자 상세 정보 조회
router.get('/:id', getUser);
// 신규 사용자 등록
router.post('/', signup);

// 인증 관련 API
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;
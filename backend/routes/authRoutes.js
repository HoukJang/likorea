const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 회원가입 라우트: POST /api/signup
router.post('/signup', authController.signup);

// 로그인 라우트: POST /api/login
router.post('/login', authController.login);

module.exports = router;
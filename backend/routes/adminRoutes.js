const express = require('express');
const { getAllUsers, getStats, getAllBoards, createBoardType } = require('../controllers/adminController');
const router = express.Router();

// 관리자 전용 API 엔드포인트
router.get('/users', getAllUsers);
router.get('/stats', getStats);
router.get('/boards', getAllBoards);
router.post('/boards', createBoardType);

module.exports = router;

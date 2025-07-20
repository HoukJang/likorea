const express = require('express');
const { 
  getAllUsers, 
  getStats, 
  getAllBoards, 
  createBoardType,
  updateUserAuthority,
  updateUserInfo,
  deleteUser,
  getUserDetails
} = require('../controllers/adminController');
const router = express.Router();

// 관리자 전용 API 엔드포인트
router.get('/users', getAllUsers);
router.get('/stats', getStats);
router.get('/boards', getAllBoards);
router.post('/boards', createBoardType);

// 사용자 관리 API
router.get('/users/:userId', getUserDetails);
router.put('/users/:userId/authority', updateUserAuthority);
router.put('/users/:userId', updateUserInfo);
router.delete('/users/:userId', deleteUser);

module.exports = router;

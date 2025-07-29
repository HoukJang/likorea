const express = require('express');
const {
  getAllUsers,
  getStats,
  getAllBoards,
  createBoardType,
  updateUserAuthority,
  updateUserInfo,
  deleteUser,
  getUserDetails,
} = require('../controllers/adminController');
const { getCacheStats, clearCache, invalidateCache } = require('../middleware/cache');
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

// 캐시 관리 API (관리자 전용)
router.get('/cache/stats', (req, res) => {
  const stats = getCacheStats();
  res.json({ success: true, stats });
});

router.delete('/cache', (req, res) => {
  clearCache();
  res.json({ success: true, message: '전체 캐시가 초기화되었습니다.' });
});

router.delete('/cache/:pattern', (req, res) => {
  const { pattern } = req.params;
  const deletedCount = invalidateCache(pattern);
  res.json({ 
    success: true, 
    message: `${deletedCount}개의 캐시 항목이 삭제되었습니다.`,
    pattern 
  });
});

module.exports = router;

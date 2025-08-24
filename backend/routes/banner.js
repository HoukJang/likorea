const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const bannerController = require('../controllers/bannerController');

// 공개 라우트
router.get('/active', bannerController.getActiveBanner);

// 관리자 전용 라우트 (인증 + 관리자 권한 확인)
router.get('/', authenticateToken, requireAdmin, bannerController.getAllBanners);
router.post('/', authenticateToken, requireAdmin, bannerController.createBanner);
router.put('/:bannerId', authenticateToken, requireAdmin, bannerController.updateBanner);
router.delete('/:bannerId', authenticateToken, requireAdmin, bannerController.deleteBanner);
router.patch('/:bannerId/toggle', authenticateToken, requireAdmin, bannerController.toggleBannerStatus);

module.exports = router;
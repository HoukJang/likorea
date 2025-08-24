const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const bannerController = require('../controllers/bannerController');

// 공개 라우트
router.get('/active', bannerController.getActiveBanner);

// 관리자 전용 라우트
router.get('/', adminAuth, bannerController.getAllBanners);
router.post('/', adminAuth, bannerController.createBanner);
router.put('/:bannerId', adminAuth, bannerController.updateBanner);
router.delete('/:bannerId', adminAuth, bannerController.deleteBanner);
router.patch('/:bannerId/toggle', adminAuth, bannerController.toggleBannerStatus);

module.exports = router;
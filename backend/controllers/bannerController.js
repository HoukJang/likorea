const Banner = require('../models/Banner');
const { asyncHandler } = require('../middleware/errorHandler');

// 활성 배너 조회 (모든 사용자)
exports.getActiveBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findActiveBanner();

  if (!banner) {
    return res.json({ banner: null });
  }

  res.json({
    banner: {
      id: banner._id,
      message: banner.message,
      type: banner.type,
      icon: banner.icon,
      link: banner.link,
      dismissible: banner.dismissible
    }
  });
});

// 모든 배너 조회 (관리자)
exports.getAllBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find()
    .populate('createdBy', 'id')
    .sort({ createdAt: -1 });

  res.json({ banners });
});

// 배너 생성 (관리자)
exports.createBanner = asyncHandler(async (req, res) => {
  const { message, type, icon, link, endDate, dismissible, priority } = req.body;

  // 날짜 유효성 검사
  const endDateObj = new Date(endDate);
  if (endDateObj <= new Date()) {
    return res.status(400).json({ message: '종료일은 현재 시간 이후여야 합니다.' });
  }

  const banner = new Banner({
    message,
    type: type || 'info',
    icon: icon || '📢',
    link: link || undefined,
    endDate: endDateObj,
    dismissible: dismissible !== false,
    priority: priority || 0,
    createdBy: req.user._id
  });

  await banner.save();

  res.status(201).json({
    message: '배너가 생성되었습니다.',
    banner
  });
});

// 배너 수정 (관리자)
exports.updateBanner = asyncHandler(async (req, res) => {
  const { bannerId } = req.params;
  const updates = req.body;

  // 종료일 유효성 검사
  if (updates.endDate) {
    const endDateObj = new Date(updates.endDate);
    if (endDateObj <= new Date()) {
      return res.status(400).json({ message: '종료일은 현재 시간 이후여야 합니다.' });
    }
  }

  const banner = await Banner.findByIdAndUpdate(
    bannerId,
    updates,
    { new: true, runValidators: true }
  );

  if (!banner) {
    return res.status(404).json({ message: '배너를 찾을 수 없습니다.' });
  }

  res.json({
    message: '배너가 수정되었습니다.',
    banner
  });
});

// 배너 삭제 (관리자)
exports.deleteBanner = asyncHandler(async (req, res) => {
  const { bannerId } = req.params;

  const banner = await Banner.findByIdAndDelete(bannerId);

  if (!banner) {
    return res.status(404).json({ message: '배너를 찾을 수 없습니다.' });
  }

  res.json({ message: '배너가 삭제되었습니다.' });
});

// 배너 활성화/비활성화 토글 (관리자)
exports.toggleBannerStatus = asyncHandler(async (req, res) => {
  const { bannerId } = req.params;

  const banner = await Banner.findById(bannerId);

  if (!banner) {
    return res.status(404).json({ message: '배너를 찾을 수 없습니다.' });
  }

  banner.isActive = !banner.isActive;
  await banner.save();

  res.json({
    message: `배너가 ${banner.isActive ? '활성화' : '비활성화'}되었습니다.`,
    banner
  });
});

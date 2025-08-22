const Scrap = require('../models/Scrap');
const BoardPost = require('../models/BoardPost');

// 스크랩 토글 (추가/제거)
exports.toggleScrap = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    // 게시글 존재 여부 확인
    const post = await BoardPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    // 기존 스크랩 확인
    const existingScrap = await Scrap.findOne({ user: userId, post: postId });

    if (existingScrap) {
      // 스크랩 제거
      await Scrap.deleteOne({ _id: existingScrap._id });
      return res.json({ 
        success: true, 
        message: '스크랩이 취소되었습니다.',
        isScraped: false 
      });
    } else {
      // 스크랩 추가
      const newScrap = new Scrap({
        user: userId,
        post: postId
      });
      await newScrap.save();
      return res.json({ 
        success: true, 
        message: '스크랩되었습니다.',
        isScraped: true 
      });
    }
  } catch (error) {
    console.error('스크랩 토글 에러:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 사용자의 스크랩 목록 조회
exports.getUserScraps = async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // 전체 스크랩 수
    const totalCount = await Scrap.countDocuments({ user: userId });

    // 스크랩 목록 조회 (최신순)
    const scraps = await Scrap.find({ user: userId })
      .populate({
        path: 'post',
        populate: [
          { path: 'author', select: 'id' },
          { path: 'tags' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 삭제된 게시글 필터링
    const validScraps = scraps.filter(scrap => scrap.post !== null);

    return res.json({
      success: true,
      scraps: validScraps,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    });
  } catch (error) {
    console.error('스크랩 목록 조회 에러:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 특정 게시글의 스크랩 여부 확인
exports.checkScrapStatus = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const scrap = await Scrap.findOne({ user: userId, post: postId });
    
    return res.json({
      success: true,
      isScraped: !!scrap
    });
  } catch (error) {
    console.error('스크랩 상태 확인 에러:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 게시글의 스크랩 수 조회
exports.getScrapCount = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const count = await Scrap.countDocuments({ post: postId });
    
    return res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('스크랩 수 조회 에러:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 전체 스크랩 목록 조회 (관리자용)
exports.getAllScrapsAdmin = async (req, res) => {
  try {
    // 관리자 권한 확인
    if (req.userAuthority !== 5) {
      return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // 정렬 옵션 설정
    let sortOptions = {};
    switch (sortBy) {
      case 'postTitle':
        sortOptions = { 'post.title': sortOrder };
        break;
      case 'userId':
        sortOptions = { 'user.id': sortOrder };
        break;
      default:
        sortOptions = { createdAt: sortOrder };
    }

    // 전체 스크랩 수
    const totalCount = await Scrap.countDocuments();

    // 스크랩 목록 조회
    const scraps = await Scrap.find()
      .populate({
        path: 'user',
        select: 'id email'
      })
      .populate({
        path: 'post',
        populate: [
          { path: 'author', select: 'id' },
          { path: 'tags' }
        ]
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // 삭제된 게시글이나 사용자가 있는 스크랩도 포함 (null 체크는 프론트엔드에서)
    
    return res.json({
      success: true,
      scraps,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    });
  } catch (error) {
    console.error('전체 스크랩 목록 조회 에러:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};
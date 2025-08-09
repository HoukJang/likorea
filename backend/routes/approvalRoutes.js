const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const BoardPost = require('../models/BoardPost');
const Bot = require('../models/Bot');
const sanitizeHtml = require('sanitize-html');

// 승인 대기 게시글 목록 조회 (관리자만)
router.get('/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, botId } = req.query;
    const skip = (page - 1) * limit;

    const query = { isApproved: false, isBot: true };
    if (botId) {
      query.botId = botId;
    }

    const [posts, total] = await Promise.all([
      BoardPost.find(query)
        .populate('author', 'id profile.nickname')
        .populate('botId', 'name')
        .select('postNumber title content tags createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      BoardPost.countDocuments(query)
    ]);

    res.json({
      posts,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching pending posts:', error);
    res.status(500).json({
      error: '승인 대기 게시글을 불러오는데 실패했습니다',
      details: error.message
    });
  }
});

// 특정 승인 대기 게시글 조회 (관리자만)
router.get('/pending/:postId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await BoardPost.findOne({
      _id: postId,
      isApproved: false,
      isBot: true
    })
    .populate('author', 'id profile.nickname')
    .populate('botId', 'name aiModel');

    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Error fetching pending post:', error);
    res.status(500).json({
      error: '게시글을 불러오는데 실패했습니다',
      details: error.message
    });
  }
});

// 승인 대기 게시글 편집 (관리자만)
router.put('/pending/:postId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content, tags } = req.body;

    const post = await BoardPost.findOne({
      _id: postId,
      isApproved: false,
      isBot: true
    });

    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다' });
    }

    // 업데이트할 필드
    if (title) post.title = title;
    if (content) {
      // HTML 정화
      post.content = sanitizeHtml(content, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          img: ['src', 'alt', 'width', 'height']
        }
      });
    }
    if (tags) post.tags = { ...post.tags, ...tags };

    post.modifiedAt = new Date();
    await post.save();

    res.json({
      success: true,
      message: '게시글이 수정되었습니다',
      post
    });
  } catch (error) {
    console.error('Error updating pending post:', error);
    res.status(500).json({
      error: '게시글 수정에 실패했습니다',
      details: error.message
    });
  }
});

// 게시글 승인 (관리자만)
router.post('/approve/:postId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await BoardPost.findOne({
      _id: postId,
      isApproved: false,
      isBot: true
    });

    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다' });
    }

    // 승인 처리
    post.isApproved = true;
    post.approvedBy = req.user._id;
    post.approvedAt = new Date();
    await post.save();

    // 봇 통계 업데이트
    if (post.botId) {
      await Bot.findByIdAndUpdate(post.botId, {
        $inc: { 'stats.postsCreated': 1 },
        lastActivity: new Date()
      });
    }

    res.json({
      success: true,
      message: '게시글이 승인되었습니다',
      post
    });
  } catch (error) {
    console.error('Error approving post:', error);
    res.status(500).json({
      error: '게시글 승인에 실패했습니다',
      details: error.message
    });
  }
});

// 게시글 거절 (관리자만)
router.post('/reject/:postId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;

    const post = await BoardPost.findOne({
      _id: postId,
      isApproved: false,
      isBot: true
    });

    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다' });
    }

    // 거절 사유 저장 후 삭제
    console.log(`게시글 거절: ${post.title}, 사유: ${reason || '관리자 판단'}`);

    await post.deleteOne();

    res.json({
      success: true,
      message: '게시글이 거절되었습니다'
    });
  } catch (error) {
    console.error('Error rejecting post:', error);
    res.status(500).json({
      error: '게시글 거절에 실패했습니다',
      details: error.message
    });
  }
});

// 일괄 승인 (관리자만)
router.post('/approve-batch', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { postIds } = req.body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ error: '승인할 게시글 ID 목록이 필요합니다' });
    }

    const result = await BoardPost.updateMany(
      {
        _id: { $in: postIds },
        isApproved: false,
        isBot: true
      },
      {
        isApproved: true,
        approvedBy: req.user._id,
        approvedAt: new Date()
      }
    );

    // 봇 통계 업데이트
    const approvedPosts = await BoardPost.find({
      _id: { $in: postIds },
      isApproved: true
    }).select('botId');

    const botUpdates = {};
    approvedPosts.forEach(post => {
      if (post.botId) {
        botUpdates[post.botId] = (botUpdates[post.botId] || 0) + 1;
      }
    });

    for (const [botId, count] of Object.entries(botUpdates)) {
      await Bot.findByIdAndUpdate(botId, {
        $inc: { 'stats.postsCreated': count },
        lastActivity: new Date()
      });
    }

    res.json({
      success: true,
      message: `${result.modifiedCount}개의 게시글이 승인되었습니다`,
      approvedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error batch approving posts:', error);
    res.status(500).json({
      error: '일괄 승인에 실패했습니다',
      details: error.message
    });
  }
});

module.exports = router;
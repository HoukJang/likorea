const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// 로그인/관리자 권한 체크 미들웨어 (간단 예시)
function isLoggedIn(req, res, next) {
  if (!req.session.userId) {
    return res.send('로그인 후 이용 가능합니다.');
  }
  next();
}

function isAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.send('관리자 권한이 필요합니다.');
  }
  next();
}

// 게시판 목록 보기
router.get('/:category', async (req, res) => {
  try {
    const category = req.params.category; // anabada, meeting, recommend
    const posts = await Post.find({ category }).populate('author', 'username');
    res.render('boardList', { posts, category });
  } catch (err) {
    console.error(err);
    res.send('오류 발생');
  }
});

// 게시글 작성 폼
router.get('/:category/new', isLoggedIn, (req, res) => {
  const category = req.params.category;
  res.render('boardForm', { category, post: {} });
});

// 게시글 작성 처리
router.post('/:category/new', isLoggedIn, async (req, res) => {
  const category = req.params.category;
  const { title, content } = req.body;
  try {
    const newPost = new Post({
      title,
      content,
      category,
      author: req.session.userId
    });
    await newPost.save();
    res.redirect(`/board/${category}`);
  } catch (err) {
    console.error(err);
    res.send('글 작성 중 오류 발생');
  }
});

// 게시글 상세 보기
router.get('/:category/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username');
    res.render('boardDetail', { post });
  } catch (err) {
    console.error(err);
    res.send('오류 발생');
  }
});

// 게시글 수정 폼
// (일반적으로 본인 글은 본인이 수정 가능, 여기서는 관리자만 가능하다고 가정)
router.get('/:category/:id/edit', isAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.render('boardForm', { category: req.params.category, post });
  } catch (err) {
    console.error(err);
    res.send('오류 발생');
  }
});

// 게시글 수정 처리
router.post('/:category/:id/edit', isAdmin, async (req, res) => {
  try {
    const { title, content } = req.body;
    await Post.findByIdAndUpdate(req.params.id, { title, content });
    res.redirect(`/board/${req.params.category}/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.send('수정 중 오류 발생');
  }
});

// 게시글 삭제
router.post('/:category/:id/delete', isAdmin, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.redirect(`/board/${req.params.category}`);
  } catch (err) {
    console.error(err);
    res.send('삭제 중 오류 발생');
  }
});

module.exports = router;

const express = require('express');
const { 
  createPost, getPosts, updatePost, deletePost,
  addComment, updateComment, deleteComment 
} = require('../controllers/boardController');

const router = express.Router();

// 게시글 목록 조회 및 생성
router.get('/:boardType', getPosts);
router.post('/:boardType', (req, res) => {
  const { boardType } = req.params;
  const { title, content, email } = req.body; 
  // ...logic to create board post...
  res.status(201).json({ message: '게시글이 생성되었습니다.' });
});

// 게시글 수정 및 삭제 (postId는 MongoDB의 _id 사용)
router.put('/:boardType/:postId', updatePost);
router.delete('/:boardType/:postId', deletePost);

// 댓글 관련 라우트
// 댓글 작성: POST /api/boards/:boardType/:postId/comments
router.post('/:boardType/:postId/comments', (req, res) => {
  const { boardType, postId } = req.params;
  const { comment, email } = req.body;
  // ...logic to create comment...
  res.status(201).json({ message: '댓글이 작성되었습니다.' });
});
// 댓글 수정: PUT /api/boards/:boardType/:postId/comments/:commentId
router.put('/:boardType/:postId/comments/:commentId', updateComment);
// 댓글 삭제: DELETE /api/boards/:boardType/:postId/comments/:commentId
router.delete('/:boardType/:postId/comments/:commentId', deleteComment);

module.exports = router;
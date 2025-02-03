const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, commentController.createComment);
router.get('/:postId', commentController.getCommentsByPostId);
router.put('/:id', authMiddleware, commentController.updateComment); // 댓글 수정
router.delete('/:id', authMiddleware, commentController.deleteComment); // 댓글 삭제

module.exports = router;
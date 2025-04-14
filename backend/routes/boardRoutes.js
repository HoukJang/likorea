const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const commentController = require('../controllers/commentController');

// 디버깅: boardController에 올바른 함수들이 들어있는지 확인합니다.

router.post('/:boardType', boardController.createPost);
router.get('/:boardType', boardController.getPosts);
router.get('/:boardType/:postId', boardController.getPost);
router.put('/:boardType/:postId', boardController.updatePost);
router.delete('/:boardType/:postId', boardController.deletePost);

router.post('/:boardType/:postId/comments', commentController.createComment);
router.get('/:boardType/:postId/comments', commentController.getComments);
router.put('/:boardType/:postId/comments/:commentId', commentController.updateComment);
router.delete('/:boardType/:postId/comments/:commentId', commentController.deleteComment);

module.exports = router;
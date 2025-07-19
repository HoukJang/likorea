const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const commentController = require('../controllers/commentController');
const { createRateLimiters } = require('../middleware/security');
const { validatePostInput, validateCommentInput, validateParams } = require('../middleware/validation');

const { postLimiter } = createRateLimiters();

// 디버깅: boardController에 올바른 함수들이 들어있는지 확인합니다.

router.post('/:boardType', validateParams, postLimiter, validatePostInput, boardController.createPost);
router.get('/:boardType', validateParams, boardController.getPosts);
router.get('/:boardType/:postId', validateParams, boardController.getPost);
router.put('/:boardType/:postId', validateParams, validatePostInput, boardController.updatePost);
router.delete('/:boardType/:postId', validateParams, boardController.deletePost);

router.post('/:boardType/:postId/comments', validateParams, postLimiter, validateCommentInput, commentController.createComment);
router.get('/:boardType/:postId/comments', validateParams, commentController.getComments);
router.put('/:boardType/:postId/comments/:commentId', validateParams, validateCommentInput, commentController.updateComment);
router.delete('/:boardType/:postId/comments/:commentId', validateParams, commentController.deleteComment);

module.exports = router;
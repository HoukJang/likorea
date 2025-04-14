const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');

// 디버깅: boardController에 올바른 함수들이 들어있는지 확인합니다.

router.post('/:boardType', boardController.createPost);
router.get('/:boardType', boardController.getPosts);
router.get('/:boardType/:postId', boardController.getPost);
router.put('/:boardType/:postId', boardController.updatePost);
router.delete('/:boardType/:postId', boardController.deletePost);

module.exports = router;
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', postController.getAllPosts);
router.post('/', authMiddleware, postController.createPost);
router.get('/:id', postController.getPostByID); // getPostByID 라우트
router.put('/:id', authMiddleware, postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);

module.exports = router;
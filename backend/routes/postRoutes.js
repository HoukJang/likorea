const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

// GET /api/posts
router.get('/', postController.getAllPosts);

// POST /api/posts
router.post('/', postController.createPost);

// GET /api/posts/:id
router.get('/:id', postController.getPostByID);

// PUT /api/posts/:id
router.put('/:id', postController.updatePost);

// DELETE /api/posts/:id
router.delete('/:id', postController.deletePost);

module.exports = router;

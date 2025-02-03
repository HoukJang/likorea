const Post = require('../models/Post');

// 전체 게시글 조회
exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// 특정 게시글 조회
exports.getPostByID = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post NOT found' });
        }
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// 새글 작성
exports.createPost = async (req, res) => {
    try {
        const { title, content, author } = req.body;
        const newPost = new Post({ title, content, author });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// 게시글 수정
exports.updatePost = async (req, res) => {
    try {
        const { title, content, author } = req.body;
        const updated = await Post.findByIdAndUpdate(
            req.params.id,
            { title, content, author },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ error: 'Post NOT found' });
        }
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// 게시글 삭제
exports.deletePost = async (req, res) => {
    try {
        const deleted = await Post.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Post NOT found' });
        }
        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
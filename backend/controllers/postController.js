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
        return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
      }
      post.viewCount = (post.viewCount || 0) + 1; // 조회수 증가
      await post.save();
      res.status(200).json(post);
    } catch (error) {
      console.error('게시글 조회 실패:', error);
      res.status(500).json({ error: '서버 오류' });
    }
  };

// 새글 작성
exports.createPost = async (req, res) => {
    try {
      const { title, content } = req.body;
      const author = req.user.username;
      const newPost = new Post({ title, content, author });
      await newPost.save();
      res.status(201).json(newPost);
    } catch (error) {
      console.error('게시글 생성 실패:', error);
      res.status(500).json({ error: '서버 오류' });
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
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
      }
      if (post.author !== req.user.username) {
        return res.status(403).json({ error: '삭제 권한이 없습니다.' });
      }
      await Post.deleteOne({ _id: req.params.id }); // deleteOne 메서드 사용
      res.status(200).json({ message: '게시글이 삭제되었습니다.' });
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      res.status(500).json({ error: '서버 오류' });
    }
  };
  
const BoardPost = require('../models/BoardPost');
const User = require('../models/User');
const sanitizeHtml = require('sanitize-html');

// 게시글 생성 (수정)
exports.createPost = async (req, res) => {
  try {
    const { boardType } = req.params; // e.g., /api/boards/general
    let { title, content, email } = req.body; // email from request body
    // find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    // sanitize title and content
    title = sanitizeHtml(title, { allowedTags: [] });
    content = sanitizeHtml(content, {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'img'],
      allowedAttributes: { a: ['href'], img: ['src', 'alt'] }
    });
    const post = await BoardPost.create({ boardType, title, content, author: user._id });
    console.log('게시글 생성 성공:', post);
    res.status(201).json({ message: '게시글 생성 성공', post });
  } catch (error) {
    console.error('createPost 에러:', error);
    res.status(400).json({ message: '게시글 생성 실패', error: error.message });
  }
};

// 게시글 조회 (기존)
exports.getPosts = async (req, res) => {
  try {
    const { boardType } = req.params;
    const posts = await BoardPost.find({ boardType })
      .populate('author', 'email')
      .sort({ modifiedAt: -1 });
    console.log('게시글 목록:', posts);
    res.json(posts);
  } catch (error) {
    res.status(400).json({ message: '게시글 조회 실패', error: error.message });
  }
};

// 게시글 수정 (수정)
exports.updatePost = async (req, res) => {
  try {
    const { boardType, postId } = req.params;
    let { title, content, email } = req.body; // email now from request
    // lookup user and verify ownership
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    const post = await BoardPost.findById(postId);
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    if (post.author.toString() !== user._id.toString()) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }
    if (title) {
      title = sanitizeHtml(title, { allowedTags: [] });
      post.title = title;
    }
    if (content) {
      content = sanitizeHtml(content, {
        allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'img'],
        allowedAttributes: { a: ['href'], img: ['src', 'alt'] }
      });
      post.content = content;
    }
    post.modifiedAt = new Date();
    await post.save();
    res.json({ message: '게시글 수정 성공', post });
  } catch (error) {
    res.status(400).json({ message: '게시글 수정 실패', error: error.message });
  }
};

// 게시글 삭제 (수정)
exports.deletePost = async (req, res) => {
  try {
    const { boardType, postId } = req.params;
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    const post = await BoardPost.findById(postId);
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    if (post.author.toString() !== user._id.toString()) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }
    await BoardPost.findByIdAndDelete(postId);
    res.json({ message: '게시글 삭제 성공' });
  } catch (error) {
    res.status(400).json({ message: '게시글 삭제 실패', error: error.message });
  }
};

// 댓글 작성 (수정)
exports.addComment = async (req, res) => {
  try {
    const { boardType, postId } = req.params;
    let { content, email } = req.body;
    // lookup user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    content = sanitizeHtml(content, {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'img'],
      allowedAttributes: { a: ['href'], img: ['src', 'alt'] }
    });
    const post = await BoardPost.findById(postId);
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    post.comments.push({ content, author: user._id });
    post.modifiedAt = new Date();
    await post.save();
    res.status(201).json({ message: '댓글 작성 성공', comments: post.comments });
  } catch (error) {
    res.status(400).json({ message: '댓글 작성 실패', error: error.message });
  }
};

// 댓글 수정 (수정)
exports.updateComment = async (req, res) => {
  try {
    const { boardType, postId, commentId } = req.params;
    const { content, email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    const post = await BoardPost.findById(postId);
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    if (comment.author.toString() !== user._id.toString()) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }
    comment.content = content || comment.content;
    post.modifiedAt = new Date();
    await post.save();
    res.json({ message: '댓글 수정 성공', comment });
  } catch (error) {
    res.status(400).json({ message: '댓글 수정 실패', error: error.message });
  }
};

// 댓글 삭제 (수정)
exports.deleteComment = async (req, res) => {
  try {
    const { boardType, postId, commentId } = req.params;
    const { author } = req.body;
    const post = await BoardPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }
    if (comment.author.toString() !== author) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }
    comment.remove();
    post.modifiedAt = new Date(); // update modifiedAt after comment deletion
    await post.save();
    res.json({ message: '댓글 삭제 성공' });
  } catch (error) {
    res.status(400).json({ message: '댓글 삭제 실패', error: error.message });
  }
};
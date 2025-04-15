const BoardPost = require('../models/BoardPost');
const User = require('../models/User');
const sanitizeHtml = require('sanitize-html');

// 게시글 생성 (수정)
exports.createPost = async (req, res) => {
  try {
    const { boardType } = req.params;
    let { title, content, id } = req.body;
    const user = await User.findOne({ id });
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    title = sanitizeHtml(title, { allowedTags: [] });
    content = sanitizeHtml(content, {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'img', 'div'],
      allowedAttributes: { a: ['href'], img: ['src', 'alt'] },
      allowedSchemes: ['http', 'https', 'data']
    });
    const post = await BoardPost.create({ boardType, title, content, author: user._id });
    console.log('게시글 생성 성공:', post);
    res.status(201).json({ message: '게시글 생성 성공', post });
  } catch (error) {
    console.error('createPost 에러:', error);
    res.status(400).json({ message: '게시글 생성 실패', error: error.message });
  }
};

// 게시글 목록 조회
exports.getPosts = async (req, res) => {
  try {
    console.log('게시글 목록 조회 요청:', req.params);
    const { boardType } = req.params;
    const posts = await BoardPost.find({ boardType })
      .populate('author', 'id email')
      .sort({ modifiedAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(400).json({ message: '게시글 조회 실패', error: error.message });
  }
};

// 게시글 단일 조회
exports.getPost = async (req, res) => {
  try {
    const { boardType, postId } = req.params;
    await BoardPost.updateOne(
      { _id: postId },
      { $inc: { viewCount: 1 } },
      { timestamps: false }
    );
    let post = await BoardPost.findOne({ _id: postId, boardType })
      .populate('author', 'id')
      .exec();
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }
    res.json(post);
  } catch (error) {
    res.status(400).json({ message: '게시글 조회 실패', error: error.message });
  }
};

// 게시글 수정
exports.updatePost = async (req, res) => {
  try {
    const { boardType, postId } = req.params;
    let { title, content, id } = req.body;
    console.log('게시글 수정 요청:', req.body);
    const user = await User.findOne({ id });
    console.log('조회된 사용자:', user);
    if (!user)
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    const post = await BoardPost.findById(postId);
    console.log('조회된 게시글:', post);
    if (!post)
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    if (post.author.toString() !== user._id.toString()) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }
    if (title) {
      title = sanitizeHtml(title, { allowedTags: [] });
      post.title = title;
    }
    if (content) {
      content = sanitizeHtml(content, {
        allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'img', 'div'],
        allowedAttributes: { a: ['href'], img: ['src', 'alt'] },
        allowedSchemes: ['http', 'https', 'data']
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

// 게시글 삭제
exports.deletePost = async (req, res) => {
  try {
    const { boardType, postId } = req.params;
    const { userId } = req.body;
    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    const post = await BoardPost.findById(postId);
    if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    if (post.author.toString() !== user._id.toString()) {
      const postAuthor = await User.findById(post.author);


      if (!postAuthor || user.authority <= postAuthor.authority) {
        return res.status(403).json({ message: '권한이 없습니다.' });
      }
    }
    await BoardPost.findByIdAndDelete(postId);
    res.json({ message: '게시글 삭제 성공' });
  } catch (error) {
    res.status(400).json({ message: '게시글 삭제 실패', error: error.message });
  }
};
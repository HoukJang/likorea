const BoardPost = require('../models/BoardPost');
const User = require('../models/User');
const sanitizeHtml = require('sanitize-html');
const { 
  asyncHandler, 
  ValidationError, 
  NotFoundError, 
  AuthorizationError 
} = require('../middleware/errorHandler');

// 게시글 생성 (수정)
exports.createPost = asyncHandler(async (req, res) => {
  const { boardType } = req.params;
  let { title, content } = req.body;
  
  // 인증된 사용자 정보 사용
  const userId = req.user.id;
  
  // 필수 필드 검증
  if (!title || !content) {
    throw new ValidationError('제목과 내용은 필수입니다.');
  }
  
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }
  
  title = sanitizeHtml(title, { allowedTags: [] });
  content = sanitizeHtml(content, {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'img', 'div'],
    allowedAttributes: { a: ['href'], img: ['src', 'alt'] },
    allowedSchemes: ['http', 'https', 'data']
  });
  
  const post = await BoardPost.create({ boardType, title, content, author: user._id });
  
  res.status(201).json({ 
    success: true,
    message: '게시글 생성 성공', 
    post: {
      _id: post._id,
      title: post.title,
      content: post.content,
      boardType: post.boardType,
      author: post.author,
      createdAt: post.createdAt
    }
  });
});

// 게시글 목록 조회
exports.getPosts = asyncHandler(async (req, res) => {
  const { boardType } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const posts = await BoardPost.find({ boardType })
    .populate('author', 'id email authority')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));
    
  const totalPosts = await BoardPost.countDocuments({ boardType });
  const totalPages = Math.ceil(totalPosts / Number(limit));
  
  res.json({
    success: true,
    posts,
    totalPosts,
    totalPages,
    currentPage: Number(page)
  });
});

// 게시글 단일 조회
exports.getPost = asyncHandler(async (req, res) => {
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
    throw new NotFoundError('게시글을 찾을 수 없습니다.');
  }
  
  res.json({
    success: true,
    post
  });
});

// 게시글 수정
exports.updatePost = asyncHandler(async (req, res) => {
  const { boardType, postId } = req.params;
  let { title, content } = req.body;
  
  // 인증된 사용자 정보 사용
  const userId = req.user.id;
  
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }
  
  const post = await BoardPost.findById(postId);
  if (!post) {
    throw new NotFoundError('게시글을 찾을 수 없습니다.');
  }
  
  // 작성자 또는 관리자만 수정 가능
  if (post.author.toString() !== user._id.toString() && user.authority < 5) {
    throw new AuthorizationError('게시글 수정 권한이 없습니다.');
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
  
  res.json({ 
    success: true,
    message: '게시글 수정 성공', 
    post: {
      _id: post._id,
      title: post.title,
      content: post.content,
      modifiedAt: post.modifiedAt
    }
  });
});

// 게시글 삭제
exports.deletePost = asyncHandler(async (req, res) => {
  const { boardType, postId } = req.params;
  
  // 인증된 사용자 정보 사용
  const userId = req.user.id;
  
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }
  
  const post = await BoardPost.findById(postId);
  if (!post) {
    throw new NotFoundError('게시글을 찾을 수 없습니다.');
  }
  
  // 작성자 또는 관리자만 삭제 가능
  if (post.author.toString() !== user._id.toString() && user.authority < 5) {
    const postAuthor = await User.findById(post.author);
    
    if (!postAuthor || user.authority <= postAuthor.authority) {
      throw new AuthorizationError('게시글 삭제 권한이 없습니다.');
    }
  }
  
  await BoardPost.findByIdAndDelete(postId);
  
  res.json({ 
    success: true,
    message: '게시글 삭제 성공' 
  });
});
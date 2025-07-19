const Comment = require('../models/Comment');
const BoardPost = require('../models/BoardPost');
const User = require('../models/User');
const sanitizeHtml = require('sanitize-html');
const { 
  asyncHandler, 
  ValidationError, 
  NotFoundError, 
  AuthorizationError 
} = require('../middleware/errorHandler');

// 댓글 조회: populate를 사용해 작성자의 id, email, authority를 가져옴
exports.getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const comments = await Comment.find({ post: postId })
    .populate('author', 'id authority')
    .sort({ createdAt: 1 });
  
  res.json({ 
    success: true,
    message: '댓글 조회 성공', 
    comments 
  });
});

// 댓글 작성
exports.createComment = asyncHandler(async (req, res) => {
  const { boardType, postId } = req.params;
  let { content, id } = req.body;
  
  // 필수 필드 검증
  if (!content || !id) {
    throw new ValidationError('댓글 내용과 사용자 ID는 필수입니다.');
  }
  
  const user = await User.findOne({ id });
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }
  
  content = sanitizeHtml(content, {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'img', 'div'],
    allowedAttributes: { a: ['href'], img: ['src', 'alt'] },
    allowedSchemes: ['http', 'https', 'data']
  });
  
  const comment = await Comment.create({
    content,
    author: user._id,
    post: postId
  });
  
  // BoardPost의 댓글 배열에 새 댓글 추가
  await BoardPost.findByIdAndUpdate(postId, { $push: { comments: comment._id } });
  
  res.status(201).json({ 
    success: true,
    message: '댓글 작성 성공', 
    comment: {
      _id: comment._id,
      content: comment.content,
      author: comment.author,
      post: comment.post,
      createdAt: comment.createdAt
    }
  });
});

// 댓글 수정
exports.updateComment = asyncHandler(async (req, res) => {
  const { boardType, postId, commentId } = req.params;
  const { content, id } = req.body;
  
  // 필수 필드 검증
  if (!id) {
    throw new ValidationError('사용자 ID는 필수입니다.');
  }
  
  const user = await User.findOne({ id });
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }
  
  const comment = await Comment.findOne({ _id: commentId, post: postId });
  if (!comment) {
    throw new NotFoundError('댓글을 찾을 수 없습니다.');
  }
  
  if (comment.author.toString() !== user._id.toString()) {
    throw new AuthorizationError('댓글 수정 권한이 없습니다.');
  }
  
  comment.content = content || comment.content;
  await comment.save();
  
  res.json({ 
    success: true,
    message: '댓글 수정 성공', 
    comment: {
      _id: comment._id,
      content: comment.content,
      author: comment.author,
      post: comment.post,
      updatedAt: comment.updatedAt
    }
  });
});

// 댓글 삭제
exports.deleteComment = asyncHandler(async (req, res) => {
  const { boardType, postId, commentId } = req.params;
  const { id } = req.body;
  
  // 필수 필드 검증
  if (!id) {
    throw new ValidationError('사용자 ID는 필수입니다.');
  }
  
  const user = await User.findOne({ id });
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }
  
  const comment = await Comment.findOne({ _id: commentId, post: postId });
  if (!comment) {
    throw new NotFoundError('댓글을 찾을 수 없습니다.');
  }
  
  if (comment.author.toString() !== user._id.toString()) {
    throw new AuthorizationError('댓글 삭제 권한이 없습니다.');
  }
  
  await comment.deleteOne();
  
  res.json({ 
    success: true,
    message: '댓글 삭제 성공' 
  });
});

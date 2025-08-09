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
    .populate('author', 'id email authority')
    .sort({ createdAt: 1 });

  res.json({
    success: true,
    comments
  });
});

// 댓글 작성
exports.createComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content, parentComment } = req.body;

  // 인증된 사용자 정보 사용
  const userId = req.user.id;

  // 필수 필드 검증
  if (!content) {
    throw new ValidationError('댓글 내용은 필수입니다.');
  }

  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }

  // 게시글 확인
  const post = await BoardPost.findById(postId);
  if (!post) {
    throw new NotFoundError('게시글을 찾을 수 없습니다.');
  }

  // 부모 댓글 확인 (대댓글인 경우)
  if (parentComment) {
    const parent = await Comment.findById(parentComment);
    if (!parent) {
      throw new NotFoundError('부모 댓글을 찾을 수 없습니다.');
    }
  }

  // HTML sanitization
  const sanitizedContent = sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.filter(tag => tag !== 'img'),
    allowedAttributes: {}
  });

  const comment = await Comment.create({
    content: sanitizedContent,
    author: user._id,
    post: postId,
    parentComment: parentComment || undefined
  });

  // BoardPost의 댓글 수 증가 및 최신 활동 시간 업데이트
  await BoardPost.findByIdAndUpdate(postId, {
    $inc: { commentCount: 1 },
    modifiedAt: new Date(),
    lastActivityAt: new Date()
  });

  res.status(201).json({
    success: true,
    message: '댓글이 작성되었습니다.',
    comment: {
      _id: comment._id,
      content: comment.content,
      author: comment.author.toString(),
      post: comment.post.toString(),
      parentComment: comment.parentComment?.toString(),
      createdAt: comment.createdAt
    }
  });
});

// 댓글 수정
exports.updateComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;
  const { content } = req.body;

  // 인증된 사용자 정보 사용
  const userId = req.user.id;

  // 필수 필드 검증
  if (!content) {
    throw new ValidationError('댓글 내용은 필수입니다.');
  }

  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }

  const comment = await Comment.findOne({ _id: commentId, post: postId });
  if (!comment) {
    throw new NotFoundError('댓글을 찾을 수 없습니다.');
  }

  // 작성자 또는 관리자만 수정 가능
  if (comment.author.toString() !== user._id.toString() && user.authority !== 5) {
    throw new AuthorizationError('댓글 수정 권한이 없습니다.');
  }

  // HTML sanitization
  const sanitizedContent = sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.filter(tag => tag !== 'img'),
    allowedAttributes: {}
  });

  comment.content = sanitizedContent;
  await comment.save();

  // 게시글의 modifiedAt 및 lastActivityAt 업데이트
  await BoardPost.findByIdAndUpdate(postId, {
    modifiedAt: new Date(),
    lastActivityAt: new Date()
  });

  res.json({
    success: true,
    message: '댓글이 수정되었습니다.',
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
  const { postId, commentId } = req.params;

  // 인증된 사용자 정보 사용
  const userId = req.user.id;

  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }

  const comment = await Comment.findOne({ _id: commentId, post: postId });
  if (!comment) {
    throw new NotFoundError('댓글을 찾을 수 없습니다.');
  }

  // 작성자 또는 관리자만 삭제 가능
  if (comment.author.toString() !== user._id.toString() && user.authority !== 5) {
    throw new AuthorizationError('댓글 삭제 권한이 없습니다.');
  }

  // 대댓글도 함께 삭제
  await Comment.deleteMany({ parentComment: commentId });
  await comment.deleteOne();

  // BoardPost의 댓글 수 감소 및 최신 활동 시간 업데이트
  await BoardPost.findByIdAndUpdate(postId, {
    $inc: { commentCount: -1 },
    modifiedAt: new Date(),
    lastActivityAt: new Date()
  });

  res.json({
    success: true,
    message: '댓글이 삭제되었습니다.'
  });
});

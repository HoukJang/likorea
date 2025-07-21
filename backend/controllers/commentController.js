const Comment = require('../models/Comment');
const BoardPost = require('../models/BoardPost');
const User = require('../models/User');
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
  const { postId } = req.params;
  let { content, id } = req.body;
  
  console.log('댓글 작성 컨트롤러 - 요청 데이터:', { postId, content, id });
  console.log('댓글 작성 컨트롤러 - 전체 req.body:', req.body);
  console.log('댓글 작성 컨트롤러 - 사용자 정보:', req.user);
  
  // 필수 필드 검증
  if (!content || !id) {
    console.log('댓글 작성 컨트롤러 - 필수 필드 누락');
    console.log('댓글 작성 컨트롤러 - content:', content);
    console.log('댓글 작성 컨트롤러 - id:', id);
    throw new ValidationError('댓글 내용과 사용자 ID는 필수입니다.');
  }
  
  const user = await User.findOne({ id });
  if (!user) {
    console.log('댓글 작성 컨트롤러 - 사용자를 찾을 수 없음:', id);
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }
  
  console.log('댓글 작성 컨트롤러 - 사용자 정보 확인:', {
    id: user.id,
    email: user.email,
    authority: user.authority
  });
  
  const comment = await Comment.create({
    content,
    author: user._id,
    post: postId
  });
  
  console.log('댓글 작성 컨트롤러 - 댓글 생성 성공:', comment._id);
  
  // BoardPost의 댓글 배열에 새 댓글 추가하고 modifiedAt 업데이트
  await BoardPost.findByIdAndUpdate(postId, { 
    $push: { comments: comment._id },
    modifiedAt: new Date()
  });
  
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
  const { postId, commentId } = req.params;
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
  
  // 작성자 또는 관리자만 수정 가능
  if (comment.author.toString() !== user._id.toString() && user.authority !== 5) {
    throw new AuthorizationError('댓글 수정 권한이 없습니다.');
  }
  
  comment.content = content || comment.content;
  await comment.save();
  
  // 게시글의 modifiedAt 업데이트
  await BoardPost.findByIdAndUpdate(postId, { 
    modifiedAt: new Date()
  });
  
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
  const { postId, commentId } = req.params;
  const { userId } = req.query; // URL 파라미터로 변경
  
  console.log('댓글 삭제 컨트롤러 - 요청 데이터:', { postId, commentId, userId });
  console.log('댓글 삭제 컨트롤러 - 전체 req.query:', req.query);
  console.log('댓글 삭제 컨트롤러 - 사용자 정보:', req.user);
  
  // 필수 필드 검증
  if (!userId) {
    console.log('댓글 삭제 컨트롤러 - 사용자 ID 누락');
    throw new ValidationError('사용자 ID는 필수입니다.');
  }
  
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
  
  await comment.deleteOne();
  
  res.json({ 
    success: true,
    message: '댓글 삭제 성공' 
  });
});

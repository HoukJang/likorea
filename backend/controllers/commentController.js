const Comment = require('../models/Comment');
const BoardPost = require('../models/BoardPost');
const User = require('../models/User');
const sanitizeHtml = require('sanitize-html');

// 댓글 조회: populate를 사용해 작성자의 id, email, authority를 가져옴
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId })
      .populate('author', 'id authority')
      .sort({ createdAt: 1 });
    
    console.log('댓글 조회:', comments);
    res.json({ message: '댓글 조회 성공', comments });
  } catch (error) {
    res.status(400).json({ message: '댓글 조회 실패', error: error.message });
  }
};

// 댓글 작성
exports.createComment = async (req, res) => {
  try {
    const { boardType, postId } = req.params;
    let { content, id } = req.body; // 요청 시 전달된 사용자 식별자
    console.log('댓글 작성 요청:', req.body);
    const user = await User.findOne({ id });
    if (!user)
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    content = sanitizeHtml(content, {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'img', 'div'],
      allowedAttributes: { a: ['href'], img: ['src', 'alt'] },
      allowedSchemes: ['http', 'https', 'data']
    });
    const comment = await Comment.create({
      content,
      author: user._id, // 최신 Comment 모델에서는 ObjectId 사용
      post: postId
    });
    // BoardPost의 댓글 배열에 새 댓글 추가
    await BoardPost.findByIdAndUpdate(postId, { $push: { comments: comment._id } });
    res.status(201).json({ message: '댓글 작성 성공', comment });
  } catch (error) {
    res.status(400).json({ message: '댓글 작성 실패', error: error.message });
  }
};

// 댓글 수정
exports.updateComment = async (req, res) => {
  try {
    const { boardType, postId, commentId } = req.params;
    const { content, id } = req.body; // 수정 요청 시 전달된 사용자 식별자
    const user = await User.findOne({ id });
    if (!user)
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    const comment = await Comment.findOne({ _id: commentId, post: postId });
    if (!comment)
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    if (comment.author.toString() !== user._id.toString())
      return res.status(403).json({ message: '권한이 없습니다.' });
    comment.content = content || comment.content;
    await comment.save();
    res.json({ message: '댓글 수정 성공', comment });
  } catch (error) {
    res.status(400).json({ message: '댓글 수정 실패', error: error.message });
  }
};

// 댓글 삭제
exports.deleteComment = async (req, res) => {
  try {
    const { boardType, postId, commentId } = req.params;
    const { id } = req.body; // 삭제 요청 시 사용자 식별자
    const user = await User.findOne({ id });
    if (!user)
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    const comment = await Comment.findOne({ _id: commentId, post: postId });
    if (!comment)
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    if (comment.author.toString() !== user._id.toString())
      return res.status(403).json({ message: '권한이 없습니다.' });
    await comment.deleteOne();
    res.json({ message: '댓글 삭제 성공' });
  } catch (error) {
    res.status(400).json({ message: '댓글 삭제 실패', error: error.message });
  }
};

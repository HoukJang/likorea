const Comment = require('../models/Comment');

exports.createComment = async (req, res) => {
  try {
    const { postId, content } = req.body;
    const author = req.user.username;
    const newComment = new Comment({ postId, author, content });
    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    console.error('댓글 생성 실패:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};

exports.getCommentsByPostId = async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId });
    res.status(200).json(comments);
  } catch (error) {
    console.error('댓글 조회 실패:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    }
    if (comment.author !== req.user.username) {
      return res.status(403).json({ error: '수정 권한이 없습니다.' });
    }
    comment.content = content;
    await comment.save();
    res.status(200).json(comment);
  } catch (error) {
    console.error('댓글 수정 실패:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    }
    if (comment.author !== req.user.username) {
      return res.status(403).json({ error: '삭제 권한이 없습니다.' });
    }
    await Comment.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    console.error('댓글 삭제 실패:', error);
    res.status(500).json({ error: '서버 오류' });
  }
};
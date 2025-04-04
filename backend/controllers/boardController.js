const BoardPost = require('../models/BoardPost');
const sanitizeHtml = require('sanitize-html');

// 게시글 생성 (기존)
exports.createPost = async (req, res) => {
  try {
    const { boardType } = req.params; // URL 예: /api/boards/free 또는 /api/boards/trade
    let { title, content, author: authorEmail } = req.body;
    // sanitize title와 content
    title = sanitizeHtml(title, { allowedTags: [] }); // 제목은 순수 텍스트만 허용
    content = sanitizeHtml(content, {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'img'],
      allowedAttributes: { a: ['href'], img: ['src', 'alt'] }
    });
    const post = await BoardPost.create({ boardType, title, content, author: authorEmail });
    res.status(201).json({ message: '게시글 생성 성공', post });
  } catch (error) {
    res.status(400).json({ message: '게시글 생성 실패', error: error.message });
  }
};

// 게시글 조회 (기존)
exports.getPosts = async (req, res) => {
  try {
    const { boardType } = req.params;
    const posts = await BoardPost.find({ boardType })
      .populate('author', 'nickname') // 글쓴이 별명만 가져오기
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(400).json({ message: '게시글 조회 실패', error: error.message });
  }
};

// 게시글 수정 (본인 작성글만 편집 가능하도록 author 체크)
exports.updatePost = async (req, res) => {
  try {
    const { boardType, postId } = req.params;
    let { title, content, author } = req.body; // 실제 서비스에서는 로그인된 사용자 정보로 author 검증 필요
    const post = await BoardPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }
    // 본인 소유 확인 (실제: id 비교)
    if (post.author.toString() !== author) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }
    // sanitize 및 업데이트
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
    await post.save();
    res.json({ message: '게시글 수정 성공', post });
  } catch (error) {
    res.status(400).json({ message: '게시글 수정 실패', error: error.message });
  }
};

// 게시글 삭제 (본인 작성글만 삭제 가능하도록 author 체크)
exports.deletePost = async (req, res) => {
  try {
    const { boardType, postId } = req.params;
    const { author } = req.body; // 실제 서비스: 로그인 정보를 통해 author 검증
    const post = await BoardPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }
    if (post.author.toString() !== author) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }
    await BoardPost.findByIdAndDelete(postId);
    res.json({ message: '게시글 삭제 성공' });
  } catch (error) {
    res.status(400).json({ message: '게시글 삭제 실패', error: error.message });
  }
};

// 댓글 작성 (게시글의 댓글 배열에 댓글 추가)
exports.addComment = async (req, res) => {
  try {
    const { boardType, postId } = req.params;
    let { content, author } = req.body;
    // sanitize 댓글 내용: 기본적인 태그만 허용
    content = sanitizeHtml(content, {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'img'],
      allowedAttributes: { a: ['href'], img: ['src', 'alt'] }
    });
    const post = await BoardPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }
    post.comments.push({ content, author });
    await post.save();
    res.status(201).json({ message: '댓글 작성 성공', comments: post.comments });
  } catch (error) {
    res.status(400).json({ message: '댓글 작성 실패', error: error.message });
  }
};

// 댓글 수정 (댓글 작성자 본인만 수정 가능)
exports.updateComment = async (req, res) => {
  try {
    const { boardType, postId, commentId } = req.params;
    const { content, author } = req.body;
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
    comment.content = content || comment.content;
    await post.save();
    res.json({ message: '댓글 수정 성공', comment });
  } catch (error) {
    res.status(400).json({ message: '댓글 수정 실패', error: error.message });
  }
};

// 댓글 삭제 (댓글 작성자 본인만 삭제 가능)
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
    await post.save();
    res.json({ message: '댓글 삭제 성공' });
  } catch (error) {
    res.status(400).json({ message: '댓글 삭제 실패', error: error.message });
  }
};
const BoardPost = require('../models/BoardPost');
const User = require('../models/User');
const Tag = require('../models/Tag');
const Comment = require('../models/Comment');
const sanitizeHtml = require('sanitize-html');
const { 
  asyncHandler, 
  ValidationError, 
  NotFoundError, 
  AuthorizationError 
} = require('../middleware/errorHandler');

/**
 * Region 필터 파싱 함수
 * @param {string} regionFilter - 사용자 입력 필터 (예: "24", "24-60", "<=13", ">73")
 * @returns {Object} MongoDB 쿼리 조건
 */
const parseRegionFilter = (regionFilter) => {
  const trimmed = regionFilter.trim();
  
  // 빈 값 처리
  if (!trimmed) return null;
  
  // 범위 형식: "24-60"
  if (trimmed.includes('-')) {
    const [start, end] = trimmed.split('-').map(s => s.trim());
    const startNum = parseInt(start);
    const endNum = parseInt(end);
    
    if (!isNaN(startNum) && !isNaN(endNum) && startNum <= endNum) {
      return {
        $gte: startNum.toString(),
        $lte: endNum.toString()
      };
    }
  }
  
  // 이하 형식: "<=13"
  if (trimmed.startsWith('<=')) {
    const num = parseInt(trimmed.substring(2));
    if (!isNaN(num)) {
      return { $lte: num.toString() };
    }
  }
  
  // 이상 형식: ">73"
  if (trimmed.startsWith('>')) {
    const num = parseInt(trimmed.substring(1));
    if (!isNaN(num)) {
      return { $gt: num.toString() };
    }
  }
  
  // 단일 값: "24"
  const singleNum = parseInt(trimmed);
  if (!isNaN(singleNum)) {
    return singleNum.toString();
  }
  
  // 특수 값 처리
  if (trimmed === '<=13') {
    return { $lte: '13' };
  }
  
  if (trimmed === '>73') {
    return { $gt: '73' };
  }
  
  return null;
};

// 게시글 생성
exports.createPost = asyncHandler(async (req, res) => {
  let { title, content, tags } = req.body;
  
  // 인증된 사용자 정보 사용
  const userId = req.user.id;
  
  // 필수 필드 검증
  if (!title || !content) {
    throw new ValidationError('제목과 내용은 필수입니다.');
  }
  
  if (!tags || !tags.type || !tags.region) {
    throw new ValidationError('Type과 Region 태그는 필수입니다.');
  }
  
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }
  
  // 태그 유효성 검증
  const typeTag = await Tag.findOne({ category: 'type', value: tags.type, isActive: true });
  const regionTag = await Tag.findOne({ category: 'region', value: tags.region, isActive: true });
  
  if (!typeTag) {
    throw new ValidationError('유효하지 않은 Type 태그입니다.');
  }
  if (!regionTag) {
    throw new ValidationError('유효하지 않은 Region 태그입니다.');
  }
  
  const post = await BoardPost.create({ 
    title, 
    content, 
    tags,
    author: user._id 
  });
  
  res.status(201).json({ 
    success: true,
    message: '게시글 생성 성공', 
    post: {
      _id: post._id,
      title: post.title,
      content: post.content,
      tags: post.tags,
      author: post.author,
      createdAt: post.createdAt
    }
  });
});

// 게시글 목록 조회
exports.getPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type, region, search } = req.query;
  
  const skip = (Number(page) - 1) * Number(limit);
  
  // 필터 조건 구성
  let filter = {};
  
  if (type) {
    filter['tags.type'] = type;
  }
  
  if (region) {
    // Region 범위 필터링 처리
    const regionFilter = parseRegionFilter(region);
    if (regionFilter) {
      filter['tags.region'] = regionFilter;
    }
  }
  
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } }
    ];
  }
  
  const posts = await BoardPost.find(filter)
    .populate('author', 'id email authority')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));
    
  // 각 게시글의 댓글 수 계산
  const postsWithCommentCount = await Promise.all(
    posts.map(async (post) => {
      const commentCount = await Comment.countDocuments({ postId: post._id });
      return {
        ...post.toObject(),
        commentCount
      };
    })
  );
    
  const totalPosts = await BoardPost.countDocuments(filter);
  const totalPages = Math.ceil(totalPosts / Number(limit));
  
  res.json({
    success: true,
    posts: postsWithCommentCount,
    totalPosts,
    totalPages,
    currentPage: Number(page),
    filters: { type, region, search }
  });
});

// 게시글 단일 조회
exports.getPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  
  await BoardPost.updateOne(
    { _id: postId },
    { $inc: { viewCount: 1 } },
    { timestamps: false }
  );
  
  let post = await BoardPost.findOne({ _id: postId })
    .populate('author', 'id email authority')
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
  const { postId } = req.params;
  let { title, content, tags } = req.body;
  
  console.log('게시글 수정 컨트롤러 - 요청 데이터:', { postId, title, content, tags });
  console.log('게시글 수정 컨트롤러 - 전체 req.body:', req.body);
  console.log('게시글 수정 컨트롤러 - 사용자 정보:', req.user);
  
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
  
  console.log('게시글 수정 컨트롤러 - 기존 게시글:', {
    _id: post._id,
    title: post.title,
    content: post.content,
    author: post.author,
    tags: post.tags
  });
  
  // 작성자 또는 관리자만 수정 가능
  if (post.author.toString() !== user._id.toString() && user.authority !== 5) {
    throw new AuthorizationError('게시글 수정 권한이 없습니다.');
  }
  
  // 업데이트할 데이터 구성
  const updateData = {};
  if (title) {
    updateData.title = title;
  }
  if (content) {
    updateData.content = content;
  }
  
  // 태그 수정
  if (tags) {
    if (tags.type || tags.region) {
      // 태그 유효성 검증
      if (tags.type) {
        const typeTag = await Tag.findOne({ category: 'type', value: tags.type, isActive: true });
        if (!typeTag) {
          throw new ValidationError('유효하지 않은 Type 태그입니다.');
        }
        updateData['tags.type'] = tags.type;
      }
      
      if (tags.region) {
        const regionTag = await Tag.findOne({ category: 'region', value: tags.region, isActive: true });
        if (!regionTag) {
          throw new ValidationError('유효하지 않은 Region 태그입니다.');
        }
        updateData['tags.region'] = tags.region;
      }
    }
  }
  
  updateData.modifiedAt = new Date();
  
  console.log('게시글 수정 컨트롤러 - 업데이트 데이터:', updateData);
  
  // findByIdAndUpdate 사용하여 업데이트
  const updatedPost = await BoardPost.findByIdAndUpdate(
    postId,
    updateData,
    { new: true, runValidators: false }
  );
  
  if (!updatedPost) {
    throw new NotFoundError('게시글 수정에 실패했습니다.');
  }
  
  res.json({ 
    success: true,
    message: '게시글 수정 성공', 
    post: {
      _id: updatedPost._id,
      title: updatedPost.title,
      content: updatedPost.content,
      tags: updatedPost.tags,
      modifiedAt: updatedPost.modifiedAt
    }
  });
});

// 게시글 삭제
exports.deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  
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
  if (post.author.toString() !== user._id.toString() && user.authority !== 5) {
    throw new AuthorizationError('게시글 삭제 권한이 없습니다.');
  }
  
  await BoardPost.findByIdAndDelete(postId);
  
  res.json({ 
    success: true,
    message: '게시글 삭제 성공' 
  });
});
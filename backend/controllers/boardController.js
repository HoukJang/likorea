const BoardPost = require('../models/BoardPost');
const User = require('../models/User');
const Tag = require('../models/Tag');
const Comment = require('../models/Comment');
// HTML 새니타이징은 필요시 추가
const { SUB_CATEGORIES } = require('../utils/initTags');
const {
  asyncHandler,
  ValidationError,
  NotFoundError,
  AuthorizationError,
} = require('../middleware/errorHandler');

/**
 * Region 필터 파싱 함수
 * @param {string} regionFilter - 사용자 입력 필터 (예: "24", "24-60", "<=13", ">73")
 * @returns {Object} MongoDB 쿼리 조건
 */
const parseRegionFilter = regionFilter => {
  const trimmed = regionFilter.trim();

  // 빈 값 처리
  if (!trimmed) {
    return null;
  }

  // 쉼표로 구분된 OR 검색: "24, 25, 26" 또는 "30-40, 0"
  if (trimmed.includes(',')) {
    const values = trimmed
      .split(',')
      .map(s => s.trim())
      .filter(s => s);
    const validValues = [];

    for (const value of values) {
      // "0" 값 처리
      if (value === '0') {
        validValues.push('0');
        continue;
      }

      // 범위 검색 처리: "30-40"
      if (value.includes('-')) {
        const [start, end] = value.split('-').map(s => s.trim());
        const startNum = parseInt(start);
        const endNum = parseInt(end);

        if (
          !isNaN(startNum) &&
          !isNaN(endNum) &&
          startNum > 0 &&
          endNum > 0 &&
          startNum <= endNum
        ) {
          // 범위 내의 모든 값 추가
          for (let i = startNum; i <= endNum; i++) {
            validValues.push(i.toString());
          }
        }
        continue;
      }

      // 숫자 값 처리 (양수만)
      const num = parseInt(value);
      if (!isNaN(num) && num > 0) {
        validValues.push(num.toString());
      }
    }

    if (validValues.length > 0) {
      return { $in: validValues };
    }
    return null;
  }

  // "0" 값 처리 (지역 선택 안함)
  if (trimmed === '0') {
    return '0';
  }

  // 범위 형식: "24-60"
  if (trimmed.includes('-')) {
    const [start, end] = trimmed.split('-').map(s => s.trim());
    const startNum = parseInt(start);
    const endNum = parseInt(end);

    if (!isNaN(startNum) && !isNaN(endNum) && startNum > 0 && endNum > 0 && startNum <= endNum) {
      return {
        $gte: startNum.toString(),
        $lte: endNum.toString(),
      };
    }
  }

  // 미만 형식: "<13"
  if (trimmed.startsWith('<') && !trimmed.startsWith('<=')) {
    const num = parseInt(trimmed.substring(1));
    if (!isNaN(num) && num > 0) {
      return { $lt: num.toString() };
    }
  }

  // 이하 형식: "<=13"
  if (trimmed.startsWith('<=')) {
    const num = parseInt(trimmed.substring(2));
    if (!isNaN(num) && num > 0) {
      return { $lte: num.toString() };
    }
  }

  // 이상 형식: ">73"
  if (trimmed.startsWith('>')) {
    const num = parseInt(trimmed.substring(1));
    if (!isNaN(num) && num > 0) {
      return { $gt: num.toString() };
    }
  }

  // 단일 값: "24" (양수만)
  const singleNum = parseInt(trimmed);
  if (!isNaN(singleNum) && singleNum > 0) {
    return singleNum.toString();
  }

  // 특수 값 처리
  if (trimmed === '<13') {
    return { $lt: '13' };
  }

  if (trimmed === '>73') {
    return { $gt: '73' };
  }

  return null;
};

// 게시글 생성
exports.createPost = asyncHandler(async (req, res) => {
  const { title, content, tags } = req.body;

  // 인증된 사용자 정보 사용
  const userId = req.user.id;

  // 필수 필드 검증
  if (!title || !content) {
    throw new ValidationError('제목과 내용은 필수입니다.');
  }

  if (!tags || !tags.type) {
    throw new ValidationError('글종류 태그는 필수입니다.');
  }

  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }

  // 태그 유효성 검증
  const typeTag = await Tag.findOne({ category: 'type', value: tags.type, isActive: true });

  if (!typeTag) {
    throw new ValidationError('유효하지 않은 글종류 태그입니다.');
  }

  // 소주제 유효성 검증 (선택사항)
  if (tags.subcategory) {
    const validSubCategories = SUB_CATEGORIES[tags.type];
    if (!validSubCategories || !validSubCategories.includes(tags.subcategory)) {
      throw new ValidationError('유효하지 않은 소주제입니다.');
    }
  }

  // 지역 태그는 선택사항 (없으면 '0'으로 설정)
  if (!tags.region) {
    tags.region = '0';
  } else {
    const regionTag = await Tag.findOne({ category: 'region', value: tags.region, isActive: true });
    if (!regionTag) {
      throw new ValidationError('유효하지 않은 지역 태그입니다.');
    }
  }

  const post = await BoardPost.create({
    title,
    content,
    tags,
    author: user._id,
    modifiedAt: new Date(),
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
      createdAt: post.createdAt,
    },
  });
});

// 게시글 목록 조회
exports.getPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type, region, subcategory, search } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  // 필터 조건 구성
  const filter = {};

  if (type) {
    filter['tags.type'] = type;
  }

  if (subcategory) {
    filter['tags.subcategory'] = subcategory;
  }

  if (region) {
    // Region 필터링 처리 (parseRegionFilter에서 "0"과 양수 모두 처리)
    const regionFilter = parseRegionFilter(region);
    if (regionFilter) {
      filter['tags.region'] = regionFilter;
    }
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
  }

  // 공지와 일반 게시글을 분리해서 가져오기
  const noticeFilter = { ...filter, 'tags.type': '공지' };
  const normalFilter = { ...filter, 'tags.type': { $ne: '공지' } };

  // 공지 게시글 가져오기 (최신순)
  const notices = await BoardPost.find(noticeFilter)
    .populate('author', 'id email authority')
    .sort({ createdAt: -1 });

  // 일반 게시글 가져오기 (최신순)
  const normalPosts = await BoardPost.find(normalFilter)
    .populate('author', 'id email authority')
    .sort({ createdAt: -1 });

  // 공지를 먼저, 그 다음 일반 게시글
  const allPosts = [...notices, ...normalPosts];

  // 페이지네이션 적용
  const posts = allPosts.slice(skip, skip + Number(limit));

  // 각 게시글의 댓글 수 계산
  const postsWithCommentCount = await Promise.all(
    posts.map(async post => {
      const commentCount = await Comment.countDocuments({ post: post._id });
      return {
        ...post.toObject(),
        commentCount,
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
    filters: { type, region, search },
  });
});

// 게시글 단일 조회
exports.getPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  await BoardPost.updateOne({ _id: postId }, { $inc: { viewCount: 1 } }, { timestamps: false });

  const post = await BoardPost.findOne({ _id: postId })
    .populate('author', 'id email authority')
    .exec();

  if (!post) {
    throw new NotFoundError('게시글을 찾을 수 없습니다.');
  }

  res.json({
    success: true,
    post,
  });
});

// 게시글 수정
exports.updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { title, content, tags } = req.body;

  // 개발 환경에서만 로깅
  if (process.env.NODE_ENV === 'development') {
    console.log('게시글 수정 요청 데이터:', { postId, title, tags });
  }

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

  // 게시글 정보는 로깅하지 않음 (보안상 이유)

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
    if (tags.type || tags.region || tags.subcategory) {
      // 태그 유효성 검증
      if (tags.type) {
        const typeTag = await Tag.findOne({ category: 'type', value: tags.type, isActive: true });
        if (!typeTag) {
          throw new ValidationError('유효하지 않은 Type 태그입니다.');
        }
        updateData['tags.type'] = tags.type;
      }

      if (tags.region) {
        const regionTag = await Tag.findOne({
          category: 'region',
          value: tags.region,
          isActive: true,
        });
        if (!regionTag) {
          throw new ValidationError('유효하지 않은 Region 태그입니다.');
        }
        updateData['tags.region'] = tags.region;
      }

      // 소주제 업데이트
      if (tags.subcategory !== undefined) {
        // 소주제가 빈 문자열이면 삭제, 아니면 업데이트
        if (tags.subcategory === '') {
          updateData['tags.subcategory'] = undefined;
        } else {
          // 소주제 유효성 검증
          if (tags.type && tags.subcategory) {
            const validSubCategories = SUB_CATEGORIES[tags.type];
            if (!validSubCategories || !validSubCategories.includes(tags.subcategory)) {
              throw new ValidationError('유효하지 않은 소주제입니다.');
            }
          }
          updateData['tags.subcategory'] = tags.subcategory;
        }
      }
    }
  }

  updateData.modifiedAt = new Date();

  // 업데이트 데이터는 보안상 로깅하지 않음

  // findByIdAndUpdate 사용하여 업데이트
  const updatedPost = await BoardPost.findByIdAndUpdate(postId, updateData, {
    new: true,
    runValidators: false,
  });

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
      modifiedAt: updatedPost.modifiedAt,
    },
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
    message: '게시글 삭제 성공',
  });
});

// 소주제 정보 조회
exports.getSubCategories = asyncHandler(async (req, res) => {
  const { type } = req.query;

  if (!type) {
    return res.json({
      success: true,
      subCategories: SUB_CATEGORIES,
    });
  }

  const subCategories = SUB_CATEGORIES[type] || [];

  res.json({
    success: true,
    subCategories,
  });
});

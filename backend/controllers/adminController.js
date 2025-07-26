const User = require('../models/User');
const BoardPost = require('../models/BoardPost');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');
const {
  asyncHandler,
  ValidationError,
  NotFoundError,
  AuthorizationError,
  ConflictError,
} = require('../middleware/errorHandler');

// 관리자: 모든 사용자 목록 조회 (페이지네이션 포함)
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  let query = {};
  if (search) {
    query = {
      $or: [
        { id: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    };
  }

  const users = await User.find(query, 'id email authority createdAt updatedAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const totalUsers = await User.countDocuments(query);
  const totalPages = Math.ceil(totalUsers / Number(limit));

  res.json({
    success: true,
    users,
    totalUsers,
    totalPages,
    currentPage: Number(page),
    limit: Number(limit),
  });
});

// 관리자: 사이트 통계 정보 조회
exports.getStats = asyncHandler(async (req, res) => {
  const userCount = await User.countDocuments();
  const postCount = await BoardPost.countDocuments();
  const commentCount = await Comment.countDocuments();

  // 최근 7일간의 게시글 수
  const lastWeekPosts = await BoardPost.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  });

  // 최근 7일간의 댓글 수
  const lastWeekComments = await Comment.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  });

  // 권한별 사용자 수
  const authorityStats = await User.aggregate([
    { $group: { _id: '$authority', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    stats: {
      userCount,
      postCount,
      commentCount,
      lastWeekPosts,
      lastWeekComments,
      authorityStats,
    },
  });
});

// 관리자: 모든 게시판 정보 조회 (Counter 컬렉션 활용)
exports.getAllBoards = asyncHandler(async (req, res) => {
  const boards = await mongoose.connection.collection('counters').find().toArray();
  res.json({
    success: true,
    boards,
  });
});

// 관리자: 새 게시판 유형 생성 (Counter 컬렉션 사용)
exports.createBoardType = asyncHandler(async (req, res) => {
  const { boardType, name, description, access } = req.body;

  // 필수 필드 검증
  if (!boardType || !name) {
    throw new ValidationError('게시판 타입과 이름은 필수입니다.');
  }

  const Counter = require('../models/Counter');

  // 새 게시판 생성 시 기본 seq값은 0, access 기본값 1
  const newBoard = await Counter.create({
    _id: boardType,
    seq: 0,
    name,
    description,
    access: access || 1,
  });

  res.status(201).json({
    success: true,
    message: '게시판 생성 성공',
    board: newBoard,
  });
});

// 관리자: 사용자 권한 수정
exports.updateUserAuthority = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { authority } = req.body;

  // 권한 값 검증
  if (!authority || authority < 1 || authority > 5) {
    throw new ValidationError('유효한 권한 레벨(1-5)을 입력해주세요.');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }

  // 관리자는 자신의 권한을 낮출 수 없음
  if (user.authority === 5 && authority < 5) {
    throw new AuthorizationError('관리자는 자신의 권한을 낮출 수 없습니다.');
  }

  user.authority = authority;
  await user.save();

  res.json({
    success: true,
    message: '사용자 권한 수정 성공',
    user: {
      id: user.id,
      email: user.email,
      authority: user.authority,
      updatedAt: user.updatedAt,
    },
  });
});

// 관리자: 사용자 정보 수정
exports.updateUserInfo = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { email, authority } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }

  // 이메일 중복 체크 (자신 제외)
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('이미 존재하는 이메일입니다.');
    }
    user.email = email;
  }

  // 권한 수정
  if (authority !== undefined) {
    if (authority < 1 || authority > 5) {
      throw new ValidationError('유효한 권한 레벨(1-5)을 입력해주세요.');
    }

    // 관리자는 자신의 권한을 낮출 수 없음
    if (user.authority === 5 && authority < 5) {
      throw new AuthorizationError('관리자는 자신의 권한을 낮출 수 없습니다.');
    }

    user.authority = authority;
  }

  await user.save();

  res.json({
    success: true,
    message: '사용자 정보 수정 성공',
    user: {
      id: user.id,
      email: user.email,
      authority: user.authority,
      updatedAt: user.updatedAt,
    },
  });
});

// 관리자: 사용자 삭제
exports.deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }

  // 관리자는 자신을 삭제할 수 없음
  if (user.authority === 5) {
    throw new AuthorizationError('관리자는 자신을 삭제할 수 없습니다.');
  }

  // 사용자가 작성한 게시글과 댓글도 함께 삭제
  await BoardPost.deleteMany({ author: userId });
  await Comment.deleteMany({ author: userId });
  await User.findByIdAndDelete(userId);

  res.json({
    success: true,
    message: '사용자 삭제 성공',
  });
});

// 관리자: 사용자 상세 정보 조회
exports.getUserDetails = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId, 'id email authority createdAt updatedAt');
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다.');
  }

  // 사용자가 작성한 게시글 수
  const postCount = await BoardPost.countDocuments({ author: userId });

  // 사용자가 작성한 댓글 수
  const commentCount = await Comment.countDocuments({ author: userId });

  res.json({
    success: true,
    user: {
      ...user.toObject(),
      postCount,
      commentCount,
    },
  });
});

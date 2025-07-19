const User = require('../models/User');
const BoardPost = require('../models/BoardPost');
const mongoose = require('mongoose');
const { 
  asyncHandler, 
  ValidationError, 
  NotFoundError, 
  AuthorizationError 
} = require('../middleware/errorHandler');

// 관리자: 모든 사용자 목록 조회
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}, 'id email authority createdAt updatedAt');
  res.json({
    success: true,
    users
  });
});

// 관리자: 사이트 통계 정보 조회
exports.getStats = asyncHandler(async (req, res) => {
  const userCount = await User.countDocuments();
  const postCount = await BoardPost.countDocuments();
  const posts = await BoardPost.find();
  let commentCount = 0;
  posts.forEach(post => { commentCount += post.comments.length; });
  
  res.json({
    success: true,
    stats: {
      userCount,
      postCount,
      commentCount,
      activeUsers: 0,
      lastWeekPosts: 0
    }
  });
});

// 관리자: 모든 게시판 정보 조회 (Counter 컬렉션 활용)
exports.getAllBoards = asyncHandler(async (req, res) => {
  const boards = await mongoose.connection.collection('counters').find().toArray();
  res.json({
    success: true,
    boards
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
    access: access || 1 
  });
  
  res.status(201).json({ 
    success: true,
    message: '게시판 생성 성공', 
    board: newBoard 
  });
});

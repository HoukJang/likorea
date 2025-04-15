const User = require('../models/User');
const BoardPost = require('../models/BoardPost');
const mongoose = require('mongoose');

// 관리자: 모든 사용자 목록 조회
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'id email authority createdAt updatedAt');
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: '관리자: 사용자 목록 조회 실패', error: error.message });
  }
};

// 관리자: 사이트 통계 정보 조회
exports.getStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const postCount = await BoardPost.countDocuments();
    const posts = await BoardPost.find();
    let commentCount = 0;
    posts.forEach(post => { commentCount += post.comments.length; });
    // Dummy values for activeUsers, lastWeekPosts
    res.json({
      userCount,
      postCount,
      commentCount,
      activeUsers: 0,
      lastWeekPosts: 0
    });
  } catch (error) {
    res.status(400).json({ message: '관리자: 통계 조회 실패', error: error.message });
  }
};

// 관리자: 모든 게시판 정보 조회 (Counter 컬렉션 활용)
exports.getAllBoards = async (req, res) => {
  try {
    const boards = await mongoose.connection.collection('counters').find().toArray();
    res.json(boards);
  } catch (error) {
    res.status(400).json({ message: '관리자: 게시판 정보 조회 실패', error: error.message });
  }
};

// 관리자: 새 게시판 유형 생성 (Counter 컬렉션 사용)
exports.createBoardType = async (req, res) => {
  try {
    const { boardType, name, description, access } = req.body;
    const Counter = require('../models/Counter');
    // 새 게시판 생성 시 기본 seq값은 0, access 기본값 1
    const newBoard = await Counter.create({ _id: boardType, seq: 0, name, description, access: access || 1 });
    res.status(201).json({ message: '게시판 생성 성공', board: newBoard });
  } catch (error) {
    res.status(400).json({ message: '관리자: 게시판 생성 실패', error: error.message });
  }
};

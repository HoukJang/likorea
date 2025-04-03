const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 회원가입
exports.signup = async (req, res) => {
  try {
    console.log('회원가입 요청:', req.body);
    const { email, nickname, password } = req.body;
    // 이메일 중복 체크 추가
    const existingUser = await User.findOne({ email });
    if(existingUser) {
      return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
    }
    // User.create 에 email과 password 만 전달하도록 수정
    const user = await User.create({ email, password });
    res.status(201).json({ message: '회원가입 성공', user });
  } catch (error) {
    res.status(400).json({ message: '회원가입 실패', error: error.message });
  }
};

// 로그인
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: '잘못된 이메일' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: '잘못된 비밀번호' });
    }
    // payload에 nickname 대신 email 사용
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ message: '로그인 성공', token });
  } catch (error) {
    res.status(500).json({ message: '로그인 실패', error: error.message });
  }
};

// 사용자 목록 조회 (nickname 대신 email로 조회)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'email createdAt updatedAt');
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: '사용자 목록 조회 실패', error: error.message });
  }
};

// 사용자 상세 정보 조회 (nickname 대신 email 사용)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, 'email createdAt updatedAt');
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: '사용자 상세 정보 조회 실패', error: error.message });
  }
};

// 이메일 중복 여부 확인
exports.checkEmailExists = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email parameter required' });
    }
    const exists = await User.findOne({ email });
    res.json({ exists: !!exists });
  } catch (error) {
    res.status(400).json({ message: '이메일 중복 여부 확인 실패', error: error.message });
  }
};

// 로그아웃 (토큰 기반 인증의 경우 클라이언트에서 삭제 처리)
exports.logout = (req, res) => {
  res.json({ message: '로그아웃 성공' });
}
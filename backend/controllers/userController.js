const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 회원가입
exports.signup = async (req, res) => {
  try {
    console.log('회원가입 요청:', req.body);
    const { id, email, password, authority } = req.body;
    
    // 아이디 중복 체크
    const existingId = await User.findOne({ id });
    if (existingId) {
      return res.status(409).json({ message: '이미 존재하는 아이디입니다.' });
    }
    
    // 이메일 중복 체크
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
    }
    
    // 회원가입: id, email, password, authority (미제공시 authority는 기본 3)
    const user = await User.create({ id, email, password, authority });
    res.status(201).json({ message: '회원가입 성공', user });
  } catch (error) {
    res.status(400).json({ message: '회원가입 실패', error: error.message });
  }
};

// 로그인
exports.login = async (req, res) => {
  try {
    // id와 password로 로그인 시도
    const { id, password } = req.body;
    console.log('로그인 요청:', req.body);

    const user = await User.findOne({ id });
    if (!user) {
      return res.status(401).json({ message: '잘못된 아이디' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: '잘못된 비밀번호' });
    }
    
    const token = jwt.sign(
      { _id: user._id, id: user.id, email: user.email, authority: user.authority },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    const userObj = user.toObject();
    delete userObj.password; // password 필드 제거
    res.json({ message: '로그인 성공', token, user: userObj });
  } catch (error) {
    res.status(500).json({ message: '로그인 실패', error: error.message });
  }
};

// 사용자 목록 조회 (pagination 및 필요한 필드 반환)
exports.getUsers = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const users = await User.find({}, 'id email authority createdAt updatedAt')
      .skip((page - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    const total = await User.countDocuments({});
    res.json({ total, page: Number(page), limit: Number(limit), data: users });
  } catch (error) {
    res.status(400).json({ message: '사용자 목록 조회 실패', error: error.message });
  }
};

// 사용자 상세 정보 조회 (id, email, authority, createdAt, updatedAt 반환)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id }, 'id email authority createdAt updatedAt');
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
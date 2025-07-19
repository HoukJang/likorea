const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { 
  asyncHandler, 
  ValidationError, 
  AuthenticationError, 
  NotFoundError, 
  ConflictError 
} = require('../middleware/errorHandler');

// 회원가입
exports.signup = asyncHandler(async (req, res) => {
  const { id, email, password, authority } = req.body;
  
  // 필수 필드 검증
  if (!id || !email || !password) {
    throw new ValidationError('아이디, 이메일, 비밀번호는 필수입니다.');
  }
  
  // 아이디 중복 체크
  const existingId = await User.findOne({ id });
  if (existingId) {
    throw new ConflictError('이미 존재하는 아이디입니다.');
  }
  
  // 이메일 중복 체크
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('이미 존재하는 이메일입니다.');
  }
  
  // 회원가입: id, email, password, authority (미제공시 authority는 기본 3)
  const user = await User.create({ id, email, password, authority });
  res.status(201).json({ 
    success: true,
    message: '회원가입 성공', 
    user: {
      id: user.id,
      email: user.email,
      authority: user.authority,
      createdAt: user.createdAt
    }
  });
});

// 로그인
exports.login = asyncHandler(async (req, res) => {
  const { id, password } = req.body;

  // 필수 필드 검증
  if (!id || !password) {
    throw new ValidationError('아이디와 비밀번호는 필수입니다.');
  }

  const user = await User.findOne({ id });
  if (!user) {
    throw new AuthenticationError('잘못된 아이디입니다.');
  }
  
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AuthenticationError('잘못된 비밀번호입니다.');
  }
  
  const token = jwt.sign(
    { _id: user._id, id: user.id, email: user.email, authority: user.authority },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
  
  const userObj = user.toObject();
  delete userObj.password; // password 필드 제거
  
  res.json({ 
    success: true,
    message: '로그인 성공', 
    token, 
    user: userObj 
  });
});

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
};

// 아이디 중복 여부 확인
exports.checkIdExists = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ message: 'ID parameter required' });
    }
    const exists = await User.findOne({ id });
    res.json({ exists: !!exists });
  } catch (error) {
    res.status(400).json({ message: '아이디 중복 여부 확인 실패', error: error.message });
  }
};

// 사용자 정보 수정
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, authority, password } = req.body;
    
    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    
    // 수정할 필드들 업데이트
    if (email) user.email = email;
    if (authority !== undefined) user.authority = authority;
    if (password) user.password = password;
    
    await user.save();
    
    const userObj = user.toObject();
    delete userObj.password;
    
    res.json({ 
      message: '사용자 정보 수정 성공', 
      user: userObj 
    });
  } catch (error) {
    res.status(400).json({ message: '사용자 정보 수정 실패', error: error.message });
  }
};

// 사용자 삭제
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    
    await User.findByIdAndDelete(user._id);
    res.json({ message: '사용자 삭제 성공' });
  } catch (error) {
    res.status(400).json({ message: '사용자 삭제 실패', error: error.message });
  }
};

// 토큰 유효성 검증
exports.verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ valid: false, message: '토큰이 제공되지 않았습니다.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id, 'id email authority');
    
    if (!user) {
      return res.status(401).json({ valid: false, message: '유효하지 않은 토큰입니다.' });
    }
    
    res.json({ 
      valid: true, 
      user: {
        id: user.id,
        email: user.email,
        authority: user.authority
      }
    });
  } catch (error) {
    res.status(401).json({ valid: false, message: '토큰 검증 실패', error: error.message });
  }
};
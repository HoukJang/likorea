const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
  try {
    const { email, nickname, password } = req.body;
    const user = await User.create({ email, nickname, password });
    res.status(201).json({ message: '회원가입 성공', user });
  } catch (error) {
    res.status(400).json({ message: '회원가입 실패', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: '잘못된 이메일 또는 비밀번호' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: '잘못된 이메일 또는 비밀번호' });
    }
    // 로그인 성공 시 JWT 발행
    const token = jwt.sign(
      { id: user._id, nickname: user.nickname },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ message: '로그인 성공', token });
  } catch (error) {
    res.status(500).json({ message: '로그인 실패', error: error.message });
  }
};
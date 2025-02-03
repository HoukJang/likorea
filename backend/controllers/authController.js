const bcrypt = require('bcrypt');
const User = require('../models/User'); // User 모델을 정의했다고 가정

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 이미 존재하는 회원인지 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('이미 존재하는 이메일입니다.');
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: '회원가입 성공', user: newUser });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ error: '회원가입 실패' });
  }
};
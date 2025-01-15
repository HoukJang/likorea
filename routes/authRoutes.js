const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 회원가입 페이지
router.get('/register', (req, res) => {
  res.render('register');
});

// 회원가입 처리
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    // 중복 체크
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.send('이미 존재하는 사용자 이름입니다.');
    }

    // 관리자 계정을 직접 생성하려면 isAdmin: true
    // 예) username이 "admin"이면 자동으로 관리자
    const isAdmin = (username === "admin") ? true : false;

    const newUser = new User({ username, password, isAdmin });
    await newUser.save();

    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.send('회원가입 중 오류 발생');
  }
});

// 로그인 페이지
router.get('/login', (req, res) => {
  res.render('login');
});

// 로그인 처리
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.send('존재하지 않는 사용자입니다.');
    }

    // 비밀번호 비교
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.send('비밀번호가 올바르지 않습니다.');
    }

    // 세션에 사용자 정보 저장
    req.session.userId = user._id;
    req.session.isAdmin = user.isAdmin;

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.send('로그인 중 오류 발생');
  }
});

// 로그아웃
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;

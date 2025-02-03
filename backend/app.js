require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const postRoutes = require('./routes/postRoutes');
const authRoutes = require('./routes/authRoutes'); // 추가

const app = express();
connectDB();

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우팅 설정
app.use('/api', authRoutes);      // 회원가입, 로그인 등 auth 관련 라우트
app.use('/api/posts', postRoutes);  // 게시글 관련 라우트

// 서버 실행
const PORT = process.env.SERVER_PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
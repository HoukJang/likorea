const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');

const userRoutes = require('./routes/userRoutes');
const boardRoutes = require('./routes/boardRoutes');

const app = express();

// 요청 본문 파싱 및 CORS 설정
app.use(express.json());
app.use(cors());

// Add logging middleware to log every API call
app.use((req, res, next) => {
    console.log(`API 호출: ${req.method} ${req.originalUrl}`);
    next();
});

connectDB();

// API 라우트 설정
app.use('/api/users', userRoutes);
app.use('/api/boards', boardRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`));
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');

const userRoutes = require('./routes/userRoutes');
const boardRoutes = require('./routes/boardRoutes');
const adminRoutes = require('./routes/adminRoutes');


const app = express();

// 요청 본문 파싱 및 CORS 설정
app.use(express.json());

const allowedOrigins = ['http://localhost:3000', 'http://your-domain.com'];
app.use(cors({
  origin: function(origin, callback) {
    // 요청이 없는 경우(예: Curl) 허용
    if (!origin) {
      return callback(null, true);
    }
    // 요청된 origin을 출력해서 어떤 값이 들어오는지 확인
    console.log('요청된 Origin:', origin);
    // origin 끝의 슬래시 제거
    const normalizedOrigin = origin.replace(/\/+$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${normalizedOrigin}`));
    }
  },
  credentials: true
}));

// Add logging middleware to log every API call
app.use((req, res, next) => {
    console.log(`API 호출: ${req.method} ${req.originalUrl}`);
    next();
});

connectDB();

// API 라우트 설정
app.use('/api/users', userRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/admin', adminRoutes); // 추가된 관리자 전용 API 라우트

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`));
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const postRoutes = require('./routes/postRoutes');

const app = express();  // Express 앱 생성
connectDB();      // MongoDB 연결

// 미들웨어 설정
app.use(cors());    // CORS 허용--다른 도메인에서 api 호출 가능
app.use(express.json());    // JSON 파싱
app.use(express.urlencoded({ extended: true }));

// 라우팅 설정
app.use('/api/posts', postRoutes);

// 서버 실행
const PORT = process.env.SERVER_PORT;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
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

// 사용자 관련 API
// GET /api/users : 사용자 목록 조회
app.get('/api/users', (req, res) => {
	// ...existing code...
	res.json({ message: '사용자 목록 조회' });
});

// POST /api/users : 신규 사용자 등록
app.post('/api/users', (req, res) => {
	// ...existing code...
	res.json({ message: '신규 사용자 등록', data: req.body });
});

// GET /api/users/:id : 사용자 상세 정보 조회
app.get('/api/users/:id', (req, res) => {
	// ...existing code...
	res.json({ message: '사용자 상세 정보 조회', id: req.params.id });
});

// GET /api/users/exists?email={email} : 이메일 중복 여부 확인
app.get('/api/users/exists', (req, res) => {
    console.log('이메일 중복 여부 확인 API 호출'); // Added explicit log for this endpoint
	const email = req.query.email;
	if (!email) {
		return res.status(400).json({ error: 'Email parameter required' });
	}
	// 이메일 중복 확인 로직 (placeholder)
	const exists = false; // 예시 값
	res.json({ email, exists });
});

// 인증 관련 API
// POST /api/login : 사용자 로그인
app.post('/api/login', (req, res) => {
	// ...existing code...
	res.json({ message: '사용자 로그인', data: req.body });
});

// POST /api/logout : 사용자 로그아웃
app.post('/api/logout', (req, res) => {
	// ...existing code...
	res.json({ message: '사용자 로그아웃' });
});

// API 라우트 설정
app.use('/api/users', userRoutes);
app.use('/api/boards', boardRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`));
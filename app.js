require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const boardRoutes = require('./routes/boardRoutes');
const Post = require('./models/Post');

const app = express();

// DB 연결
connectDB();

// EJS 템플릿, 정적 파일 설정
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// 세션 설정
app.use(
  session({
    secret: 'someSecretKey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/likorea' }),
    cookie: { maxAge: 1000 * 60 * 60 }, // 1시간
  })
);

// EJS에서 session 변수를 바로 쓸 수 있게 세팅
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// 라우트
app.use('/', authRoutes);         // /register, /login, /logout 등
app.use('/board', boardRoutes);   // /board/anabada, /board/meeting, ...

// 메인 페이지
app.get('/', async (req, res) => {
  try {
    // 최근 등록된 글 몇 개만 가져오기 (각 게시판에서 최신글)
    const recentAnabada = await Post.find({ category: 'anabada' })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('author', 'username');
    const recentMeeting = await Post.find({ category: 'meeting' })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('author', 'username');
    const recentRecommend = await Post.find({ category: 'recommend' })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('author', 'username');

    res.render('index', { recentAnabada, recentMeeting, recentRecommend });
  } catch (err) {
    console.error(err);
    res.send('메인 페이지 로드 중 오류 발생');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

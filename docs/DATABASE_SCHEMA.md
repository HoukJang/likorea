# Database Schema Documentation

## 목차
1. [개요](#개요)
2. [데이터베이스 구조](#데이터베이스-구조)
3. [스키마 상세](#스키마-상세)
4. [인덱스 전략](#인덱스-전략)
5. [관계 및 참조](#관계-및-참조)
6. [데이터 무결성](#데이터-무결성)
7. [마이그레이션](#마이그레이션)

## 개요

Likorea는 MongoDB를 사용하며, Mongoose ODM을 통해 스키마를 정의하고 관리합니다.

### 데이터베이스 정보
- **Database Name**: `longisland` (production), `likorea` (development)
- **MongoDB Version**: 5.0+
- **Mongoose Version**: 8.x
- **Connection**: MongoDB Atlas (클라우드)

### 컬렉션 목록
1. `users` - 사용자 정보
2. `boardposts` - 게시글
3. `comments` - 댓글
4. `tags` - 태그 시스템
5. `counters` - 시퀀스 카운터
6. `trafficlogs` - 트래픽 로그

## 데이터베이스 구조

```
longisland/
├── users/               # 사용자 컬렉션
├── boardposts/         # 게시글 컬렉션
├── comments/           # 댓글 컬렉션
├── tags/               # 태그 컬렉션
├── counters/           # 카운터 컬렉션
└── trafficlogs/        # 트래픽 로그 컬렉션
```

## 스키마 상세

### Users Collection

사용자 정보를 저장하는 컬렉션입니다.

```javascript
{
  _id: ObjectId,              // MongoDB 자동 생성 ID
  id: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
    match: /email-regex/
  },
  password: {
    type: String,
    required: true,
    minlength: 60           // bcrypt hash
  },
  authority: {
    type: Number,
    default: 1,
    min: 1,
    max: 5,
    // 1-2: 기본 사용자
    // 3: 일반 사용자
    // 4: 모더레이터
    // 5: 관리자
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}

// 인덱스
- id: 1 (unique)
- email: 1 (unique)
- authority: 1
- createdAt: -1

// 가상 필드
- posts: 작성한 게시글 수
- comments: 작성한 댓글 수
```

### BoardPosts Collection

게시글을 저장하는 컬렉션입니다.

```javascript
{
  _id: ObjectId,
  number: {
    type: Number,
    unique: true,
    required: true          // Counter에서 자동 생성
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 50000        // HTML 포함
  },
  author: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  tags: {
    type: {
      type: String,
      required: true,
      enum: ['사고팔고', '부동산', '모임', '문의', '잡담', '기타']
    },
    region: {
      type: String,
      required: true        // Exit 0 ~ Exit 73
    }
  },
  subcategory: String,      // 소주제 (선택)
  views: {
    type: Number,
    default: 0
  },
  viewedIPs: [{
    ip: String,
    timestamp: Date
  }],
  likes: {
    type: Number,
    default: 0
  },
  likedUsers: [ObjectId],   // 좋아요한 사용자 목록
  status: {
    type: String,
    enum: ['active', 'deleted', 'hidden'],
    default: 'active'
  },
  isNotice: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimeType: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
  deletedAt: Date           // 소프트 삭제 시간
}

// 인덱스
- number: 1 (unique)
- author: 1
- 'tags.type': 1, 'tags.region': 1
- status: 1
- createdAt: -1
- isNotice: 1, isPinned: 1, createdAt: -1 (복합)
```

### Comments Collection

댓글을 저장하는 컬렉션입니다.

```javascript
{
  _id: ObjectId,
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  author: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: ObjectId,
    ref: 'BoardPost',
    required: true
  },
  parentComment: {
    type: ObjectId,
    ref: 'Comment',
    default: null           // null이면 최상위 댓글
  },
  depth: {
    type: Number,
    default: 0,
    max: 2                  // 최대 2단계까지
  },
  likes: {
    type: Number,
    default: 0
  },
  likedUsers: [ObjectId],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  editedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}

// 인덱스
- post: 1, createdAt: 1
- author: 1
- parentComment: 1
- isDeleted: 1

// 가상 필드
- replies: 대댓글 목록
- replyCount: 대댓글 수
```

### Tags Collection

태그 정보를 저장하는 컬렉션입니다.

```javascript
{
  _id: ObjectId,
  name: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['region', 'type', 'subcategory']
  },
  displayName: {
    type: String,
    required: true
  },
  parentCategory: String,    // 소주제의 경우 부모 카테고리
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    exitNumber: Number,      // Exit 번호 (region 태그)
    location: String,        // 지역명
    description: String      // 태그 설명
  },
  usageCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}

// 인덱스
- name: 1 (unique)
- category: 1, order: 1
- isActive: 1
- parentCategory: 1
```

### Counters Collection

시퀀스 번호를 관리하는 컬렉션입니다.

```javascript
{
  _id: String,              // 'boardPost', 'user' 등
  seq: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}

// 사용 예시
- _id: 'boardPost', seq: 1234  // 다음 게시글 번호: 1235
```

### TrafficLogs Collection

트래픽 로그를 저장하는 컬렉션입니다.

```javascript
{
  _id: ObjectId,
  ip: String,
  userAgent: String,
  method: String,
  url: String,
  statusCode: Number,
  responseTime: Number,     // ms
  user: {
    type: ObjectId,
    ref: 'User'
  },
  referer: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    browser: String,
    os: String,
    device: String
  }
}

// 인덱스
- timestamp: -1
- user: 1
- statusCode: 1
- ip: 1

// TTL 인덱스 (30일 후 자동 삭제)
- timestamp: 1 (expireAfterSeconds: 2592000)
```

## 인덱스 전략

### 성능 최적화 인덱스

1. **Users Collection**
   ```javascript
   // 로그인 최적화
   { id: 1, password: 1 }
   
   // 관리자 조회 최적화
   { authority: -1, createdAt: -1 }
   ```

2. **BoardPosts Collection**
   ```javascript
   // 목록 조회 최적화
   { status: 1, createdAt: -1 }
   
   // 태그 필터링 최적화
   { 'tags.type': 1, 'tags.region': 1, createdAt: -1 }
   
   // 사용자별 게시글 조회
   { author: 1, status: 1, createdAt: -1 }
   ```

3. **Comments Collection**
   ```javascript
   // 게시글별 댓글 조회
   { post: 1, isDeleted: 1, createdAt: 1 }
   
   // 대댓글 조회
   { parentComment: 1, createdAt: 1 }
   ```

### 텍스트 검색 인덱스

```javascript
// BoardPosts 전문 검색
db.boardposts.createIndex({
  title: "text",
  content: "text"
}, {
  weights: {
    title: 10,
    content: 5
  },
  default_language: "korean"
});
```

## 관계 및 참조

### 참조 관계 다이어그램

```
User (1) ──────┬──── (N) BoardPost
               │
               └──── (N) Comment
               
BoardPost (1) ──── (N) Comment

Comment (1) ──── (N) Comment (대댓글)

Tag (N) ──── (N) BoardPost
```

### Population 전략

```javascript
// 게시글 조회 시
BoardPost.findById(id)
  .populate('author', 'id email authority')
  .populate({
    path: 'comments',
    populate: {
      path: 'author',
      select: 'id email'
    }
  });

// 댓글 조회 시
Comment.find({ post: postId })
  .populate('author', 'id email')
  .populate({
    path: 'replies',
    populate: {
      path: 'author',
      select: 'id email'
    }
  });
```

## 데이터 무결성

### 트랜잭션 사용

```javascript
// 게시글 삭제 시 관련 댓글도 함께 처리
const session = await mongoose.startSession();
session.startTransaction();

try {
  // 게시글 삭제
  await BoardPost.findByIdAndUpdate(
    postId,
    { status: 'deleted', deletedAt: new Date() },
    { session }
  );
  
  // 관련 댓글 삭제
  await Comment.updateMany(
    { post: postId },
    { isDeleted: true, deletedAt: new Date() },
    { session }
  );
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 데이터 검증

1. **Schema 레벨 검증**
   - required 필드
   - 데이터 타입
   - enum 값
   - min/max 제약

2. **Application 레벨 검증**
   - 비즈니스 로직 검증
   - 중복 체크
   - 권한 확인

3. **Database 레벨 검증**
   - Unique 인덱스
   - 참조 무결성

## 마이그레이션

### 초기 설정

```bash
# 데이터베이스 초기화
cd backend
node utils/initDB.js

# 개발 환경 설정
node utils/setupDevDB.js
```

### 스키마 변경 전략

1. **하위 호환성 유지**
   - 새 필드는 optional 또는 default 값 설정
   - 기존 필드 제거 대신 deprecated 마킹

2. **단계적 마이그레이션**
   ```javascript
   // Step 1: 새 필드 추가
   newField: { type: String, default: '' }
   
   // Step 2: 데이터 마이그레이션
   await Model.updateMany({}, { $set: { newField: 'value' } });
   
   // Step 3: 필드를 required로 변경
   newField: { type: String, required: true }
   ```

3. **백업 전략**
   - 마이그레이션 전 백업
   - 롤백 계획 수립
   - 테스트 환경 검증

### 샘플 데이터

개발 환경을 위한 샘플 데이터 생성:

```javascript
// utils/generateDummyData.js
- 테스트 사용자 10명
- 게시글 100개
- 댓글 500개
- 모든 태그 활성화
```

## 성능 고려사항

### 쿼리 최적화

1. **Projection 사용**
   ```javascript
   User.find({}, 'id email authority');
   ```

2. **Lean 쿼리**
   ```javascript
   BoardPost.find().lean();
   ```

3. **Aggregation Pipeline**
   ```javascript
   BoardPost.aggregate([
     { $match: { status: 'active' } },
     { $group: { _id: '$tags.type', count: { $sum: 1 } } }
   ]);
   ```

### 캐싱 전략

1. **자주 변경되지 않는 데이터**
   - 태그 목록
   - 사용자 권한 정보

2. **집계 데이터**
   - 게시글 통계
   - 사용자 활동 통계

### 모니터링

1. **느린 쿼리 감지**
   ```javascript
   mongoose.set('debug', true);
   ```

2. **인덱스 사용 확인**
   ```javascript
   Model.find().explain('executionStats');
   ```
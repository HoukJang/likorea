# Utilities and Helpers Documentation

## 목차
1. [백엔드 유틸리티](#백엔드-유틸리티)
2. [프론트엔드 유틸리티](#프론트엔드-유틸리티)
3. [공통 헬퍼 함수](#공통-헬퍼-함수)
4. [초기화 스크립트](#초기화-스크립트)
5. [테스트 헬퍼](#테스트-헬퍼)

## 백엔드 유틸리티

### logger.js
로깅 시스템을 제공하는 유틸리티입니다.

```javascript
const logger = require('./utils/logger');

// 로그 레벨
logger.error('에러 메시지', { error: err });
logger.warn('경고 메시지');
logger.info('정보 메시지');
logger.debug('디버그 메시지');

// 사용 예시
try {
  // 작업 수행
} catch (error) {
  logger.error('작업 실패', { 
    error: error.message,
    stack: error.stack,
    userId: req.user?.id 
  });
}

// HTTP 요청 로깅
logger.info('API 요청', {
  method: req.method,
  url: req.url,
  ip: req.ip,
  userAgent: req.headers['user-agent']
});
```

**특징:**
- 환경별 로그 레벨 설정
- 파일 및 콘솔 출력
- 구조화된 로그 형식
- 타임스탬프 자동 추가

### initTags.js
태그 시스템을 초기화하는 유틸리티입니다.

```javascript
const { initializeTags } = require('./utils/initTags');

// 태그 초기화
await initializeTags();

// 생성되는 태그
// 1. 지역 태그 (Exit 0 ~ Exit 73)
const regionTags = [
  { name: 'Exit 0', displayName: 'Exit 0', exitNumber: 0 },
  { name: 'Exit 1', displayName: 'Exit 1', exitNumber: 1 },
  // ... Exit 73까지
];

// 2. 카테고리 태그
const categoryTags = [
  { name: '사고팔고', category: 'type' },
  { name: '부동산', category: 'type' },
  { name: '모임', category: 'type' },
  { name: '문의', category: 'type' },
  { name: '잡담', category: 'type' },
  { name: '기타', category: 'type' }
];

// 3. 소주제 태그
const subcategoryTags = {
  '사고팔고': ['일반', '자동차', '가구', '전자제품', '의류', '도서', '기타'],
  '부동산': ['아파트', '주택', '상가', '토지', '렌트', '룸메이트', '기타'],
  // ...
};
```

### initDB.js
데이터베이스를 초기화하는 스크립트입니다.

```javascript
// 사용법
node utils/initDB.js

// 수행 작업
1. 기존 데이터 삭제 (주의!)
2. 관리자 계정 생성
   - ID: likorea
   - Password: FhddkfZhfldk
   - Authority: 5
3. 태그 시스템 초기화
4. 카운터 초기화
5. 샘플 게시글 생성 (옵션)

// 프로그래밍 방식 사용
const initDatabase = require('./utils/initDB');
await initDatabase({
  clearData: true,
  createAdmin: true,
  createSampleData: false
});
```

### setupDevDB.js
개발 환경 데이터베이스를 설정하는 스크립트입니다.

```javascript
// 사용법
node utils/setupDevDB.js

// 생성되는 테스트 데이터
- 테스트 사용자 3명 (testuser1, testuser2, testuser3)
- 각 사용자별 게시글 10개
- 각 게시글별 댓글 5개
- 모든 태그 조합 테스트

// 테스트 계정
{
  id: 'testuser1',
  password: 'password',
  authority: 3
}
```

### generateDummyData.js
더미 데이터를 생성하는 유틸리티입니다.

```javascript
const { generateUsers, generatePosts, generateComments } = require('./utils/generateDummyData');

// 사용자 생성
const users = await generateUsers(10);

// 게시글 생성
const posts = await generatePosts(users, 100);

// 댓글 생성
const comments = await generateComments(users, posts, 500);

// 옵션
{
  userCount: 10,        // 생성할 사용자 수
  postCount: 100,       // 생성할 게시글 수
  commentCount: 500,    // 생성할 댓글 수
  locale: 'ko'          // 언어 설정
}
```

## 프론트엔드 유틸리티

### errorHandler.js
에러 처리를 위한 유틸리티입니다.

```javascript
import { handleError, ErrorTypes } from './utils/errorHandler';

// 에러 처리
try {
  await apiCall();
} catch (error) {
  const userMessage = handleError(error);
  setError(userMessage);
}

// 에러 타입별 처리
handleError(error, {
  [ErrorTypes.NETWORK]: '네트워크 연결을 확인해주세요.',
  [ErrorTypes.AUTH]: '로그인이 필요합니다.',
  [ErrorTypes.VALIDATION]: '입력값을 확인해주세요.',
  [ErrorTypes.SERVER]: '서버 오류가 발생했습니다.'
});

// 에러 로깅
handleError(error, {
  log: true,
  notify: true,
  fallback: '알 수 없는 오류가 발생했습니다.'
});
```

### logger.js (Frontend)
프론트엔드 로깅 유틸리티입니다.

```javascript
import logger from './utils/logger';

// 개발 환경에서만 로그 출력
logger.log('일반 로그');
logger.info('정보 로그');
logger.warn('경고 로그');
logger.error('에러 로그');

// 그룹 로깅
logger.group('API 호출');
logger.log('요청:', request);
logger.log('응답:', response);
logger.groupEnd();

// 성능 측정
logger.time('데이터 로드');
// ... 작업 수행
logger.timeEnd('데이터 로드');
```

### tagUtils.js
태그 관련 유틸리티 함수들입니다.

```javascript
import { 
  getTagDisplay, 
  filterByTags, 
  validateTags,
  getTagColor 
} from './utils/tagUtils';

// 태그 표시 텍스트 가져오기
const displayName = getTagDisplay('Exit 10');
// => "Exit 10 - Manhasset"

// 태그로 필터링
const filteredPosts = filterByTags(posts, {
  type: '사고팔고',
  region: 'Exit 10'
});

// 태그 유효성 검사
const isValid = validateTags({
  type: '사고팔고',
  region: 'Exit 10'
});

// 태그 색상 가져오기
const color = getTagColor('사고팔고');
// => "#FF6B6B"
```

### dataUtils.js
데이터 변환 및 포맷팅 유틸리티입니다.

```javascript
import { 
  formatDate, 
  formatNumber, 
  truncateText,
  parseQueryString,
  buildQueryString 
} from './utils/dataUtils';

// 날짜 포맷팅
formatDate(new Date());              // "2024-01-15"
formatDate(new Date(), 'relative');  // "3일 전"
formatDate(new Date(), 'full');      // "2024년 1월 15일 월요일"

// 숫자 포맷팅
formatNumber(1234567);               // "1,234,567"
formatNumber(1234567, 'compact');    // "123만"

// 텍스트 자르기
truncateText('긴 텍스트...', 50);   // "긴 텍스트..."

// 쿼리 스트링 처리
const params = parseQueryString('?page=1&type=사고팔고');
// => { page: '1', type: '사고팔고' }

const queryString = buildQueryString({ page: 1, type: '사고팔고' });
// => "page=1&type=사고팔고"
```

## 공통 헬퍼 함수

### 비동기 처리
```javascript
// asyncHandler - Express 비동기 에러 처리
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 사용 예시
router.get('/', asyncHandler(async (req, res) => {
  const data = await Model.find();
  res.json(data);
}));
```

### 페이지네이션
```javascript
// 페이지네이션 헬퍼
function paginate(query, options = {}) {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 10;
  const skip = (page - 1) * limit;
  
  return {
    query: query.skip(skip).limit(limit),
    pagination: {
      page,
      limit,
      skip
    }
  };
}

// 사용 예시
const { query, pagination } = paginate(
  Model.find({ status: 'active' }),
  { page: 2, limit: 20 }
);
```

### 입력 검증
```javascript
// 이메일 검증
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ID 검증
function isValidId(id) {
  const idRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return idRegex.test(id);
}

// 비밀번호 강도 검사
function checkPasswordStrength(password) {
  const strength = {
    score: 0,
    feedback: []
  };
  
  if (password.length >= 8) strength.score++;
  if (/[a-z]/.test(password)) strength.score++;
  if (/[A-Z]/.test(password)) strength.score++;
  if (/[0-9]/.test(password)) strength.score++;
  if (/[^a-zA-Z0-9]/.test(password)) strength.score++;
  
  return strength;
}
```

## 초기화 스크립트

### 환경별 초기화
```bash
# 개발 환경
npm run init:dev

# 테스트 환경
npm run init:test

# 프로덕션 환경 (주의!)
npm run init:prod
```

### 데이터 마이그레이션
```javascript
// 마이그레이션 스크립트 예시
async function migrate() {
  // 1. 백업
  await backupDatabase();
  
  // 2. 스키마 변경
  await updateSchema();
  
  // 3. 데이터 변환
  await transformData();
  
  // 4. 검증
  await validateMigration();
}
```

## 테스트 헬퍼

### testHelpers.js
테스트를 위한 헬퍼 함수들입니다.

```javascript
const { 
  createTestUser, 
  createTestPost, 
  getAuthToken,
  cleanupTestData 
} from './tests/helpers/testHelpers';

// 테스트 사용자 생성
const user = await createTestUser({
  id: 'testuser',
  authority: 3
});

// 인증 토큰 생성
const token = await getAuthToken(user);

// 테스트 게시글 생성
const post = await createTestPost({
  author: user._id,
  title: '테스트 게시글'
});

// 테스트 후 정리
afterEach(async () => {
  await cleanupTestData();
});
```

### API 테스트 헬퍼
```javascript
// API 요청 헬퍼
async function apiRequest(method, url, data, token) {
  const response = await request(app)
    [method.toLowerCase()](url)
    .set('Authorization', `Bearer ${token}`)
    .send(data);
    
  return response;
}

// 인증된 요청
const response = await apiRequest('POST', '/api/boards', postData, token);
```

### Mock 데이터 생성
```javascript
// Mock 데이터 팩토리
const mockFactory = {
  user: (overrides = {}) => ({
    id: 'mockuser',
    email: 'mock@example.com',
    authority: 1,
    ...overrides
  }),
  
  post: (overrides = {}) => ({
    title: 'Mock Post',
    content: 'Mock content',
    tags: { type: '잡담', region: 'Exit 10' },
    ...overrides
  }),
  
  comment: (overrides = {}) => ({
    content: 'Mock comment',
    ...overrides
  })
};
```

## 성능 유틸리티

### 캐싱 헬퍼
```javascript
// 메모리 캐시
const cache = new Map();

function memoize(fn, ttl = 60000) {
  return async (...args) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }
    
    const value = await fn(...args);
    cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
    
    return value;
  };
}

// 사용 예시
const getCachedTags = memoize(getTags, 300000); // 5분 캐시
```

### 디바운스/쓰로틀
```javascript
// 디바운스
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// 쓰로틀
function throttle(fn, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
```
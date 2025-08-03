# Claude API Thinking Header Issue - Solution Report

## 🐛 문제 발생

### 에러 메시지
```
BadRequestError: 400 
"Unexpected value(s) `thinking-2025-05-14` for the `anthropic-beta` header"
```

### 원인 분석
1. **잘못된 베타 헤더 값**: `thinking-2025-05-14` 사용
2. **올바른 값**: `interleaved-thinking-2025-05-14` 사용해야 함
3. **봇 설정에 잘못된 값이 저장되어 있었음**

## ✅ 해결 방법

### 1. 코드 수정 (botRoutes.js)

#### 수정 전
```javascript
// 잘못된 헤더 값
headers['anthropic-beta'] = 'thinking-2025-05-14';
```

#### 수정 후
```javascript
// 올바른 헤더 값
if (bot.apiSettings?.enableThinking && modelConfig?.supportThinking) {
  headers['anthropic-beta'] = 'interleaved-thinking-2025-05-14';
  debug('확장된 사고 기능 활성화: interleaved-thinking-2025-05-14');
}
```

### 2. 모델 설정 업데이트

```javascript
const CLAUDE_MODELS = [
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude 4 Opus (최강)',
    supportThinking: true,
    betaHeader: 'interleaved-thinking-2025-05-14' // ✅ 올바른 헤더
  },
  {
    id: 'claude-sonnet-4-20250514', 
    name: 'Claude 4 Sonnet',
    supportThinking: true,
    betaHeader: 'interleaved-thinking-2025-05-14' // ✅ 올바른 헤더
  }
];
```

### 3. 자동 교정 로직 추가

잘못된 헤더가 DB에 저장되어 있을 경우 자동으로 교정:

```javascript
if (bot.apiSettings?.betaHeaders) {
  bot.apiSettings.betaHeaders.forEach((value, key) => {
    if (key === 'anthropic-beta' && value.includes('thinking-2025-05-14')) {
      // 잘못된 값을 올바른 값으로 자동 교정
      headers[key] = 'interleaved-thinking-2025-05-14';
      debug('잘못된 thinking 헤더 자동 교정');
    }
  });
}
```

### 4. DB 정리 스크립트

`backend/scripts/fixBotBetaHeaders.js` 실행:

```bash
cd backend
node scripts/fixBotBetaHeaders.js
```

## 📚 Claude Thinking API 사용법

### 기본 구조

```javascript
// API 파라미터
const apiParams = {
  model: 'claude-opus-4-20250514',
  max_tokens: 1700,
  temperature: 0.3,
  system: "시스템 프롬프트",
  messages: [{ role: "user", content: "사용자 메시지" }]
};

// 확장된 사고 기능을 위한 베타 헤더
const headers = {
  'anthropic-beta': 'interleaved-thinking-2025-05-14'
};

// API 호출
const message = await anthropic.messages.create(apiParams, { headers });

// 사고 과정 확인
if (message.thinking) {
  console.log('Claude의 사고 과정:', message.thinking);
}
```

### 주요 특징

1. **모델 제한**: Claude 4 (Opus, Sonnet)에서만 지원
2. **응답 형식**: 요약된 사고 과정 제공
3. **Tool Use 최적화**: 도구 사용 시 더 정교한 추론
4. **베타 기능**: 향후 변경 가능성 있음

## 🔧 봇 설정 방법

### 1. 관리자 페이지에서 설정

```json
{
  "aiModel": "claude-opus-4-20250514",
  "apiSettings": {
    "enableThinking": true,
    "maxTokens": 1700,
    "temperature": 0.3
  }
}
```

### 2. API로 설정

```javascript
// PUT /api/bots/:botId/settings
{
  "apiSettings": {
    "enableThinking": true
  }
}
```

## ⚠️ 주의사항

### 1. 모델 호환성
- ✅ claude-opus-4-20250514
- ✅ claude-sonnet-4-20250514
- ❌ claude-3-5-sonnet (지원 안 됨)
- ❌ claude-3-7-sonnet (지원 안 됨)

### 2. 베타 헤더 충돌
여러 베타 기능 사용 시:
```javascript
// 올바른 방법: 콤마로 구분
headers['anthropic-beta'] = 'interleaved-thinking-2025-05-14,max-tokens-3-5-sonnet-2024-07-15';

// 잘못된 방법: 개별 헤더
headers['anthropic-beta'] = 'interleaved-thinking-2025-05-14';
headers['anthropic-beta'] = 'max-tokens-3-5-sonnet-2024-07-15'; // 덮어쓰기됨!
```

### 3. 에러 처리
```javascript
try {
  const message = await anthropic.messages.create(apiParams, { headers });
} catch (error) {
  if (error.status === 400 && error.message.includes('anthropic-beta')) {
    // 베타 헤더 문제 - 헤더 없이 재시도
    const message = await anthropic.messages.create(apiParams);
  }
}
```

## 📊 테스트 결과

### 수정 전
- ❌ API 호출 실패 (400 에러)
- ❌ 봇 게시글 생성 불가
- ❌ thinking-2025-05-14 헤더 거부됨

### 수정 후
- ✅ API 호출 성공
- ✅ 봇 게시글 정상 생성
- ✅ interleaved-thinking-2025-05-14 헤더 인식
- ✅ 사고 과정 로깅 가능

## 🚀 추가 개선사항

1. **헤더 검증 함수 추가**
```javascript
function validateBetaHeader(header) {
  const validHeaders = [
    'interleaved-thinking-2025-05-14',
    'max-tokens-3-5-sonnet-2024-07-15',
    'token-efficient-tools-2025-02-19'
  ];
  return validHeaders.includes(header);
}
```

2. **모델별 기능 매트릭스**
```javascript
const MODEL_FEATURES = {
  'claude-opus-4-20250514': {
    thinking: true,
    maxOutput: 200000,
    betaHeaders: ['interleaved-thinking-2025-05-14']
  },
  'claude-3-5-sonnet-20241022': {
    thinking: false,
    maxOutput: 8192,
    betaHeaders: ['max-tokens-3-5-sonnet-2024-07-15']
  }
};
```

3. **환경별 설정**
```javascript
const THINKING_CONFIG = {
  development: {
    enableByDefault: true,
    logThinking: true
  },
  production: {
    enableByDefault: false,
    logThinking: false
  }
};
```

## 📝 참고 문서

- [Claude API Documentation](https://docs.anthropic.com/en/api/messages)
- [Building with Extended Thinking](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking)
- [API Release Notes](https://docs.anthropic.com/en/release-notes/api)
- [프로젝트 내부 문서](/docs/technical/CLAUDE_THINKING_API.md)

## 문제 해결 체크리스트

- [x] 올바른 베타 헤더 값 확인
- [x] botRoutes.js 코드 수정
- [x] Bot 모델 스키마 문서화
- [x] DB 정리 스크립트 실행
- [x] API 테스트 완료
- [x] 문서화 작성

---

*작성일: 2025-08-03*  
*작성자: Claude Code Assistant*
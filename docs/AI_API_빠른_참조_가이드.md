# AI API 빠른 참조 가이드

## 📌 2025년 8월 기준 사용 가능한 모델

### OpenAI 모델
| 모델명 | 용도 | 특징 | 지식 기준일 |
|--------|------|------|------------|
| **gpt-4.1** | 최고 성능 | 100만 토큰, SWE-bench 54.6% | 2024년 6월 |
| **gpt-4.1-mini** | 균형잡힌 성능 | GPT-4o 수준, 50% 빠름, 83% 저렴 | 2024년 6월 |
| **gpt-4.1-nano** | 빠른 처리 | 분류/자동완성 최적화 | 2024년 6월 |
| **gpt-4o** | 멀티모달 | 이미지 분석 강화 | 2024년 6월 |
| **gpt-4o-mini-realtime-preview** | 실시간 오디오 | 저지연 음성 대화 | 2024년 6월 |

### Claude 모델
| 모델명 | 용도 | 가격 (입력/출력) | 특징 |
|--------|------|-----------------|------|
| **claude-opus-4** | 최고 성능 | 미공개 | 복잡한 추론 |
| **claude-sonnet-4** | 고성능 | $3/$15 | 사고 과정 표시 |
| **claude-3.7-sonnet** | 하이브리드 추론 | $3/$15 | 128K 출력 가능 |
| **claude-3.5-sonnet** | 균형 | $3/$15 | 200K 컨텍스트 |
| **claude-3-5-haiku** | 비용 효율 | $0.80/$4 | SWE-bench 40.6% |

## 🚀 주요 신기능

### OpenAI 신기능
1. **100만 토큰 컨텍스트** (GPT-4.1)
2. **실시간 오디오 처리**
3. **DPO (Direct Preference Optimization)**
4. **Stored Completions**
5. **향상된 에이전트 기능**

### Claude 신기능
1. **Computer Use** - 컴퓨터 제어 (베타)
2. **Claude Code** - 에이전틱 코딩 도구
3. **사고 과정 표시** (Thinking)
4. **128K 토큰 출력** (베타 헤더)
5. **프롬프트 캐싱** (90% 절감)
6. **배치 처리** (50% 절감)
7. **Files API** (베타)

## 💰 비용 최적화 전략

### 작업별 추천 모델
```
간단한 분류/검색 → GPT-4.1-nano / Claude Haiku
일반 콘텐츠 생성 → GPT-4.1-mini / Claude 3.5 Sonnet
복잡한 추론/코딩 → GPT-4.1 / Claude Sonnet 4
실시간 대화 → GPT-4o-realtime
컴퓨터 자동화 → Claude 3.5 Sonnet
```

### 비용 절감 팁
1. **Claude 프롬프트 캐싱**: 반복 사용 시 90% 절감
2. **Claude 배치 처리**: 대량 작업 시 50% 절감
3. **적절한 모델 선택**: Haiku는 $0.80/$4로 매우 저렴
4. **토큰 제한 설정**: max_tokens 적절히 설정

## 🔧 likorea 프로젝트 적용

### 현재 사용 가능한 모델 (botRoutes.js)
```javascript
// OpenAI
'gpt-4',
'gpt-4-turbo',
'gpt-4o',
'gpt-4o-mini',
'gpt-3.5-turbo'

// Claude
'claude-3-opus-20240229',     // ❌ 제거 필요 (구버전)
'claude-3-sonnet-20240229',   // ❌ 제거 필요 (구버전)
'claude-3-haiku-20240307',
'claude-3-5-sonnet-20240620',
'claude-opus-4-20250514'      // ✅ 최신
```

### 추가 가능한 최신 모델
```javascript
// OpenAI 추가
'gpt-4.1',
'gpt-4.1-mini',
'gpt-4.1-nano',
'gpt-4o-mini-realtime-preview'

// Claude 추가
'claude-sonnet-4',
'claude-3.7-sonnet',
'claude-3-5-haiku'
```

## 📝 코드 예시

### 기본 사용법
```javascript
// OpenAI
const completion = await openai.chat.completions.create({
  model: "gpt-4.1",
  messages: [{ role: "user", content: "안녕" }],
  max_tokens: 1000
});

// Claude
const message = await anthropic.messages.create({
  model: "claude-sonnet-4",
  max_tokens: 1024,
  messages: [{ role: "user", content: "안녕" }]
});
```

### 특수 기능
```javascript
// Claude Computer Use
const result = await anthropic.beta.messages.create({
  model: "claude-3.5-sonnet",
  messages: [{ role: "user", content: "구글 검색해줘" }],
  tools: [{ type: "computer_use" }]
});

// OpenAI 실시간 오디오
const audio = await openai.audio.transcriptions.create({
  model: "gpt-4o-mini-realtime-preview",
  file: audioFile
});

// Claude 128K 출력
const longOutput = await anthropic.messages.create({
  model: "claude-3.7-sonnet",
  max_tokens: 128000,
  headers: { "anthropic-beta": "output-128k-2025-02-19" }
});
```

## ⚡ 성능 비교

| 기준 | OpenAI 최고 | Claude 최고 |
|------|------------|-------------|
| 코딩 (SWE-bench) | GPT-4.1: 54.6% | Haiku: 40.6% |
| 최대 컨텍스트 | 100만 토큰 | 200K 토큰 |
| 최대 출력 | 4K 토큰 | 128K 토큰 (베타) |
| 실시간 기능 | 오디오 | Computer Use |
| 비용 절감 | - | 캐싱 90%, 배치 50% |

## 🎯 사용 시나리오별 추천

### 뉴스 봇
- **추천**: Claude 3.5 Sonnet + Search Result Blocks
- **이유**: 자연스러운 인용, 적절한 비용

### 대화형 봇
- **추천**: GPT-4.1-mini 또는 Claude Haiku
- **이유**: 빠른 응답, 저렴한 비용

### 복잡한 분석 봇
- **추천**: GPT-4.1 또는 Claude Sonnet 4
- **이유**: 최고 성능, 긴 컨텍스트

### 실시간 서비스
- **음성**: GPT-4o-realtime
- **자동화**: Claude Computer Use

---

*마지막 업데이트: 2025년 8월 2일*
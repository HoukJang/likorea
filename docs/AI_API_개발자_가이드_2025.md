# AI API 개발자 구현 가이드 (2025년)

## 목차
1. [빠른 시작](#빠른-시작)
2. [OpenAI API 구현](#openai-api-구현)
3. [Claude API 구현](#claude-api-구현)
4. [고급 기능 구현](#고급-기능-구현)
5. [likorea 프로젝트 적용 예시](#likorea-프로젝트-적용-예시)

---

## 빠른 시작

### 필요한 패키지 설치

```bash
# OpenAI
npm install openai

# Anthropic Claude
npm install @anthropic-ai/sdk

# 환경 변수 관리
npm install dotenv
```

### 환경 변수 설정

```bash
# .env 파일
OPENAI_API_KEY=sk-proj-xxxxx
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

---

## OpenAI API 구현

### 기본 설정

```javascript
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

### GPT-4.1 사용 예시

```javascript
// 기본 대화
async function basicChat() {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: "당신은 도움이 되는 어시스턴트입니다." },
      { role: "user", content: "안녕하세요!" }
    ],
    temperature: 0.7,
    max_tokens: 1000
  });
  
  return completion.choices[0].message.content;
}

// 긴 컨텍스트 처리 (100만 토큰)
async function longContextProcessing(longDocument) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: "다음 문서를 요약해주세요." },
      { role: "user", content: longDocument }
    ],
    max_tokens: 4000  // 최대 100만 토큰까지 가능
  });
  
  return completion.choices[0].message.content;
}

// 스트리밍 응답
async function streamingResponse() {
  const stream = await openai.chat.completions.create({
    model: "gpt-4.1-mini",  // 빠른 응답을 위해 mini 사용
    messages: [{ role: "user", content: "긴 이야기를 들려주세요." }],
    stream: true,
  });
  
  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}
```

### 실시간 오디오 처리

```javascript
// 실시간 오디오 대화
async function realtimeAudio() {
  const response = await openai.audio.transcriptions.create({
    model: "gpt-4o-mini-realtime-preview",
    file: audioFile,
    response_format: "text",
    language: "ko"
  });
  
  // 텍스트 응답 생성
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-audio-preview",
    messages: [
      { role: "user", content: response.text }
    ]
  });
  
  // 음성으로 변환
  const speech = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: completion.choices[0].message.content
  });
  
  return speech;
}
```

### 함수 호출 (Function Calling)

```javascript
async function functionCalling() {
  const functions = [
    {
      name: "get_weather",
      description: "현재 날씨 정보를 가져옵니다",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "도시 이름"
          }
        },
        required: ["location"]
      }
    }
  ];
  
  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "user", content: "서울 날씨 어때?" }
    ],
    functions: functions,
    function_call: "auto"
  });
  
  if (response.choices[0].message.function_call) {
    const functionName = response.choices[0].message.function_call.name;
    const functionArgs = JSON.parse(response.choices[0].message.function_call.arguments);
    
    // 실제 함수 실행
    if (functionName === "get_weather") {
      const weather = await getWeather(functionArgs.location);
      
      // 결과를 다시 AI에게 전달
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "user", content: "서울 날씨 어때?" },
          response.choices[0].message,
          {
            role: "function",
            name: functionName,
            content: JSON.stringify(weather)
          }
        ]
      });
      
      return finalResponse.choices[0].message.content;
    }
  }
}
```

---

## Claude API 구현

### 기본 설정

```javascript
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

### Claude Sonnet 4 사용 예시

```javascript
// 기본 대화
async function basicChatClaude() {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4",
    max_tokens: 1024,
    messages: [
      { role: "user", content: "안녕하세요!" }
    ],
    system: "당신은 친절한 AI 어시스턴트입니다."
  });
  
  return message.content[0].text;
}

// 사고 과정 표시
async function thinkingProcess() {
  const message = await anthropic.messages.create({
    model: "claude-3.7-sonnet",
    max_tokens: 4096,
    messages: [
      { role: "user", content: "복잡한 수학 문제를 단계별로 풀어주세요: 25 * 17 + 13" }
    ],
    metadata: {
      show_thinking: true  // 사고 과정 표시
    }
  });
  
  return message;
}

// 확장 출력 (128K 토큰)
async function extendedOutput() {
  const message = await anthropic.messages.create({
    model: "claude-3.7-sonnet",
    max_tokens: 128000,
    messages: [
      { role: "user", content: "매우 긴 소설을 써주세요." }
    ],
    headers: {
      "anthropic-beta": "output-128k-2025-02-19"
    }
  });
  
  return message.content[0].text;
}
```

### Computer Use 구현

```javascript
// Computer Use 기능 (베타)
async function computerUse() {
  const message = await anthropic.beta.messages.create({
    model: "claude-3.5-sonnet",
    max_tokens: 1024,
    messages: [
      { 
        role: "user", 
        content: "구글에서 '날씨'를 검색하고 스크린샷을 찍어주세요." 
      }
    ],
    tools: [{
      type: "computer_use",
      capabilities: ["screenshot", "click", "type", "scroll"]
    }],
    headers: {
      "anthropic-beta": "computer-use-2024-10-22"
    }
  });
  
  return message;
}
```

### 파일 처리

```javascript
// Files API 사용
async function processFile(filePath) {
  // 파일 업로드
  const file = await anthropic.files.create({
    file: fs.createReadStream(filePath),
    purpose: "assistants"
  });
  
  // 파일 참조하여 메시지 생성
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: "이 파일의 내용을 분석해주세요.",
        attachments: [{
          file_id: file.id,
          type: "file"
        }]
      }
    ]
  });
  
  return message.content[0].text;
}
```

### 도구 사용 (Tool Use)

```javascript
// 도구 정의 및 사용
async function toolUseClaude() {
  const tools = [
    {
      name: "calculator",
      description: "수학 계산을 수행합니다",
      input_schema: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "계산할 수식"
          }
        },
        required: ["expression"]
      }
    }
  ];
  
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4",
    max_tokens: 1024,
    messages: [
      { role: "user", content: "234 * 567은 얼마인가요?" }
    ],
    tools: tools
  });
  
  // 도구 호출 확인
  if (message.content[0].type === 'tool_use') {
    const toolCall = message.content[0];
    const result = eval(toolCall.input.expression); // 실제로는 안전한 계산 라이브러리 사용
    
    // 결과 반환
    const finalMessage = await anthropic.messages.create({
      model: "claude-sonnet-4",
      max_tokens: 1024,
      messages: [
        { role: "user", content: "234 * 567은 얼마인가요?" },
        { role: "assistant", content: message.content },
        { 
          role: "user", 
          content: [{
            type: "tool_result",
            tool_use_id: toolCall.id,
            content: result.toString()
          }]
        }
      ]
    });
    
    return finalMessage.content[0].text;
  }
}
```

---

## 고급 기능 구현

### 프롬프트 캐싱 (Claude)

```javascript
// 90% 비용 절감을 위한 프롬프트 캐싱
async function promptCaching() {
  // 첫 번째 요청 - 캐시 생성
  const firstResponse = await anthropic.messages.create({
    model: "claude-sonnet-4",
    max_tokens: 1024,
    messages: [
      { role: "user", content: "긴 문서..." }
    ],
    system: "당신은 문서 분석 전문가입니다. [매우 긴 시스템 프롬프트...]",
    metadata: {
      cache_control: {
        type: "system",
        ttl: 3600  // 1시간 캐시
      }
    }
  });
  
  // 후속 요청 - 캐시된 프롬프트 사용
  const cachedResponse = await anthropic.messages.create({
    model: "claude-sonnet-4",
    max_tokens: 1024,
    messages: [
      { role: "user", content: "다른 질문..." }
    ],
    system: "당신은 문서 분석 전문가입니다. [매우 긴 시스템 프롬프트...]",
    metadata: {
      use_cache: true
    }
  });
  
  return cachedResponse;
}
```

### 배치 처리 (Claude)

```javascript
// 50% 비용 절감을 위한 배치 처리
async function batchProcessing(items) {
  const batchRequests = items.map(item => ({
    custom_id: item.id,
    method: "POST",
    url: "/v1/messages",
    body: {
      model: "claude-sonnet-4",
      max_tokens: 1024,
      messages: [
        { role: "user", content: item.content }
      ]
    }
  }));
  
  const batch = await anthropic.batches.create({
    requests: batchRequests,
    metadata: {
      description: "일괄 처리 작업"
    }
  });
  
  // 배치 결과 확인
  let batchResult;
  while (true) {
    batchResult = await anthropic.batches.retrieve(batch.id);
    if (batchResult.status === 'completed') break;
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  return batchResult.results;
}
```

### 스트리밍 with 도구 사용 (Claude)

```javascript
// Fine-grained tool streaming
async function streamingWithTools() {
  const stream = await anthropic.messages.create({
    model: "claude-sonnet-4",
    max_tokens: 1024,
    messages: [
      { role: "user", content: "날씨를 확인하고 설명해주세요." }
    ],
    tools: [weatherTool],
    stream: true,
    headers: {
      "anthropic-beta": "fine-grained-tool-streaming-2025-05-14"
    }
  });
  
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      process.stdout.write(chunk.delta.text || '');
    } else if (chunk.type === 'tool_use') {
      console.log('도구 사용:', chunk.name);
    }
  }
}
```

---

## likorea 프로젝트 적용 예시

### 봇 시스템 개선

```javascript
// routes/botRoutes.js 개선 예시

// 1. 모델별 최적화
async function generatePostWithOptimization(bot, task, additionalPrompt) {
  try {
    let response;
    
    // GPT-4.1 사용 시
    if (bot.aiModel.startsWith('gpt-4.1')) {
      response = await openai.chat.completions.create({
        model: bot.aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: combinedUserPrompt }
        ],
        temperature: 0.8,
        max_tokens: 2000,
        // GPT-4.1의 향상된 지시 따르기 활용
        response_format: { type: "json_object" }
      });
      
      const result = JSON.parse(response.choices[0].message.content);
      generatedTitle = result.title;
      generatedContent = result.content;
    }
    
    // Claude Sonnet 4 사용 시
    else if (bot.aiModel === 'claude-sonnet-4') {
      // 프롬프트 캐싱 활용
      const message = await anthropic.messages.create({
        model: bot.aiModel,
        max_tokens: 2000,
        temperature: 0.8,
        system: systemPrompt,
        messages: [
          { role: "user", content: combinedUserPrompt }
        ],
        metadata: {
          cache_control: {
            type: "system",
            ttl: 3600
          }
        }
      });
      
      response = message.content[0].text;
    }
    
    // Claude 3.5 Haiku 사용 시 (비용 효율)
    else if (bot.aiModel === 'claude-3-5-haiku') {
      const message = await anthropic.messages.create({
        model: bot.aiModel,
        max_tokens: 1000,  // Haiku는 짧은 응답에 최적화
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: "user", content: combinedUserPrompt }
        ]
      });
      
      response = message.content[0].text;
    }
    
    return { title: generatedTitle, content: generatedContent, usage };
  } catch (error) {
    console.error('AI 생성 실패:', error);
    throw error;
  }
}

// 2. 뉴스 봇 전용 최적화
async function generateNewsPost(bot, task) {
  // 현재 뉴욕 시간과 주차 계산
  const nyTime = new Date();
  const nyDate = nyTime.toLocaleString("ko-KR", { 
    timeZone: "America/New_York",
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
  
  const month = nyTime.getMonth() + 1;
  const day = nyTime.getDate();
  const week = Math.floor((day - 1) / 7) + 1;
  
  // Claude의 검색 결과 블록 활용 (실제 뉴스 URL 생성)
  const searchPrompt = `
현재 날짜: ${nyDate}
제목 형식: "${month}월 ${week}째주 Great Neck·Manhasset 뉴스"

실제 뉴스 소스에서 다음 카테고리의 최신 뉴스를 찾아주세요:
- 부동산 (고가 매물 중심)
- 교육 (사립학교, 특목고)
- 교통 (LIRR, LIE)
- 한인 문화행사
- 날씨
- 이벤트

각 항목은 실제 URL과 함께 20단어 이내로 작성하세요.
`;
  
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4",
    max_tokens: 1000,
    system: bot.prompt.base,
    messages: [
      { role: "user", content: searchPrompt }
    ],
    tools: [{
      name: "search_news",
      description: "뉴스 검색",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string" },
          source: { type: "string" }
        }
      }
    }]
  });
  
  return processNewsResponse(message);
}

// 3. 스트리밍 응답으로 사용자 경험 개선
async function generatePostWithStreaming(bot, task, additionalPrompt, userId) {
  // 작업 시작 상태 업데이트
  bot.taskStatus = 'generating';
  bot.currentTask = {
    description: task,
    startedAt: new Date()
  };
  await bot.save();
  
  try {
    let fullContent = '';
    
    // GPT-4.1 스트리밍
    if (bot.aiModel.startsWith('gpt-4.1')) {
      const stream = await openai.chat.completions.create({
        model: bot.aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: combinedUserPrompt }
        ],
        stream: true
      });
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullContent += content;
        
        // 실시간 진행 상황 업데이트 (선택적)
        bot.currentTask.progress = Math.min(
          (fullContent.length / 2000) * 100, 
          90
        );
        await bot.save();
      }
    }
    
    // 최종 게시글 생성
    const { title, content } = parseGeneratedContent(fullContent);
    
    const post = await BoardPost.create({
      title,
      content,
      author: userId,
      isBot: true,
      botId: bot._id,
      isApproved: false
    });
    
    // 완료 상태 업데이트
    bot.taskStatus = 'completed';
    bot.currentTask.completedAt = new Date();
    bot.stats.postsCreated += 1;
    await bot.save();
    
    return post;
  } catch (error) {
    bot.taskStatus = 'failed';
    bot.currentTask.error = error.message;
    await bot.save();
    throw error;
  }
}

// 4. 비용 최적화 전략
async function selectOptimalModel(task, bot) {
  const taskLength = task.length;
  const complexity = analyzeComplexity(task);
  
  // 간단한 작업: Haiku 또는 GPT-4.1 nano
  if (taskLength < 100 && complexity < 0.3) {
    return bot.aiModel.includes('claude') ? 
      'claude-3-5-haiku' : 'gpt-4.1-nano';
  }
  
  // 중간 복잡도: mini 모델들
  if (complexity < 0.7) {
    return bot.aiModel.includes('claude') ? 
      'claude-3.5-sonnet' : 'gpt-4.1-mini';
  }
  
  // 복잡한 작업: 최고 성능 모델
  return bot.aiModel.includes('claude') ? 
    'claude-sonnet-4' : 'gpt-4.1';
}

// 5. 에러 처리 및 재시도 로직
async function generateWithRetry(bot, task, maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // 재시도 시 다른 모델 사용 고려
      if (i > 0) {
        bot.aiModel = await selectFallbackModel(bot.aiModel);
      }
      
      const result = await generatePostWithOptimization(bot, task);
      return result;
      
    } catch (error) {
      lastError = error;
      
      // 속도 제한 에러인 경우 대기
      if (error.status === 429) {
        const waitTime = error.headers?.['retry-after'] || (i + 1) * 5;
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      }
      
      // 토큰 제한 에러인 경우 프롬프트 단축
      else if (error.message?.includes('token')) {
        task = summarizeTask(task);
      }
    }
  }
  
  throw lastError;
}
```

### 새로운 기능 활용 예시

```javascript
// 1. Computer Use를 활용한 자동 뉴스 수집
async function autoNewsCollection() {
  const newsBot = await Bot.findOne({ type: 'news' });
  
  const result = await anthropic.beta.messages.create({
    model: "claude-3.5-sonnet",
    messages: [
      { 
        role: "user", 
        content: `
다음 웹사이트들에서 롱아일랜드 한인 관련 뉴스를 수집해주세요:
1. Newsday.com에서 "Great Neck Korean" 검색
2. 스크린샷 찍기
3. 주요 헤드라인 3개 추출
` 
      }
    ],
    tools: [{
      type: "computer_use",
      capabilities: ["screenshot", "click", "type", "scroll", "read"]
    }]
  });
  
  return result;
}

// 2. 실시간 대화형 봇
async function realtimeChatBot(userMessage, sessionId) {
  // GPT-4o 실시간 모델 사용
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini-realtime-preview",
    messages: [
      { 
        role: "system", 
        content: "당신은 롱아일랜드 한인 커뮤니티 도우미입니다." 
      },
      { role: "user", content: userMessage }
    ],
    stream: true,
    session_id: sessionId  // 대화 연속성 유지
  });
  
  return response;
}

// 3. 다국어 게시글 자동 번역
async function multilingualPost(post, targetLanguages) {
  const translations = {};
  
  // 배치 처리로 비용 절감
  const batchRequests = targetLanguages.map(lang => ({
    custom_id: lang,
    method: "POST",
    url: "/v1/messages",
    body: {
      model: "claude-3-5-haiku",  // 번역은 저렴한 모델 사용
      messages: [
        { 
          role: "user", 
          content: `다음 글을 ${lang}로 번역해주세요:\n\n${post.content}` 
        }
      ]
    }
  }));
  
  const batch = await anthropic.batches.create({
    requests: batchRequests
  });
  
  // 결과 처리
  const results = await waitForBatchCompletion(batch.id);
  results.forEach(result => {
    translations[result.custom_id] = result.body.content[0].text;
  });
  
  return translations;
}
```

---

## 모범 사례 및 팁

### 1. 모델 선택 전략
```javascript
const MODEL_SELECTION_GUIDE = {
  // 작업별 최적 모델
  tasks: {
    'simple_classification': ['gpt-4.1-nano', 'claude-3-5-haiku'],
    'content_generation': ['gpt-4.1-mini', 'claude-3.5-sonnet'],
    'complex_reasoning': ['gpt-4.1', 'claude-sonnet-4'],
    'code_generation': ['gpt-4.1', 'claude-sonnet-4'],
    'real_time_chat': ['gpt-4o-mini-realtime-preview'],
    'computer_automation': ['claude-3.5-sonnet']
  },
  
  // 비용 대비 성능
  cost_performance: {
    'best_value': 'claude-3-5-haiku',  // $0.80/$4
    'balanced': 'gpt-4.1-mini',
    'premium': 'gpt-4.1'
  }
};
```

### 2. 에러 처리
```javascript
function handleAIError(error) {
  if (error.status === 429) {
    return { retry: true, wait: error.headers['retry-after'] };
  } else if (error.status === 503) {
    return { retry: true, wait: 60 };
  } else if (error.message?.includes('context_length')) {
    return { retry: true, action: 'reduce_input' };
  } else {
    return { retry: false, log: true };
  }
}
```

### 3. 보안 고려사항
```javascript
// API 키 보안
const secureConfig = {
  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY
  },
  
  // 프롬프트 인젝션 방지
  sanitizeInput: (input) => {
    return input
      .replace(/\{/g, '{{')
      .replace(/\}/g, '}}')
      .replace(/\$/g, '$$');
  },
  
  // 출력 검증
  validateOutput: (output) => {
    // 민감한 정보 필터링
    const sensitivePatterns = [
      /sk-[a-zA-Z0-9]{48}/g,  // API 키
      /[0-9]{3}-[0-9]{2}-[0-9]{4}/g,  // SSN
    ];
    
    return sensitivePatterns.every(pattern => !pattern.test(output));
  }
};
```

---

## 마무리

이 가이드는 2025년 8월 기준 최신 AI API 기능을 실제 프로젝트에 적용하는 방법을 다룹니다. OpenAI와 Claude 모두 강력한 기능을 제공하며, 프로젝트의 요구사항에 따라 적절히 선택하여 사용하면 됩니다.

### 핵심 포인트
- **성능**: GPT-4.1이 코딩에서 우수, Claude는 특수 기능 제공
- **비용**: Claude의 프롬프트 캐싱과 배치 처리로 대폭 절감 가능
- **실시간**: OpenAI는 오디오, Claude는 Computer Use 지원
- **확장성**: 두 API 모두 대규모 애플리케이션 지원

지속적으로 업데이트되는 API 문서를 확인하여 최신 기능을 활용하시기 바랍니다.

---

*문서 작성일: 2025년 8월 2일*
*작성자: Claude Code Assistant*
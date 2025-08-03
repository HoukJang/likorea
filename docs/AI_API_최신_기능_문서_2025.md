# AI API 최신 기능 문서 (2025년 8월 기준)

## 목차
1. [OpenAI API](#openai-api)
   - [최신 모델](#openai-최신-모델)
   - [주요 기능](#openai-주요-기능)
   - [가격 정책](#openai-가격-정책)
2. [Claude API](#claude-api)
   - [최신 모델](#claude-최신-모델)
   - [주요 기능](#claude-주요-기능)
   - [가격 정책](#claude-가격-정책)
3. [비교 분석](#비교-분석)
4. [개발자를 위한 권장사항](#개발자를-위한-권장사항)

---

## OpenAI API

### OpenAI 최신 모델

#### GPT-4.1 시리즈 (2025년 4월 출시)

##### 1. **GPT-4.1**
- **성능**: GPT-4o 대비 모든 면에서 향상된 성능
- **코딩 능력**: SWE-bench Verified에서 54.6% 달성 (GPT-4o: 33.2%)
- **컨텍스트**: 최대 100만 토큰 지원
- **지식 기준일**: 2024년 6월

##### 2. **GPT-4.1 mini**
- **특징**: 소형 모델이지만 많은 벤치마크에서 GPT-4o를 능가
- **성능**: GPT-4o 수준의 지능을 유지하면서 지연시간 50% 감소
- **비용**: GPT-4o 대비 83% 저렴

##### 3. **GPT-4.1 nano**
- **용도**: 저지연, 고속 처리가 필요한 작업
- **성능**: MMLU 80.1%, GPQA 50.3% (GPT-4o mini보다 높은 점수)
- **적합 작업**: 분류, 자동완성 등

#### GPT-4o 업데이트 (2025년 3월)
- **지식 기준일**: 2023년 11월 → 2024년 6월으로 확장
- **멀티모달 개선**: 이미지 분석, 차트 이해, 공간 관계 해석 향상
- **실시간 오디오**: gpt-4o-mini-realtime-preview 모델로 저지연 음성 상호작용 지원

### OpenAI 주요 기능

#### 1. **Direct Preference Optimization (DPO)**
- 인간 선호도 기반 모델 가중치 조정
- RLHF보다 계산량이 적고 빠름
- 톤, 스타일, 콘텐츠 선호도 조정에 효과적

#### 2. **Stored Completions**
- 대화 이력 저장 및 활용
- 평가 및 파인튜닝용 데이터셋 생성

#### 3. **향상된 에이전트 기능**
- 지시 따르기 신뢰성 향상
- 긴 컨텍스트 이해도 개선
- 사용자 대신 작업을 독립적으로 수행

#### 4. **오디오 기능**
- gpt-4o-audio-preview: 텍스트/음성 상호작용 및 오디오 분석
- 실시간 대화형 AI 애플리케이션 구현 가능

### OpenAI 가격 정책
- GPT-4.1 시리즈의 구체적인 가격은 공개되지 않음
- GPT-4o와 동일한 요금 제한 적용 (유료 사용자)

---

## Claude API

### Claude 최신 모델

#### Claude 4 시리즈 (2025년 1월)

##### 1. **Claude Opus 4**
- **특징**: 가장 강력하고 지능적인 모델
- **능력**: 복잡한 추론과 고급 코딩에서 새로운 기준 수립

##### 2. **Claude Sonnet 4**
- **가격**: 
  - 입력: $3/백만 토큰
  - 출력: $15/백만 토큰
- **할인**: 프롬프트 캐싱 90%, 배치 처리 50% 절감
- **사고 과정**: 즉각 응답 또는 단계별 사고 과정 표시 가능

#### Claude 3.7 Sonnet (2024년 12월)
- **특징**: 시장 최초의 하이브리드 추론 모델
- **가격**: Sonnet 4와 동일 (사고 토큰 포함)
- **지식 기준일**: 2024년 10월
- **확장 출력**: beta 헤더 사용 시 128K 토큰까지 출력 가능

#### Claude 3.5 시리즈

##### Claude 3.5 Sonnet (2024년 6월)
- **성능**: Claude 3 Opus의 2배 속도
- **코딩**: 내부 평가에서 64% 문제 해결 (Opus: 38%)
- **컨텍스트**: 200K 토큰

##### Claude 3.5 Haiku
- **가격**: 
  - 입력: $0.80/백만 토큰
  - 출력: $4/백만 토큰
- **성능**: SWE-bench Verified 40.6% (원래 Sonnet 3.5 능가)

### Claude 주요 기능

#### 1. **Computer Use (2024년 10월)**
- 컴퓨터를 사람처럼 사용
- 화면 보기, 마우스 이동, 클릭, 텍스트 입력
- API를 통한 퍼블릭 베타 제공

#### 2. **Claude Code**
- 에이전틱 코딩 도구 (제한된 연구 프리뷰)
- 기능:
  - 코드 검색 및 읽기
  - 파일 편집
  - 테스트 작성 및 실행
  - GitHub 커밋/푸시
  - 커맨드라인 도구 사용

#### 3. **향상된 API 기능**

##### Search Result Content Blocks (베타)
- RAG 애플리케이션을 위한 자연스러운 인용
- 검색 결과에 적절한 출처 표시
- 웹 검색 수준의 인용 품질

##### Files API (퍼블릭 베타)
- 파일 업로드 및 Messages API에서 참조
- 코드 실행 도구와 연동

##### Interleaved Thinking (퍼블릭 베타)
- 도구 호출 사이에 사고 과정 표시
- beta 헤더: `interleaved-thinking-2025-05-14`

##### Fine-grained Tool Streaming (퍼블릭 베타)
- 버퍼링/JSON 검증 없이 도구 사용 파라미터 스트리밍
- beta 헤더: `fine-grained-tool-streaming-2025-05-14`

#### 4. **Artifacts**
- Claude.ai의 새로운 상호작용 기능
- 생성된 콘텐츠(코드, 문서, 디자인)를 별도 창에 표시
- 실시간 편집 및 빌드 가능

#### 5. **확장된 출력 기능**
- Claude Sonnet 3.7: beta 헤더로 128K 토큰 출력
- Claude Sonnet 3.5: 8,192 토큰 출력 (특별 헤더 사용)

### Claude 가격 정책

| 모델 | 입력 (백만 토큰) | 출력 (백만 토큰) |
|------|-----------------|-----------------|
| Claude Sonnet 4 | $3 | $15 |
| Claude 3.7 Sonnet | $3 | $15 |
| Claude 3.5 Sonnet | $3 | $15 |
| Claude 3.5 Haiku | $0.80 | $4 |

**할인 옵션**:
- 프롬프트 캐싱: 최대 90% 절감
- 배치 처리: 50% 절감

---

## 비교 분석

### 강점 비교

| 기능 | OpenAI GPT-4.1 | Claude 4 |
|------|----------------|-----------|
| 최대 컨텍스트 | 100만 토큰 | 200K 토큰 (3.5 Sonnet) |
| 코딩 성능 | SWE-bench 54.6% | SWE-bench 40.6% (3.5 Haiku) |
| 실시간 기능 | 오디오 지원 | Computer Use |
| 지식 기준일 | 2024년 6월 | 2024년 10월 (3.7) |
| 특수 기능 | DPO, 에이전트 | 사고 과정 표시, Artifacts |

### 용도별 추천

#### 코딩 작업
- **복잡한 코딩**: GPT-4.1 (SWE-bench 최고 성능)
- **에이전틱 코딩**: Claude Code (GitHub 통합, 파일 시스템 접근)

#### 실시간 상호작용
- **음성/오디오**: OpenAI (실시간 오디오 모델)
- **컴퓨터 제어**: Claude (Computer Use)

#### 비용 효율성
- **저비용 고성능**: GPT-4.1 mini, Claude 3.5 Haiku
- **프롬프트 캐싱 필요 시**: Claude (90% 절감)

#### 긴 컨텍스트 처리
- **초대용량**: GPT-4.1 (100만 토큰)
- **일반 대용량**: Claude (200K 토큰)

---

## 개발자를 위한 권장사항

### 1. **모델 선택 가이드**

#### 고성능이 필요한 경우
- **OpenAI**: GPT-4.1 (최고 성능)
- **Claude**: Claude Opus 4, Sonnet 4

#### 비용 최적화가 중요한 경우
- **OpenAI**: GPT-4.1 nano (분류, 자동완성)
- **Claude**: Claude 3.5 Haiku ($0.80/$4)

#### 특수 기능이 필요한 경우
- **브라우저 자동화**: Claude Computer Use
- **음성 처리**: OpenAI 실시간 오디오
- **사고 과정 표시**: Claude 하이브리드 추론

### 2. **개발 팁**

#### API 통합 시
```python
# OpenAI 예시
import openai
client = openai.OpenAI()
response = client.chat.completions.create(
    model="gpt-4.1",
    messages=[{"role": "user", "content": "Hello"}],
    max_tokens=1000000  # 100만 토큰 지원
)

# Claude 예시
import anthropic
client = anthropic.Anthropic()
message = client.messages.create(
    model="claude-sonnet-4",
    max_tokens=4096,
    messages=[{"role": "user", "content": "Hello"}],
    extra_headers={"anthropic-beta": "output-128k-2025-02-19"}  # 128K 출력
)
```

#### 비용 최적화
1. **프롬프트 캐싱 활용** (Claude)
2. **배치 처리** (Claude 50% 절감)
3. **적절한 모델 선택** (nano/mini/haiku)
4. **토큰 사용량 모니터링**

### 3. **마이그레이션 가이드**

#### GPT-4.5 → GPT-4.1
- 2025년 7월 14일까지 마이그레이션 필요
- 동일한 API 구조, 향상된 성능

#### Claude 3.x → Claude 4
- 가격 동일 (Sonnet 시리즈)
- 사고 과정 표시 등 새 기능 활용 가능

### 4. **보안 고려사항**
- API 키 환경 변수 저장
- 민감한 데이터 처리 시 주의
- 프롬프트 인젝션 방지
- 출력 검증 및 필터링

---

## 결론

2025년 현재, OpenAI와 Claude 모두 획기적인 발전을 이루었습니다. OpenAI는 GPT-4.1 시리즈로 성능의 새로운 기준을 제시했고, Claude는 Computer Use와 하이브리드 추론 같은 혁신적인 기능을 도입했습니다. 개발자는 프로젝트의 요구사항에 따라 적절한 모델과 기능을 선택하여 최적의 결과를 얻을 수 있습니다.

---

*문서 작성일: 2025년 8월 2일*
*작성자: Claude Code Assistant*
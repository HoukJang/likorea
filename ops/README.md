# likorea AI 운영팀 (Operations)

AI 에이전트 팀이 콘텐츠 생성, 커뮤니티 관리, 사이트 유지보수를 담당합니다.

## 팀 구조

### 콘텐츠팀 (4명)
| 에이전트 | 역할 | 모델 |
|---------|------|------|
| Content PM | 콘텐츠 검수/조율 | opus |
| Researcher | 정보 수집, 팩트체크 | sonnet |
| Writer | 콘텐츠 작성 | sonnet |
| Publisher | 발행 실행 | sonnet |

### 코딩팀 (4명)
| 에이전트 | 역할 | 모델 |
|---------|------|------|
| Dev PM | 코드 리뷰/조율 | opus |
| Frontend Dev | React/UI 개발 | sonnet |
| Backend Dev | API/DB 개발 | sonnet |
| QA Tester | 테스트/검수 | sonnet |

## 디렉토리 구조

```
ops/
├── data/
│   ├── sources.json        # 뉴스 소스 설정
│   ├── drafts/             # 작업 중인 초안
│   │   ├── research/       # Researcher 산출물
│   │   ├── articles/       # Writer 기사
│   │   ├── sns/            # Writer SNS 포스트
│   │   ├── tests/          # QA 테스트 리포트
│   │   └── reviews/        # 팀장 검수 기록
│   │       ├── content/    # Content PM
│   │       └── dev/        # Dev PM
│   └── published/          # 발행 완료 이력
│
├── scripts/
│   ├── daily-collect.sh    # 일일 뉴스 수집
│   └── weekly-digest.sh    # 주간 요약 생성
│
└── logs/                   # 실행 로그 (자동 생성)
```

## 워크플로우

### 콘텐츠 발행 플로우
```
1. Researcher → 정보 수집 → drafts/research/
2. Content PM → 검수 (통과/수정)
3. Writer → 콘텐츠 작성 → drafts/articles/, drafts/sns/
4. Content PM → 검수 (통과/수정)
5. Publisher → 발행 → published/
```

### 개발 플로우
```
1. Frontend/Backend Dev → 코드 작성
2. Dev PM → 코드 리뷰 (통과/수정)
3. QA Tester → 테스트 → drafts/tests/
4. Dev PM → 테스트 결과 확인
5. Dev PM → 배포 진행
```

## 사용 방법

Claude Code에서 PM 역할을 지정하여 요청:

```
"Dev PM 역할로, 로그인에 Remember Me 기능 추가해줘"
"Content PM 역할로, 롱아일랜드 맛집 기사 작성해줘"
```

## 관련 파일

### 에이전트 정의
- `.claude/agents/content-pm.md`
- `.claude/agents/researcher.md`
- `.claude/agents/writer.md`
- `.claude/agents/publisher.md`
- `.claude/agents/dev-pm.md`
- `.claude/agents/frontend-dev.md`
- `.claude/agents/backend-dev.md`
- `.claude/agents/qa-tester.md`

### 스킬 정의
- `.claude/skills/likorea-style/` - 브랜드 스타일 가이드
- `.claude/skills/news-sources/` - 뉴스 소스 정의
- `.claude/skills/publishing-rules/` - 발행 규칙
- `.claude/skills/code-standards/` - 코딩 표준

## 향후 계획

- [ ] Meta API (Instagram/Threads) 설정
- [ ] 자동 스케줄링 구현
- [ ] 기존 봇 시스템(`isBot`, `isApproved`) 제거

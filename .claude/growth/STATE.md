# Growth State — likorea.com 트래픽 성장 작업 상태

> 목적: 커뮤니티 활성화를 통한 트래픽 증가.
> 이 파일은 세션 간 연속성의 단일 소스(single source of truth)입니다.
> 매 성장 작업 세션은 (1) 이 파일을 먼저 읽고, (2) 작업 후 반드시 갱신합니다.
> 리포 전체를 재분석하지 마세요 — 여기 없는 정보만 코드에서 찾으세요.

## 현재 진단 (2026-07-30 기준)

- 개발 중단: 2026-02-11 (v2.0.4) 이후 약 5.5개월 커밋 없음
- SEO 인프라 완료: 동적 sitemap, robots.txt, JSON-LD, Helmet 메타태그, PWA, GTM(GTM-NQHK4HKH), 자체 prerender 서버(Puppeteer)
- 트래픽 수집: `trafficLogger` 미들웨어 → `TrafficLog` 모델 (30일 TTL, 봇/실사용자 구분 없음)
- 관리자 대시보드: `/admin` 트래픽 메뉴 (1h~30d 기간별 요청수/순사용자/응답시간)
- 공유 기능: Web Share API + 링크 복사만 (카카오톡 SDK 없음)
- Google Search Console: 등록 미확인 (2월 시점 인덱싱 0건)
- 상세 전략: `docs/ACTIVATION_STRATEGY.md` 참조 (Phase 1 완료, Phase 2+ 미착수)

## 지표 베이스라인

| 지표 | 값 | 확인일 | 출처 |
|------|-----|--------|------|
| 월간 방문자 (UV) | 미측정 | - | GA4 / 관리자 대시보드 |
| Google 인덱스 페이지 | 0 (2월 기준) | 2026-02-09 | ACTIVATION_STRATEGY.md |
| 등록 사용자 수 | 미측정 | - | DB users 컬렉션 |
| 월간 새 게시글 | 미측정 | - | DB boardposts 컬렉션 |

<!-- /traffic-report 실행 시 위 표를 갱신할 것 -->

## 백로그 (우선순위순)

### P1 — 측정 기반 확보
- [x] `trafficLogger`에 봇 필터링 추가 — `backend/utils/botDetector.js`, TrafficLog에 `isBot` 필드 (2026-07-30)
- [x] 일별 트래픽 집계 — `backend/models/TrafficDaily.js` + `backend/jobs/trafficAggregator.js` (1시간 주기, 오늘+어제 upsert, NY 타임존) (2026-07-30)
- [x] 대시보드 API에 봇/실사용자 분리 — summary에 botRequests/humanRequests, 신규 `GET /api/traffic/trend` (days≤365) (2026-07-30)
- [ ] 프론트 관리자 대시보드(TrafficDashboard.jsx)에 봇/실사용자 분리 표시 + trend 차트 (`frontend/src/api/traffic.js`에 trend 호출 추가 필요)
- [ ] (운영자) Google Search Console 등록 + sitemap 제출 — 코드 작업 아님, 리마인드만
- [ ] (배포 후) CI/개발 환경에서 신규 테스트 실행 확인: `npm test -- tests/unit/botDetector.test.js tests/integration/trafficAggregator.test.js` (샌드박스는 mongodb-memory-server 바이너리 다운로드 차단으로 실행 불가)

### P2 — 유입 경로: 카카오톡 공유
- [ ] Kakao JavaScript SDK 연동 (게시글 공유 버튼, PostActionBar.jsx)
- [ ] 공유 클릭 이벤트 GTM 트래킹

### P3 — 콘텐츠 채우기
- [ ] 콘텐츠 파이프라인으로 시드 콘텐츠 정기 생산 (맛집 리뷰, 생활정보 — CLAUDE.md 파이프라인 규칙 준수, .docx 출력)
- [ ] 카테고리별 최소 5개 게시글 확보 목표

### P4 — 재방문 유도
- [ ] 주간 다이제스트 이메일 (신규 글 요약)
- [ ] 관심 카테고리 새 글 알림
- [ ] 비즈니스 디렉토리
- [ ] 이벤트 캘린더

## 완료 이력

| 날짜 | 작업 | 브랜치/커밋 |
|------|------|------------|
| 2026-07-30 | 성장 하네스 셋업 (스킬/에이전트/STATE) | claude/webpaybi-traffic-improvement-fzx7uq |
| 2026-07-30 | P1 백엔드: 봇 필터링 + TrafficDaily 일별 집계 + trend API | claude/webpaybi-traffic-improvement-fzx7uq |

## 작업 규칙

1. 성능(결과 품질) 우선, 토큰 효율 준수: 수집/점검은 haiku 에이전트, 구현은 sonnet 에이전트, 리뷰·종합은 메인 모델
2. 한 세션에 한 백로그 항목씩 완결 (구현 → 테스트 → 커밋 → STATE 갱신)
3. 구현 전 해당 파일만 읽기 — 전체 탐색 금지
4. 완료 항목은 체크 후 완료 이력에 이동, 새로 발견한 개선점은 백로그에 추가

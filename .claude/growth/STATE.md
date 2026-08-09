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
- Google Search Console: 도메인 속성 등록·확인 완료. 51페이지 색인, 최근 3개월 검색 클릭 10회 (문제는 색인이 아니라 노출/순위)
- 상세 전략: `docs/ACTIVATION_STRATEGY.md` 참조 (Phase 1 완료, Phase 2+ 미착수)

## 지표 베이스라인

| 지표 | 값 | 확인일 | 출처 |
|------|-----|--------|------|
| 월간 방문자 (UV) | 사실상 0 (30d 순사용자 1명 = 운영자; 일별 0~1) — 단 이 지표는 로그인 사용자만 카운트 | 2026-08-07 | /api/traffic/dashboard, /api/traffic/trend |
| GA4 활성 사용자 | 7d(8/2~8/9) 66명, 일별 0~19 — 게시일마다 스파이크 (8/4 나주곰탕 16, 8/8 개학 19). Threads가 유입의 70% (46명/7d) | 2026-08-09 | scripts/ga4-report.py (서비스 계정 직접 조회) |
| 글별 성과 상위 | U-pick 22 · 개학 18 · STAR 15 · 나주곰탕 13 (GA4 30d 방문) — 시의성+실용 체크리스트형 강세, 일반 가이드형(해수욕장 9) 약세 | 2026-08-09 | ga4-report.py post, topics.xlsx M열 |
| 30d 요청 수 | 4,860 (봇 177 / "인간" 4,683 — 대부분 운영자 브라우저 폴링·자동화) | 2026-08-07 | /api/traffic/dashboard |
| 크롤러 활동 | sitemap.xml 30d 373회 조회 (7d 85회) — 크롤링은 활발 | 2026-08-07 | /api/traffic/dashboard top_paths |
| Google 인덱스 페이지 | 51 색인 / 15 미색인 | 2026-07-30 | GSC Overview (도메인 속성 등록·소유권 확인 완료) |
| 전체 게시글 수 | 44 — 콘텐츠 파이프라인 매일 1편 가동 시작 (2026-08-09부터 주말 포함) | 2026-08-09 | /api/boards |
| 등록 사용자 수 | 46 (Lv3 43 / Lv4 2 / admin 1) | 2026-08-07 | /api/admin/stats |
| 일별 트래픽 집계 | 8/1~8/6 일 136~329 요청, 순사용자 0~1 (7/31 1,589는 배포·파이프라인 자체 트래픽) | 2026-08-07 | TrafficDaily(/api/traffic/trend) |

<!-- /traffic-report 실행 시 위 표를 갱신할 것 -->

## 백로그 (우선순위순)

### P1 — 측정 기반 확보
- [x] `trafficLogger`에 봇 필터링 추가 — `backend/utils/botDetector.js`, TrafficLog에 `isBot` 필드 (2026-07-30)
- [x] 일별 트래픽 집계 — `backend/models/TrafficDaily.js` + `backend/jobs/trafficAggregator.js` (1시간 주기, 오늘+어제 upsert, NY 타임존) (2026-07-30)
- [x] 대시보드 API에 봇/실사용자 분리 — summary에 botRequests/humanRequests, 신규 `GET /api/traffic/trend` (days≤365) (2026-07-30)
- [ ] 프론트 관리자 대시보드(TrafficDashboard.jsx)에 봇/실사용자 분리 표시 + trend 차트 (`frontend/src/api/traffic.js`에 trend 호출 추가 필요)
- [ ] (운영자) SEO 검색엔진 등록 마무리:
  - ~~Google Search Console 등록~~ 완료 확인 (2026-07-30, 도메인 속성) — 남은 것: sitemap 제출 여부 확인, Pages 미색인 15건 원인 확인, Performance 쿼리 분석
  - 네이버 서치어드바이저 (searchadvisor.naver.com): 등록 + sitemap 제출 (한국어 검색 유입)
  - Bing 웹마스터: Search Console 가져오기로 등록
- [ ] (운영자·배포 시) 프리렌더 가동 확인: `curl -A "Googlebot" https://likorea.com/ | grep -c 게시판` (0이면 미작동), `curl https://likorea.com/sitemap.xml` 응답 확인
- [ ] (배포 후) CI/개발 환경에서 신규 테스트 실행 확인: `npm test -- tests/unit/botDetector.test.js tests/integration/trafficAggregator.test.js` (샌드박스는 mongodb-memory-server 바이너리 다운로드 차단으로 실행 불가)

### P2 — 유입 경로: 카카오톡 공유
- [ ] Kakao JavaScript SDK 연동 (게시글 공유 버튼, PostActionBar.jsx)
- [ ] 공유 클릭 이벤트 GTM 트래킹

### P3 — 콘텐츠 채우기
- [ ] 콘텐츠 파이프라인으로 시드 콘텐츠 정기 생산 (맛집 리뷰, 생활정보 — CLAUDE.md 파이프라인 규칙 준수, .docx 출력)
- [ ] 카테고리별 최소 5개 게시글 확보 목표

### P3.5 — 유입 채널 시딩 (2026-07-30 추가; GSC상 51페이지 색인·3개월 클릭 10회 — 노출/순위가 병목)
- [ ] 한인 커뮤니티 소개 포스팅: 미시USA, 헤이코리안, 롱아일랜드 한인 페이스북 그룹, 네이버 미국 이민 카페
- [ ] 백링크 확보: 롱아일랜드 한인 교회·한글학교·업소록 사이트에 링크 요청
- [ ] (운영자 계정 필요) Kakao Developers 앱 등록 → JavaScript 키 발급 (P2 선행 조건)

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

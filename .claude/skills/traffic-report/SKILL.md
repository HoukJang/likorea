---
name: traffic-report
description: likorea.com 트래픽 현황 리포트 생성. "트래픽 확인", "방문자 얼마나", "지표 리포트" 등의 요청 시 사용. 트래픽 데이터를 수집·집계해 STATE.md 베이스라인을 갱신하고 요약 리포트를 출력한다.
---

# 트래픽 리포트

## 데이터 소스 (가능한 것부터 시도)

1. **GA4 Data API** (외부 방문자의 단일 소스): `python3 scripts/ga4-report.py summary|sources|pages|post <id> [days]`
   - 인증: `.content-workspace/.ga4-sa.json` 서비스 계정 (속성 500298765) — 별도 로그인 불필요
   - 주의: GTM이 page_view 대신 커스텀 이벤트 "likorea"를 쏘므로 pageview 지표는 eventCount로 대체돼 있음
2. **프로덕션 API** (서버 측 지표 — 봇/응답시간/로그인 사용자): 관리자 로그인 후 `GET /api/traffic/dashboard?period=7d` 및 `period=30d`.
   - 로그인: `POST /api/users/login` — 자격증명은 `.content-workspace/.social.env`
   - "순 사용자"는 로그인 사용자만 카운트 — 외부 방문자 수는 반드시 GA4(1번) 기준으로 보고
3. **로컬 DB** (MONGO_URI 접근 가능 시): `traffic-analyst` 에이전트에 위임해 TrafficLog/User/BoardPost 컬렉션 집계
4. **모두 불가 시**: 사용자에게 관리자 대시보드(`/admin`)와 GA4 확인을 안내하고, 수치 입력을 요청

## 수집 항목

- 기간별(7d/30d) 총 요청 수, 순 사용자 수, 평균 응답시간
- 봇 추정 비율 (userAgent에 bot/crawler/spider 포함 요청 비율)
- 인기 경로 상위 5개
- 등록 사용자 수, 최근 30일 신규 게시글/댓글 수
- **글별 성과**: 주제 대장(`contents/topics.xlsx`)에서 `상태=게시완료`인 행의 게시URL로 post id를 뽑아 ① `ga4-report.py post <id>` (방문자·유입소스별) ② `GET /api/boards/{id}`의 viewCount 수집
- **유입소스 분해**: `ga4-report.py sources` — Threads/Facebook/Instagram/organic 비중

## 출력

1. 위 항목을 표 하나로 압축한 요약 리포트 (10줄 이내 해설 포함)
2. `.claude/growth/STATE.md`의 "지표 베이스라인" 표 갱신 (값, 확인일, 출처)
3. 직전 베이스라인과 비교해 유의미한 변화가 있으면 한 줄 코멘트
4. **성과 피드백 루프**: topics.xlsx 각 게시완료 행의 `성과(M열)`를 `GA4방문 N · Threads유입 K · 조회 V (YYYY-MM-DD)` 형식으로 갱신 (기존 기록 뒤에 append — 추이를 남긴다). 방문자 상위 글의 공통 패턴(카테고리·앵글)이 보이면 리포트에 한 줄로 명시 — topic-scout가 이 열을 참고해 발굴함

## 토큰 규칙

- 원시 로그를 컨텍스트로 가져오지 말 것 — 집계 쿼리 결과만
- 수집은 `traffic-analyst`(haiku) 에이전트에 위임, 해석·리포트 작성만 메인 모델이 수행

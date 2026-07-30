---
name: seo-audit
description: likorea.com SEO 상태 점검. "SEO 확인", "인덱싱 상태", "검색 노출 점검" 등의 요청 시 사용. 코드베이스의 SEO 인프라 무결성을 점검하고 회귀를 잡아낸다.
---

# SEO 점검

## 점검 항목 (전부 `seo-auditor` haiku 에이전트에 위임)

로컬 코드 점검 (네트워크 불필요):
- `backend/controllers/sitemapController.js` — 승인 게시글 포함 로직, 캐시 TTL 정상 여부
- `frontend/public/robots.txt` — sitemap 위치, admin/private 차단 유지 여부
- `frontend/public/index.html` — OG 태그, canonical, GTM 스니펫 존재
- `frontend/src/components/BoardPostView.jsx`, `BoardList.jsx`, `pages/Landing.jsx` — Helmet 메타태그 + JSON-LD 유지 여부
- `backend/prerender/` — 서버/캐시/워밍업 스크립트 존재, package.json에 puppeteer 의존성

라이브 점검 (네트워크 허용 시에만):
- `https://likorea.com/sitemap.xml` 응답 및 URL 수
- 홈/게시글 1개의 프리렌더 응답 (crawler User-Agent로 요청 시 콘텐츠 포함 HTML 반환 여부)

## 출력

- 항목별 정상/이상 표 + 이상 항목만 상세 설명
- 이상 발견 시 `.claude/growth/STATE.md` 백로그에 수정 항목 추가 (자동 수정하지 말 것 — 리포트가 산출물)
- 운영자 액션(Search Console 등록 등)은 별도 섹션으로 구분

## 토큰 규칙

- 파일 전체 읽기 대신 관련 심볼 grep 후 해당 구간만 확인
- 정상 항목은 결과 표 한 줄로만 보고

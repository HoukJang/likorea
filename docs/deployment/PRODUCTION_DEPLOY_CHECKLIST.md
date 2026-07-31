# 프로덕션 배포 체크리스트

> 작성일: 2026-07-30 | 대상 릴리스: PR #2 (growth harness + 봇 필터링/일별 트래픽 집계) 및 이후 배포 공통
>
> 배포는 **프로덕션 서버 안에서** 실행합니다. 리포의 배포 스크립트(`deploy.sh` 등)는 서버 로컬에서 PM2/Nginx를 직접 제어하는 구조이며, 원격 배포용이 아닙니다.

---

## 1. 배포 전 확인

- [ ] PR이 main에 머지되었는지 확인 (또는 배포할 브랜치 결정)
- [ ] GitHub Actions CI 통과 확인 — https://github.com/HoukJang/likorea/actions
  - 참고: 2026-07-30에 CI 워크플로우 수정됨 (폐기된 actions v3 → v4, `npm ci` → `npm install`). 그 이전에는 CI가 시작조차 못 하고 자동 실패했음
- [ ] 서버의 `backend/.env`에 필수 환경변수 존재 확인: `MONGO_URI`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `NODE_ENV=production`, `PORT=5001`

## 2. 배포 실행 (서버에서)

```bash
ssh <서버>            # 접속 정보는 리포에 없음 — 운영자 보관
cd <리포 경로>
git pull origin main
./deploy.sh production            # 대화형. 테스트 실패 무시하려면 --force
# Nginx 설정도 갱신해야 하면:
./deploy.sh production --update-nginx
```

`deploy.sh production`이 수행하는 것: git 상태 확인 → 의존성 설치 → 환경변수 검증 → ESLint → 테스트 → 프론트 빌드 → PM2 재시작(`likorea-backend`, `likorea-prerender`) → (옵션) Nginx 설정/SSL.

## 3. 배포 후 검증

### 3-1. 서비스 기동
```bash
pm2 list                          # likorea-backend, likorea-prerender 둘 다 online
pm2 logs likorea-backend --lines 30   # "트래픽 일별 집계 스케줄러 시작 (1시간 주기)" 로그 확인
```

### 3-2. 프리렌더 (SEO 핵심 — 반드시 확인)
```bash
# 크롤러 UA로 요청 시 콘텐츠가 채워진 HTML이 와야 함. 0이면 프리렌더 미작동
curl -s -A "Googlebot" https://likorea.com/ | grep -c "게시판"
curl -s https://likorea.com/sitemap.xml | head    # sitemap 응답 확인
```

### 3-3. 신규 트래픽 집계 기능 (이번 릴리스)
```bash
# 관리자 로그인 후 (브라우저 또는 curl로 토큰 획득):
# - /admin 트래픽 대시보드에서 botRequests/humanRequests 표시 확인
# - GET /api/traffic/trend  →  { success: true, data: { days, trend: [...] } }
# 배포 1시간 뒤 MongoDB에 trafficdailies 컬렉션이 생기고 오늘 날짜 문서가 있으면 정상
```

## 4. 배포 후 운영자 액션 (SEO — 최초 1회)

프리렌더 정상 확인 후 진행 (상세: `.claude/growth/STATE.md` 백로그):

- [ ] **Google Search Console** (search.google.com/search-console): `likorea.com` 도메인 속성 추가 → DNS TXT로 소유권 확인 → `https://likorea.com/sitemap.xml` 제출 → 홈·주요 게시글 색인 요청
- [ ] **네이버 서치어드바이저** (searchadvisor.naver.com): 사이트 등록 + sitemap 제출
- [ ] **Bing 웹마스터**: Google Search Console 가져오기로 등록

## 5. 자동 배포 (main 머지 → 자동 배포, 설정 완료)

main 머지 시 자동 배포가 구성되어 있습니다. GitHub Secrets 불필요 (pull 방식):

1. **CI release 잡** (`ci-cd.yml`): main 푸시 → 테스트 통과 → 버전 patch bump → `chore: release vX.Y.Z` 커밋 + git 태그 푸시
   - 커밋 메시지에 `[minor]` / `[major]` 포함 시 해당 레벨로 bump
   - 테스트 실패 시 release 커밋/태그가 생성되지 않음 → 배포 차단
2. **서버 폴러** (`likorea-deploy.timer`, 2분 주기): origin/main HEAD에 `v*` 태그가 있으면
   해당 커밋으로 `reset --hard` 후 `./deploy.sh production --auto --skip-tests --skip-lint --skip-git-check` 실행
   - 스크립트: `/root/likorea/scripts/auto-deploy.sh` (리포의 `scripts/auto-deploy.sh`)
   - systemd 유닛: 리포 `scripts/systemd/` → 서버 `/etc/systemd/system/`

### 운영 명령어 (서버에서)
```bash
systemctl status likorea-deploy.timer          # 타이머 상태
journalctl -u likorea-deploy.service -n 50     # 배포 로그
systemctl stop likorea-deploy.timer            # 자동 배포 일시 중지
sudo systemctl start likorea-deploy.service    # 즉시 1회 폴링/배포
```

### 버전 관리 원칙
- 버전 bump와 git 태그는 **CI만** 수행. 서버는 version.json을 읽기만 한다 (`deploy.sh`에서 자동 bump 제거됨).
- 수동 배포 시에도 서버에서 버전을 올리지 말 것 — git과 서버 버전이 어긋나는 원인.

## 트러블슈팅

| 증상 | 확인 |
|------|------|
| 프리렌더 grep 결과 0 | `pm2 logs likorea-prerender`, Nginx에 `nginx-likorea-simple.conf`의 bot map/프록시 적용 여부 (`./apply-nginx-config.sh`) |
| trafficdailies 컬렉션 없음 | 백엔드 로그에서 "트래픽 일별 집계" 에러 검색, MONGO_URI 권한 확인 |
| PM2 재시작 후 502 | `pm2 logs likorea-backend` 기동 에러, `.env` 누락 여부 |

#!/bin/bash
# likorea 자동 배포 폴러 — systemd 타이머(likorea-deploy.timer)가 주기 실행.
#
# 동작: origin/main을 fetch해서 CI가 태그(vX.Y.Z)를 붙인 release 커밋이 오면
# 해당 커밋으로 reset 후 deploy.sh를 실행한다.
# 태그 없는 커밋(= CI 테스트 실패로 release 잡이 안 돈 경우)은 배포하지 않는다.
#
# 수동 실행: /root/likorea/scripts/auto-deploy.sh
# 로그 확인: journalctl -u likorea-deploy.service -n 50

set -euo pipefail

REPO_DIR="${REPO_DIR:-/root/likorea}"
LOG_TAG="likorea-auto-deploy"

# 중복 실행 방지 (배포가 타이머 주기보다 오래 걸리는 경우)
exec 9>/tmp/likorea-auto-deploy.lock
flock -n 9 || exit 0

cd "$REPO_DIR"
# --force: 과거 서버에서 로컬 생성된 태그가 원격 태그와 충돌하는 것을 방지
git fetch origin main --tags --force --quiet

TARGET=$(git rev-parse origin/main)
CURRENT=$(git rev-parse HEAD)

if [ "$TARGET" = "$CURRENT" ]; then
    exit 0
fi

if ! VERSION=$(git describe --exact-match --match 'v*' "$TARGET" 2>/dev/null); then
    echo "[$LOG_TAG] origin/main(${TARGET:0:8})에 release 태그 없음 — 배포 대기"
    exit 0
fi

echo "[$LOG_TAG] $VERSION (${TARGET:0:8}) 배포 시작"

git checkout main --quiet 2>/dev/null || true
git reset --hard "$TARGET" --quiet

./deploy.sh production --auto --skip-tests --skip-lint --skip-git-check

echo "[$LOG_TAG] $VERSION 배포 완료"

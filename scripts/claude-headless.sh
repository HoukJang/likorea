#!/bin/bash
# LaunchAgent용 Claude 헤드리스 실행 래퍼.
# 인증은 macOS 키체인의 대화형 세션 자격증명 공유 (refresh token 자동 갱신; launchd 접근 가능 검증 2026-08-12) —
# 정적 CLAUDE_CODE_OAUTH_TOKEN은 갱신이 안 돼 폐기 시 파이프라인이 통째로 죽는다 (2026-08-11 장애).
# 로그아웃/전체 세션 폐기 시엔 이것도 죽는다 — 그 경우 아래 실패 알림이 뜨고, claude 재로그인 1회로 복구.
# BG_WAIT_CEILING=0: print 모드가 백그라운드 에이전트 완료까지 무기한 대기 (파이프라인 중단 방지).
set -a
source /Users/houkjang/likorea/.content-workspace/.social.env
set +a
unset CLAUDE_CODE_OAUTH_TOKEN
export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0
/Users/houkjang/.local/bin/claude "$@"
status=$?
if [ $status -ne 0 ]; then
  /usr/bin/osascript -e 'display notification "헤드리스 Claude 실행 실패 (exit '"$status"') — cron-logs 확인" with title "likorea 파이프라인 오류" sound name "Basso"' 2>/dev/null
fi
exit $status

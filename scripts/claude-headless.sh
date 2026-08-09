#!/bin/bash
# LaunchAgent용 Claude 헤드리스 실행 래퍼.
# .social.env의 CLAUDE_CODE_OAUTH_TOKEN으로 인증 (무인 실행은 키체인 접근 불가).
# BG_WAIT_CEILING=0: print 모드가 백그라운드 에이전트 완료까지 무기한 대기 (파이프라인 중단 방지).
set -a
source /Users/houkjang/likorea/.content-workspace/.social.env
set +a
export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0
exec /Users/houkjang/.local/bin/claude "$@"

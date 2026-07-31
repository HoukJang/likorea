#!/bin/bash
# LaunchAgent용 Claude 헤드리스 실행 래퍼.
# .social.env의 CLAUDE_CODE_OAUTH_TOKEN으로 인증 (무인 실행은 키체인 접근 불가).
set -a
source /Users/houkjang/likorea/.content-workspace/.social.env
set +a
exec /Users/houkjang/.local/bin/claude "$@"

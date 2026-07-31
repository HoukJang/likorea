#!/bin/bash
# Threads 장기 토큰(60일) 주기 갱신 — crontab에서 주 1회 실행.
# 토큰은 발급 24시간 후부터 갱신 가능, 갱신 시 60일 연장.

set -euo pipefail

ENV_FILE="/Users/houkjang/likorea/.content-workspace/.social.env"
[ -f "$ENV_FILE" ] || { echo "no env file"; exit 0; }

source "$ENV_FILE"
[ -n "${THREADS_ACCESS_TOKEN:-}" ] || { echo "no token"; exit 0; }

RESP=$(curl -s "https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${THREADS_ACCESS_TOKEN}")
NEW=$(echo "$RESP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('access_token',''))")

if [ -n "$NEW" ]; then
    umask 077
    python3 - "$ENV_FILE" "$NEW" <<'EOF'
import sys, re
path, new = sys.argv[1], sys.argv[2]
lines = open(path).read().splitlines()
out = []
for l in lines:
    if l.startswith('THREADS_ACCESS_TOKEN='):
        out.append(f'THREADS_ACCESS_TOKEN={new}')
    else:
        out.append(l)
open(path, 'w').write('\n'.join(out) + '\n')
EOF
    echo "$(date '+%F %T') token refreshed"
else
    echo "$(date '+%F %T') refresh failed: $RESP"
fi

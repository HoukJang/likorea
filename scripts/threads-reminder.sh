#!/bin/bash
# 19:30 daily: notify if today's Threads candidates are still unpublished.
ws=$(ls -dt /Users/houkjang/likorea/.content-workspace/$(date +%Y%m%d)-* 2>/dev/null | head -1)
[ -z "$ws" ] && exit 0
up=$(python3 -c "import json;print(json.load(open('$ws/social.json')).get('threads',{}).get('uploaded'))" 2>/dev/null)
if [ "$up" != "True" ]; then
  osascript -e 'display notification "오늘 Threads 후보가 아직 게시 안 됨 — Claude에서 후보 골라서 올리기 (피크 21시 전)" with title "likorea Threads 리마인더" sound name "Glass"'
fi

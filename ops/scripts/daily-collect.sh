#!/bin/bash
# daily-collect.sh
# 일일 뉴스 수집 스크립트
#
# 사용법: ./daily-collect.sh
#
# 이 스크립트는 Content PM 에이전트를 통해 일일 뉴스 수집을 시작합니다.
# 실제 수집은 Researcher 에이전트가 수행하고, Content PM이 검수합니다.

set -e

# 환경 변수
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
DATE=$(date +%Y-%m-%d)
LOG_FILE="$PROJECT_ROOT/ops/logs/collect-$DATE.log"

# 로그 디렉토리 생성
mkdir -p "$PROJECT_ROOT/ops/logs"

echo "=== Daily News Collection ===" | tee -a "$LOG_FILE"
echo "Date: $DATE" | tee -a "$LOG_FILE"
echo "Time: $(date +%H:%M:%S)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Claude Code 에이전트 호출
# 참고: 이 스크립트는 Claude Code CLI에서 Content PM 에이전트를 호출합니다.
# 실제 실행은 Claude Code 환경에서 수행되어야 합니다.

echo "Starting news collection via Content PM agent..." | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 결과 디렉토리 확인
RESEARCH_DIR="$PROJECT_ROOT/ops/data/drafts/research"
if [ ! -d "$RESEARCH_DIR" ]; then
    mkdir -p "$RESEARCH_DIR"
fi

echo "Research output will be saved to: $RESEARCH_DIR" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# TODO: Claude Code scheduler 또는 cron 연동 시 아래 부분 활성화
# claude-code --agent content-pm --task "오늘 뉴스 수집해줘"

echo "=== Collection Started ===" | tee -a "$LOG_FILE"
echo "Check $RESEARCH_DIR for results" | tee -a "$LOG_FILE"

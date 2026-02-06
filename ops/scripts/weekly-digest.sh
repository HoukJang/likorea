#!/bin/bash
# weekly-digest.sh
# 주간 요약 생성 스크립트
#
# 사용법: ./weekly-digest.sh
#
# 이 스크립트는 한 주간 수집된 뉴스를 요약하여 주간 다이제스트를 생성합니다.
# Content PM 에이전트가 Writer에게 주간 요약 작성을 지시합니다.

set -e

# 환경 변수
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
DATE=$(date +%Y-%m-%d)
WEEK_START=$(date -d "last monday" +%Y-%m-%d 2>/dev/null || date -v-monday +%Y-%m-%d)
LOG_FILE="$PROJECT_ROOT/ops/logs/weekly-$DATE.log"

# 로그 디렉토리 생성
mkdir -p "$PROJECT_ROOT/ops/logs"

echo "=== Weekly Digest Generation ===" | tee -a "$LOG_FILE"
echo "Date: $DATE" | tee -a "$LOG_FILE"
echo "Week Start: $WEEK_START" | tee -a "$LOG_FILE"
echo "Time: $(date +%H:%M:%S)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 이번 주 수집된 리서치 파일 확인
RESEARCH_DIR="$PROJECT_ROOT/ops/data/drafts/research"
WEEK_FILES=$(find "$RESEARCH_DIR" -name "*.json" -newermt "$WEEK_START" 2>/dev/null | wc -l)

echo "Research files this week: $WEEK_FILES" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

if [ "$WEEK_FILES" -eq 0 ]; then
    echo "No research files found for this week." | tee -a "$LOG_FILE"
    exit 0
fi

# Claude Code 에이전트 호출
echo "Starting weekly digest generation via Content PM agent..." | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 결과 디렉토리 확인
ARTICLES_DIR="$PROJECT_ROOT/ops/data/drafts/articles"
if [ ! -d "$ARTICLES_DIR" ]; then
    mkdir -p "$ARTICLES_DIR"
fi

echo "Weekly digest will be saved to: $ARTICLES_DIR" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# TODO: Claude Code scheduler 또는 cron 연동 시 아래 부분 활성화
# claude-code --agent content-pm --task "이번 주 뉴스로 주간 요약 작성해줘"

echo "=== Digest Generation Started ===" | tee -a "$LOG_FILE"
echo "Check $ARTICLES_DIR for results" | tee -a "$LOG_FILE"

#!/bin/bash

# ============================================================
# NGINX 설정 간단 적용 스크립트
# 사용법: ./apply-nginx-config.sh
# ============================================================

echo "🚀 NGINX 캐시 설정 적용 시작..."

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 설정 파일 경로
CONFIG_FILE="/root/likorea/nginx-likorea-simple.conf"
TARGET_DIR="/etc/nginx/sites-available"
TARGET_FILE="$TARGET_DIR/likorea"
ENABLED_DIR="/etc/nginx/sites-enabled"
ENABLED_FILE="$ENABLED_DIR/likorea"

# 1. 설정 파일 존재 확인
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ 설정 파일이 없습니다: $CONFIG_FILE${NC}"
    exit 1
fi

# 2. 기존 설정 백업
echo "📦 기존 설정 백업 중..."
if [ -f "$TARGET_FILE" ]; then
    sudo cp "$TARGET_FILE" "$TARGET_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ 백업 완료${NC}"
fi

# 3. 새 설정 복사
echo "📝 새 설정 적용 중..."
sudo cp "$CONFIG_FILE" "$TARGET_FILE"

# 4. sites-enabled 처리 (심볼릭 링크 제거하고 직접 복사)
echo "🔗 sites-enabled 설정 중..."
if [ -L "$ENABLED_FILE" ]; then
    # 심볼릭 링크면 제거
    sudo rm "$ENABLED_FILE"
    echo -e "${YELLOW}  심볼릭 링크 제거됨${NC}"
fi
# 직접 파일 복사
sudo cp "$TARGET_FILE" "$ENABLED_FILE"
echo -e "${GREEN}✅ sites-enabled 설정 완료${NC}"

# 5. nginx 설정 테스트
echo "🧪 NGINX 설정 테스트 중..."
if sudo nginx -t; then
    echo -e "${GREEN}✅ 설정 테스트 성공${NC}"
    
    # 6. nginx 리로드
    echo "🔄 NGINX 재시작 중..."
    sudo systemctl reload nginx
    echo -e "${GREEN}✅ NGINX 재시작 완료${NC}"
    
    # 7. 캐시 설정 확인
    echo ""
    echo "========== 캐시 설정 확인 =========="
    echo -e "${YELLOW}테스트 명령어:${NC}"
    echo "wget --spider --server-response https://likorea.com/static/js/*.chunk.js 2>&1 | grep Cache-Control"
    echo ""
    echo -e "${GREEN}기대 결과:${NC}"
    echo "- 해시가 있는 파일: Cache-Control: public, max-age=31536000, immutable"
    echo "- 일반 JS/CSS: Cache-Control: public, max-age=604800"
    echo "- HTML: Cache-Control: no-cache, no-store, must-revalidate"
    echo ""
    echo -e "${GREEN}🎉 모든 설정이 성공적으로 적용되었습니다!${NC}"
else
    echo -e "${RED}❌ 설정 테스트 실패!${NC}"
    echo "🔄 이전 설정으로 롤백 중..."
    
    # 가장 최근 백업 파일 찾기
    LATEST_BACKUP=$(ls -t "$TARGET_FILE.backup."* 2>/dev/null | head -1)
    if [ -f "$LATEST_BACKUP" ]; then
        sudo cp "$LATEST_BACKUP" "$TARGET_FILE"
        sudo cp "$LATEST_BACKUP" "$ENABLED_FILE"
        sudo nginx -t && sudo systemctl reload nginx
        echo -e "${YELLOW}⚠️  이전 설정으로 롤백되었습니다${NC}"
    fi
    exit 1
fi

echo ""
echo "========================================="
echo -e "${GREEN}📌 다음에 이 설정을 다시 적용하려면:${NC}"
echo "   ./apply-nginx-config.sh"
echo "========================================="
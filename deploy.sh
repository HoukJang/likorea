#!/bin/bash

# 🚀 Likorea 배포 스크립트
# 사용법: ./deploy.sh [environment]
# 예시: ./deploy.sh production

set -e

ENVIRONMENT=${1:-development}
echo "🚀 배포 환경: $ENVIRONMENT"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 환경 확인
if [ "$ENVIRONMENT" != "development" ] && [ "$ENVIRONMENT" != "production" ]; then
    log_error "지원하지 않는 환경입니다: $ENVIRONMENT"
    log_error "사용법: ./deploy.sh [development|production]"
    exit 1
fi

log_info "배포를 시작합니다..."

# 1. Git 상태 확인
log_info "Git 상태 확인 중..."
if [ -n "$(git status --porcelain)" ]; then
    log_warn "커밋되지 않은 변경사항이 있습니다."
    read -p "계속하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "배포가 취소되었습니다."
        exit 1
    fi
fi

# 2. 의존성 설치
log_info "의존성 설치 중..."

# 백엔드 의존성 설치
log_info "백엔드 의존성 설치..."
cd backend
npm install
cd ..

# 프론트엔드 의존성 설치
log_info "프론트엔드 의존성 설치..."
cd frontend
npm install
cd ..

# 3. 환경변수 확인
log_info "환경변수 확인 중..."
if [ "$ENVIRONMENT" = "production" ]; then
    if [ ! -f "backend/.env" ]; then
        log_error "백엔드 .env 파일이 없습니다."
        exit 1
    fi
    
    if [ ! -f "frontend/.env" ]; then
        log_error "프론트엔드 .env 파일이 없습니다."
        exit 1
    fi
fi

# 4. 테스트 실행
log_info "테스트 실행 중..."
cd backend
npm test || log_warn "백엔드 테스트 실패 (무시됨)"
cd ../frontend
npm test || log_warn "프론트엔드 테스트 실패 (무시됨)"
cd ..

# 5. 빌드
log_info "빌드 중..."

# 프론트엔드 빌드
log_info "프론트엔드 빌드..."
cd frontend
npm run build
cd ..

# 6. 배포
if [ "$ENVIRONMENT" = "production" ]; then
    log_info "프로덕션 배포 중..."
    
    # PM2로 백엔드 시작
    log_info "백엔드 서버 시작..."
    cd backend
    pm2 start server.js --name "likorea-backend" --env production || pm2 restart likorea-backend
    cd ..
    
    # Nginx 설정 (필요시)
    log_info "Nginx 설정 확인..."
    if command -v nginx &> /dev/null; then
        log_info "Nginx가 설치되어 있습니다."
    else
        log_warn "Nginx가 설치되어 있지 않습니다."
    fi
    
else
    log_info "개발 환경 배포 중..."
    
    # 개발 서버 시작
    log_info "개발 서버 시작..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ../frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    log_info "개발 서버가 시작되었습니다."
    log_info "백엔드 PID: $BACKEND_PID"
    log_info "프론트엔드 PID: $FRONTEND_PID"
    log_info "종료하려면 Ctrl+C를 누르세요."
    
    # 프로세스 종료 대기
    wait
fi

log_info "배포가 완료되었습니다! 🎉" 
#!/bin/bash

# 🚀 Likorea 배포 스크립트
# 사용법: ./deploy.sh [environment] [--force]
# 예시: ./deploy.sh production
# 예시: ./deploy.sh production --force (테스트 실패 시에도 배포)

set -e

ENVIRONMENT=${1:-development}
echo "🚀 배포 환경: $ENVIRONMENT"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 환경 확인
if [ "$ENVIRONMENT" != "development" ] && [ "$ENVIRONMENT" != "production" ]; then
    log_error "지원하지 않는 환경입니다: $ENVIRONMENT"
    log_error "사용법: ./deploy.sh [development|production] [--force]"
    exit 1
fi

# Force 옵션 확인
FORCE_DEPLOY=false
if [ "$2" = "--force" ]; then
    FORCE_DEPLOY=true
    log_warn "Force 모드로 배포합니다. 테스트 실패 시에도 배포가 계속됩니다."
fi

log_info "배포를 시작합니다..."

# 1. Git 상태 확인
log_step "1. Git 상태 확인"
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
log_step "2. 의존성 설치"

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
log_step "3. 환경변수 확인"
if [ "$ENVIRONMENT" = "production" ]; then
    if [ ! -f "backend/.env" ]; then
        log_error "백엔드 .env 파일이 없습니다."
        log_info "백엔드 .env 파일을 생성해주세요."
        exit 1
    fi
    
    if [ ! -f "frontend/.env" ]; then
        log_error "프론트엔드 .env 파일이 없습니다."
        log_info "프론트엔드 .env 파일을 생성해주세요."
        exit 1
    fi
fi

# 4. 테스트 실행
log_step "4. 테스트 실행"

# 백엔드 테스트 (원격 MongoDB Atlas 사용)
log_info "백엔드 테스트 실행 (원격 MongoDB Atlas 연결)..."
cd backend
npm test || {
    log_warn "백엔드 테스트 실패"
    if [ "$FORCE_DEPLOY" = true ]; then
        log_warn "Force 모드로 인해 테스트 실패를 무시하고 배포를 계속합니다."
    else
        log_warn "테스트 실패로 인한 배포 중단을 원하지 않으면 --force 옵션을 사용하세요"
        log_error "배포가 중단되었습니다. 테스트를 수정하거나 --force 옵션을 사용하세요."
        exit 1
    fi
}
cd ..

# 프론트엔드 테스트
cd frontend
npm test -- --watchAll=false --passWithNoTests || {
    log_warn "프론트엔드 테스트 실패"
    if [ "$FORCE_DEPLOY" = true ]; then
        log_warn "Force 모드로 인해 테스트 실패를 무시하고 배포를 계속합니다."
    else
        log_warn "테스트 실패로 인한 배포 중단을 원하지 않으면 --force 옵션을 사용하세요"
        log_error "배포가 중단되었습니다. 테스트를 수정하거나 --force 옵션을 사용하세요."
        exit 1
    fi
}
cd ..

# 5. 프론트엔드 빌드
log_step "5. 프론트엔드 빌드"
log_info "프론트엔드 빌드 중..."
cd frontend
npm run build

# 빌드 파일 권한 설정
log_info "빌드 파일 권한 설정..."
chown -R www-data:www-data build/
cd ..

# 6. 백엔드 서버 시작
log_step "6. 백엔드 서버 시작"
cd backend
if pm2 list | grep -q "likorea-backend"; then
    log_info "기존 백엔드 서버 재시작..."
    pm2 restart likorea-backend --update-env
else
    log_info "새 백엔드 서버 시작..."
    pm2 start server.js --name "likorea-backend" --env production
fi
cd ..

# 7. Nginx 설정 확인
log_step "7. Nginx 설정 확인"
if command -v nginx &> /dev/null; then
    log_info "Nginx 설정 테스트..."
    nginx -t
    
    log_info "Nginx 재시작..."
    systemctl reload nginx
else
    log_warn "Nginx가 설치되어 있지 않습니다."
fi

# 8. SSL 인증서 설정 (프로덕션)
if [ "$ENVIRONMENT" = "production" ]; then
    log_step "8. SSL 인증서 설정"
    if command -v certbot &> /dev/null; then
        log_info "SSL 인증서 확인 중..."
        certbot certificates | grep -q "likorea.com" || {
            log_info "SSL 인증서 발급 중..."
            certbot --nginx -d likorea.com -d www.likorea.com --non-interactive
        }
    else
        log_warn "Certbot이 설치되어 있지 않습니다."
    fi
fi

# 9. 서비스 상태 확인
log_step "9. 서비스 상태 확인"
log_info "PM2 프로세스 상태:"
pm2 list

log_info "Nginx 상태:"
systemctl status nginx --no-pager -l

# 10. 배포 완료
log_info "🎉 배포가 완료되었습니다!"
log_info "🌐 웹사이트: https://likorea.com"
log_info "📊 PM2 모니터링: pm2 monit"
log_info "📝 로그 확인: pm2 logs likorea-backend" 
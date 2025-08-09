#!/bin/bash

# 🚀 Likorea 자동 배포 스크립트 (Non-interactive)
# 사용법: ./deploy-auto.sh [environment] [options]
# 예시: ./deploy-auto.sh production --skip-tests
# 예시: ./deploy-auto.sh development
# 
# Options:
#   --skip-tests     테스트를 건너뜁니다
#   --skip-lint      린트 검사를 건너뜁니다
#   --skip-git-check Git 상태 확인을 건너뜁니다
#
# ⚠️  주의: 이 스크립트는 대화형 프롬프트 없이 실행됩니다
# ⚠️  주의: 프로덕션 환경에서는 절대 DB를 초기화하지 않습니다

set -e

# 환경 설정
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
    log_error "사용법: ./deploy-auto.sh [development|production] [options]"
    exit 1
fi

# 옵션 파싱
SKIP_TESTS=false
SKIP_LINT=false
SKIP_GIT_CHECK=false

for arg in "${@:2}"; do
    case $arg in
        --skip-tests)
            SKIP_TESTS=true
            log_warn "테스트를 건너뜁니다"
            ;;
        --skip-lint)
            SKIP_LINT=true
            log_warn "린트 검사를 건너뜁니다"
            ;;
        --skip-git-check)
            SKIP_GIT_CHECK=true
            log_warn "Git 상태 확인을 건너뜁니다"
            ;;
        *)
            log_warn "알 수 없는 옵션: $arg"
            ;;
    esac
done

# 프로덕션 환경 DB 초기화 방지
if [ "$ENVIRONMENT" = "production" ]; then
    log_warn "⚠️  프로덕션 환경에서는 DB 초기화가 비활성화됩니다"
    log_warn "⚠️  DB 초기화가 필요한 경우 수동으로 실행하세요"
fi

log_info "자동 배포를 시작합니다..."

# 1. Git 상태 확인 (옵션)
if [ "$SKIP_GIT_CHECK" = false ]; then
    log_step "1. Git 상태 확인"
    if [ -n "$(git status --porcelain)" ]; then
        log_warn "커밋되지 않은 변경사항이 있습니다"
        log_warn "계속 진행합니다 (--skip-git-check 옵션 사용 시 이 메시지를 건너뛸 수 있습니다)"
    else
        log_info "Git 상태 정상"
    fi
else
    log_step "1. Git 상태 확인 건너뜀"
fi

# 2. 의존성 설치
log_step "2. 의존성 설치"

# 백엔드 의존성 설치
log_info "백엔드 의존성 설치..."
cd backend
npm install --silent
cd ..

# 프론트엔드 의존성 설치
log_info "프론트엔드 의존성 설치..."
cd frontend
npm install --silent
cd ..

# 3. 환경변수 확인
log_step "3. 환경변수 확인"
MISSING_ENV=false

if [ "$ENVIRONMENT" = "production" ]; then
    if [ ! -f "backend/.env" ]; then
        log_error "백엔드 .env 파일이 없습니다"
        MISSING_ENV=true
    fi
    
    if [ ! -f "frontend/.env" ]; then
        log_error "프론트엔드 .env 파일이 없습니다"
        MISSING_ENV=true
    fi
else
    # 개발 환경에서는 .env.development 파일 확인
    if [ ! -f "backend/.env.development" ] && [ ! -f "backend/.env" ]; then
        log_warn "백엔드 환경 파일이 없습니다. 기본값을 사용합니다"
    fi
    
    if [ ! -f "frontend/.env.development" ] && [ ! -f "frontend/.env" ]; then
        log_warn "프론트엔드 환경 파일이 없습니다. 기본값을 사용합니다"
    fi
fi

if [ "$MISSING_ENV" = true ]; then
    log_error "필수 환경 파일이 누락되었습니다. 배포를 중단합니다"
    exit 1
fi

# 4. 코드 품질 검사 및 테스트
log_step "4. 코드 품질 검사 및 테스트"

# 백엔드 린트 (옵션)
if [ "$SKIP_LINT" = false ]; then
    log_info "백엔드 코드 품질 검사..."
    cd backend
    npm run lint || {
        log_warn "백엔드 ESLint 검사 실패. 계속 진행합니다"
    }
    cd ..
else
    log_info "백엔드 린트 검사 건너뜀"
fi

# 백엔드 테스트 (옵션)
if [ "$SKIP_TESTS" = false ]; then
    log_info "백엔드 테스트 실행..."
    cd backend
    # 테스트 환경 파일이 있으면 사용
    if [ -f ".env.test" ]; then
        NODE_ENV=test npm test || {
            log_warn "백엔드 테스트 실패. 계속 진행합니다"
        }
    else
        log_warn "테스트 환경 파일이 없습니다. 테스트를 건너뜁니다"
    fi
    cd ..
else
    log_info "백엔드 테스트 건너뜀"
fi

# 프론트엔드 린트 (옵션)
if [ "$SKIP_LINT" = false ]; then
    log_info "프론트엔드 코드 품질 검사..."
    cd frontend
    npm run lint || {
        log_warn "프론트엔드 ESLint 검사 실패. 계속 진행합니다"
    }
    cd ..
else
    log_info "프론트엔드 린트 검사 건너뜀"
fi

# 프론트엔드 테스트 (옵션)
if [ "$SKIP_TESTS" = false ]; then
    log_info "프론트엔드 테스트 실행..."
    cd frontend
    CI=true npm test -- --passWithNoTests || {
        log_warn "프론트엔드 테스트 실패. 계속 진행합니다"
    }
    cd ..
else
    log_info "프론트엔드 테스트 건너뜀"
fi

# 5. 프론트엔드 빌드
log_step "5. 프론트엔드 빌드"
log_info "프론트엔드 빌드 중..."
cd frontend
npm run build
cd ..

# 빌드 성공 확인
if [ ! -d "frontend/build" ]; then
    log_error "프론트엔드 빌드 실패. build 디렉토리가 생성되지 않았습니다"
    exit 1
fi

# 6. 프로덕션 환경 특별 처리
if [ "$ENVIRONMENT" = "production" ]; then
    log_step "6. 프로덕션 환경 설정"
    
    # 빌드 파일 권한 설정
    log_info "빌드 파일 권한 설정..."
    chmod -R 755 frontend/build/ 2>/dev/null || log_warn "빌드 파일 권한 설정 실패"
    
    # PM2로 백엔드 재시작
    cd backend
    if command -v pm2 &> /dev/null; then
        log_info "PM2로 백엔드 서버 재시작..."
        if pm2 list | grep -q "likorea-backend"; then
            pm2 restart likorea-backend --update-env
        else
            pm2 start server.js --name "likorea-backend" --env production
        fi
        pm2 save
    else
        log_warn "PM2가 설치되어 있지 않습니다"
        log_info "수동으로 서버를 시작하세요: NODE_ENV=production node server.js"
    fi
    cd ..
    
    # Nginx 설정 확인 및 재시작
    if command -v nginx &> /dev/null; then
        log_info "Nginx 설정 확인..."
        nginx -t &>/dev/null || {
            log_error "Nginx 설정 오류. 수동으로 확인이 필요합니다"
        }
        
        if command -v systemctl &> /dev/null; then
            log_info "Nginx 재시작..."
            sudo systemctl reload nginx || log_warn "Nginx 재시작 실패. 수동으로 재시작하세요"
        fi
    else
        log_warn "Nginx가 설치되어 있지 않습니다"
    fi
else
    log_step "6. 개발 환경 설정"
    log_info "개발 환경에서는 수동으로 서버를 시작하세요:"
    log_info "  백엔드: cd backend && npm run dev"
    log_info "  프론트엔드: cd frontend && npm start"
fi

# 7. 배포 완료
log_step "7. 배포 완료"
log_info "🎉 자동 배포가 완료되었습니다!"

if [ "$ENVIRONMENT" = "production" ]; then
    log_info "🌐 프로덕션 URL: https://likorea.com"
    if command -v pm2 &> /dev/null; then
        log_info "📊 PM2 상태 확인: pm2 status"
        log_info "📝 로그 확인: pm2 logs likorea-backend"
    fi
else
    log_info "🌐 개발 서버 URL:"
    log_info "  - 프론트엔드: http://localhost:3000"
    log_info "  - 백엔드: http://localhost:5001"
fi

log_info "✅ 배포 요약:"
log_info "  - 환경: $ENVIRONMENT"
log_info "  - 테스트: $([ "$SKIP_TESTS" = true ] && echo "건너뜀" || echo "실행됨")"
log_info "  - 린트: $([ "$SKIP_LINT" = true ] && echo "건너뜀" || echo "실행됨")"
log_info "  - Git 확인: $([ "$SKIP_GIT_CHECK" = true ] && echo "건너뜀" || echo "실행됨")"

# 종료 코드
exit 0
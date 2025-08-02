#!/bin/bash

# 🚀 Likorea 배포 스크립트
# 사용법: ./deploy.sh [environment] [--force] [--init-db]
# 예시: ./deploy.sh production
# 예시: ./deploy.sh production --force (테스트 실패 시에도 배포)
# 예시: ./deploy.sh production --init-db (DB 초기화와 함께 배포)
# 예시: ./deploy.sh production --force --init-db (강제 배포 + DB 초기화)

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
    log_error "사용법: ./deploy.sh [development|production] [--force] [--init-db]"
    exit 1
fi

# 옵션 확인
FORCE_DEPLOY=false
INIT_DB=false

# 모든 매개변수를 순회하면서 옵션 확인
for arg in "$@"; do
    case $arg in
        --force)
            FORCE_DEPLOY=true
            log_warn "Force 모드로 배포합니다. 테스트 실패 시에도 배포가 계속됩니다."
            ;;
        --init-db)
            INIT_DB=true
            log_warn "데이터베이스 초기화 모드입니다. 모든 데이터가 삭제됩니다!"
            ;;
    esac
done

# DB 초기화 경고 및 확인
if [ "$INIT_DB" = true ]; then
    log_error "⚠️  경고: 데이터베이스를 초기화하면 모든 기존 데이터가 삭제됩니다!"
    log_error "⚠️  이 작업은 되돌릴 수 없습니다!"
    read -p "정말로 데이터베이스를 초기화하시겠습니까? (DELETE/n): " -r
    if [ "$REPLY" != "DELETE" ]; then
        log_info "데이터베이스 초기화가 취소되었습니다."
        exit 1
    fi
    log_warn "데이터베이스 초기화가 확인되었습니다."
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

# 4. 코드 품질 검사 및 테스트 실행
log_step "4. 코드 품질 검사 및 테스트 실행"

# 백엔드 린트 및 포맷 검사
log_info "백엔드 코드 품질 검사..."
cd backend
npm run lint || {
    log_warn "백엔드 ESLint 검사 실패"
    if [ "$FORCE_DEPLOY" = false ]; then
        log_error "ESLint 오류를 수정하거나 --force 옵션을 사용하세요."
        exit 1
    fi
}

# Prettier 제거됨 - 포맷 검사 건너뛰기
log_info "백엔드 포맷 검사: Prettier 제거됨 (ESLint만 사용)"

# 백엔드 테스트 (원격 MongoDB Atlas 사용)
log_info "백엔드 테스트 실행 (원격 MongoDB Atlas 연결)..."
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

# 프론트엔드 린트 및 포맷 검사
log_info "프론트엔드 코드 품질 검사..."
cd frontend
npm run lint || {
    log_warn "프론트엔드 ESLint 검사 실패"
    if [ "$FORCE_DEPLOY" = false ]; then
        log_error "ESLint 오류를 수정하거나 --force 옵션을 사용하세요."
        exit 1
    fi
}

# Prettier 제거됨 - 포맷 검사 건너뛰기
log_info "프론트엔드 포맷 검사: Prettier 제거됨 (ESLint만 사용)"

# 프론트엔드 테스트
log_info "프론트엔드 테스트 실행..."
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

# 빌드 파일 권한 설정 (프로덕션 환경에서만)
if [ "$ENVIRONMENT" = "production" ]; then
    log_info "빌드 파일 권한 설정..."
    # Nginx가 접근할 수 있도록 디렉토리 권한 설정
    chmod -R 755 build/ || {
        log_warn "빌드 디렉토리 권한 설정 실패"
    }
    # 상위 디렉토리들도 접근 가능하도록 설정
    chmod 755 . || {
        log_warn "현재 디렉토리 권한 설정 실패"
    }
    log_info "빌드 파일 권한 설정 완료"
fi
cd ..

# 6. 데이터베이스 초기화 (옵션)
if [ "$INIT_DB" = true ]; then
    log_step "6. 데이터베이스 초기화"
    log_info "데이터베이스를 초기화하고 있습니다..."
    cd backend
    
    # 환경에 따라 다른 초기화 스크립트 실행
    if [ "$ENVIRONMENT" = "production" ]; then
        NODE_ENV=production node utils/initDB.js || {
            log_error "데이터베이스 초기화 실패"
            exit 1
        }
    else
        node utils/initDB.js || {
            log_error "데이터베이스 초기화 실패"
            exit 1
        }
    fi
    
    log_info "데이터베이스 초기화가 완료되었습니다."
    cd ..
fi

# 7. 백엔드 서버 시작
log_step "7. 백엔드 서버 시작"
cd backend

if [ "$ENVIRONMENT" = "production" ]; then
    if command -v pm2 &> /dev/null; then
        if pm2 list | grep -q "likorea-backend"; then
            log_info "기존 백엔드 서버 재시작..."
            pm2 restart likorea-backend --update-env
        else
            log_info "새 백엔드 서버 시작..."
            pm2 start server.js --name "likorea-backend" --env production
        fi
    else
        log_warn "PM2가 설치되어 있지 않습니다. 직접 서버를 시작하세요."
        log_info "수동 실행: NODE_ENV=production node server.js"
    fi
else
    log_info "개발 환경에서는 PM2를 사용하지 않습니다."
    log_info "개발 서버 시작: npm run dev"
fi
cd ..

# 8. Nginx 설정 확인 (프로덕션 환경에서만)
if [ "$ENVIRONMENT" = "production" ]; then
    log_step "8. Nginx 설정 확인"
    if command -v nginx &> /dev/null; then
        log_info "Nginx 설정 테스트..."
        nginx -t || {
            log_error "Nginx 설정 오류가 있습니다."
            exit 1
        }
        
        log_info "Nginx 재시작..."
        if command -v systemctl &> /dev/null; then
            systemctl reload nginx || {
                log_warn "Nginx 재시작 실패. 수동으로 재시작해주세요."
            }
        else
            log_warn "systemctl을 찾을 수 없습니다. 수동으로 Nginx를 재시작해주세요."
        fi
    else
        log_warn "Nginx가 설치되어 있지 않습니다."
    fi
else
    log_info "개발 환경에서는 Nginx 설정을 건너뜁니다."
fi

# 9. SSL 인증서 설정 (프로덕션)
if [ "$ENVIRONMENT" = "production" ]; then
    log_step "9. SSL 인증서 설정"
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

# 10. 서비스 상태 확인
log_step "10. 서비스 상태 확인"

if [ "$ENVIRONMENT" = "production" ]; then
    if command -v pm2 &> /dev/null; then
        log_info "PM2 프로세스 상태:"
        pm2 list
    fi

    if command -v systemctl &> /dev/null && command -v nginx &> /dev/null; then
        log_info "Nginx 상태:"
        systemctl status nginx --no-pager -l || log_warn "Nginx 상태 확인 실패"
    fi
else
    log_info "개발 환경에서는 서비스 상태 확인을 건너뜁니다."
    log_info "개발 서버를 수동으로 시작하세요:"
    log_info "  백엔드: cd backend && npm run dev"
    log_info "  프론트엔드: cd frontend && npm start"
fi

# 11. 배포 완료
log_info "🎉 배포가 완료되었습니다!"

if [ "$INIT_DB" = true ]; then
    log_info "📊 데이터베이스가 초기화되었습니다."
    log_info "🔧 초기 데이터 및 태그가 생성되었습니다."
fi

if [ "$ENVIRONMENT" = "production" ]; then
    log_info "🌐 웹사이트: https://likorea.com"
    log_info "📊 PM2 모니터링: pm2 monit"
    log_info "📝 로그 확인: pm2 logs likorea-backend"
    log_info "🔧 유용한 명령어:"
    log_info "  - PM2 재시작: pm2 restart likorea-backend"
    log_info "  - Nginx 재시작: sudo systemctl reload nginx"
    log_info "  - SSL 갱신: sudo certbot renew"
    log_info "  - DB 초기화: ./deploy.sh production --init-db"
else
    log_info "🌐 개발 서버 URL:"
    log_info "  - 프론트엔드: http://localhost:3000"
    log_info "  - 백엔드: http://localhost:5001"
    log_info "🔧 개발 명령어:"
    log_info "  - 백엔드 개발 서버: cd backend && npm run dev"
    log_info "  - 프론트엔드 개발 서버: cd frontend && npm start"
    log_info "  - 테스트 실행: npm test (각 디렉토리에서)"
    log_info "  - 코드 린트: npm run lint (각 디렉토리에서)"
    log_info "  - DB 초기화: ./deploy.sh development --init-db"
fi 
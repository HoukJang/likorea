#!/bin/bash

# 🚀 Likorea 통합 배포 스크립트
# 사용법: ./deploy.sh [environment] [options]
# 
# 환경:
#   development  개발 환경 (기본값)
#   production   프로덕션 환경
#
# 옵션:
#   --force           테스트 실패 시에도 배포 진행
#   --init-db         데이터베이스 초기화 (주의: 모든 데이터 삭제)
#   --skip-tests      테스트를 건너뜁니다
#   --skip-lint       린트 검사를 건너뜁니다
#   --skip-git-check  Git 상태 확인을 건너뜁니다
#   --auto            Non-interactive 모드 (CI/CD용)
#   --quiet           조용한 모드 (최소 출력)
#   --update-nginx    Nginx 설정 업데이트 (프로덕션 전용)
#
# 예시:
#   ./deploy.sh production
#   ./deploy.sh production --force
#   ./deploy.sh production --init-db
#   ./deploy.sh production --auto --skip-tests
#   ./deploy.sh production --force --init-db
#   ./deploy.sh production --update-nginx

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
    [ "$QUIET_MODE" = true ] && return
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    [ "$QUIET_MODE" = true ] && return
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 환경 확인
if [ "$ENVIRONMENT" != "development" ] && [ "$ENVIRONMENT" != "production" ]; then
    log_error "지원하지 않는 환경입니다: $ENVIRONMENT"
    log_error "사용법: ./deploy.sh [development|production] [options]"
    exit 1
fi

# 옵션 파싱
FORCE_DEPLOY=false
INIT_DB=false
SKIP_TESTS=false
SKIP_LINT=false
SKIP_GIT_CHECK=false
AUTO_MODE=false
QUIET_MODE=false
UPDATE_NGINX=false

# 모든 매개변수를 순회하면서 옵션 확인
shift # 첫 번째 파라미터(환경) 제거
for arg in "$@"; do
    case $arg in
        --force)
            FORCE_DEPLOY=true
            log_warn "Force 모드가 활성화되었습니다. 테스트 실패를 무시합니다."
            ;;
        --init-db)
            if [ "$ENVIRONMENT" = "production" ] && [ "$AUTO_MODE" = true ]; then
                log_error "프로덕션 환경에서는 자동 모드로 DB 초기화를 할 수 없습니다"
                log_error "안전을 위해 수동으로 실행하세요"
                exit 1
            fi
            INIT_DB=true
            log_warn "데이터베이스가 초기화됩니다. 모든 데이터가 삭제됩니다!"
            ;;
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
        --auto)
            AUTO_MODE=true
            log_info "자동 모드로 실행합니다 (Non-interactive)"
            ;;
        --quiet)
            QUIET_MODE=true
            ;;
        --update-nginx)
            if [ "$ENVIRONMENT" != "production" ]; then
                log_error "--update-nginx 옵션은 프로덕션 환경에서만 사용할 수 있습니다"
                exit 1
            fi
            UPDATE_NGINX=true
            log_info "Nginx 설정 업데이트가 활성화되었습니다"
            ;;
        *)
            log_warn "알 수 없는 옵션: $arg"
            ;;
    esac
done

# 프로덕션 환경 경고
if [ "$ENVIRONMENT" = "production" ] && [ "$AUTO_MODE" = false ]; then
    log_warn "⚠️  프로덕션 환경에 배포하려고 합니다!"
    if [ "$INIT_DB" = true ]; then
        log_error "⚠️  데이터베이스가 초기화됩니다! 모든 데이터가 삭제됩니다!"
    fi
    if [ "$FORCE_DEPLOY" = false ] && [ "$SKIP_TESTS" = false ]; then
        read -p "계속하시겠습니까? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "배포가 취소되었습니다."
            exit 0
        fi
    fi
fi

# 프로덕션 자동 모드에서 DB 초기화 방지
if [ "$ENVIRONMENT" = "production" ] && [ "$AUTO_MODE" = true ]; then
    log_warn "⚠️  프로덕션 자동 모드에서는 DB 초기화가 비활성화됩니다"
    log_warn "⚠️  DB 초기화가 필요한 경우 수동으로 실행하세요"
    INIT_DB=false
fi

# 1. Git 상태 확인
if [ "$SKIP_GIT_CHECK" = false ]; then
    log_step "1. Git 상태 확인"
    if [ -n "$(git status --porcelain)" ]; then
        log_warn "커밋되지 않은 변경사항이 있습니다:"
        git status --short
        if [ "$AUTO_MODE" = false ] && [ "$FORCE_DEPLOY" = false ]; then
            read -p "계속하시겠습니까? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "배포가 취소되었습니다."
                exit 0
            fi
        else
            log_warn "계속 진행합니다"
        fi
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
if [ "$QUIET_MODE" = true ]; then
    npm install --silent
else
    npm install
fi
cd ..

# 프론트엔드 의존성 설치
log_info "프론트엔드 의존성 설치..."
cd frontend
if [ "$QUIET_MODE" = true ]; then
    npm install --silent
else
    npm install
fi
cd ..

# 3. 환경변수 확인
log_step "3. 환경변수 확인"
MISSING_ENV=false

if [ "$ENVIRONMENT" = "production" ]; then
    if [ ! -f "backend/.env" ]; then
        log_error "백엔드 .env 파일이 없습니다."
        log_info "백엔드 .env 파일을 생성해주세요."
        MISSING_ENV=true
    fi
    
    if [ ! -f "frontend/.env" ]; then
        log_error "프론트엔드 .env 파일이 없습니다."
        log_info "프론트엔드 .env 파일을 생성해주세요."
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

# 4. 코드 품질 검사 및 테스트 실행
log_step "4. 코드 품질 검사 및 테스트 실행"

# 백엔드 린트 및 포맷 검사
if [ "$SKIP_LINT" = false ]; then
    log_info "백엔드 코드 품질 검사..."
    cd backend
    npm run lint || {
        log_warn "백엔드 ESLint 검사 실패"
        if [ "$FORCE_DEPLOY" = false ] && [ "$AUTO_MODE" = false ]; then
            log_error "ESLint 오류를 수정하거나 --force 또는 --skip-lint 옵션을 사용하세요."
            exit 1
        fi
    }
    cd ..
else
    log_info "백엔드 린트 검사 건너뜀"
fi

# 백엔드 테스트
if [ "$SKIP_TESTS" = false ]; then
    log_info "백엔드 테스트 실행 (원격 MongoDB Atlas 연결)..."
    cd backend
    if [ "$AUTO_MODE" = true ] || [ "$QUIET_MODE" = true ]; then
        CI=true npm test || {
            log_warn "백엔드 테스트 실패"
            if [ "$FORCE_DEPLOY" = false ]; then
                log_error "테스트를 수정하거나 --force 또는 --skip-tests 옵션을 사용하세요."
                exit 1
            else
                log_warn "Force 모드로 인해 테스트 실패를 무시하고 배포를 계속합니다."
            fi
        }
    else
        npm test || {
            log_warn "백엔드 테스트 실패"
            if [ "$FORCE_DEPLOY" = false ]; then
                log_error "테스트를 수정하거나 --force 또는 --skip-tests 옵션을 사용하세요."
                exit 1
            else
                log_warn "Force 모드로 인해 테스트 실패를 무시하고 배포를 계속합니다."
            fi
        }
    fi
    cd ..
else
    log_info "백엔드 테스트 건너뜀"
fi

# 프론트엔드 린트 및 포맷 검사
if [ "$SKIP_LINT" = false ]; then
    log_info "프론트엔드 코드 품질 검사..."
    cd frontend
    npm run lint || {
        log_warn "프론트엔드 ESLint 검사 실패"
        if [ "$FORCE_DEPLOY" = false ] && [ "$AUTO_MODE" = false ]; then
            log_error "ESLint 오류를 수정하거나 --force 또는 --skip-lint 옵션을 사용하세요."
            exit 1
        fi
    }
    cd ..
else
    log_info "프론트엔드 린트 검사 건너뜀"
fi

# 프론트엔드 테스트
if [ "$SKIP_TESTS" = false ]; then
    log_info "프론트엔드 테스트 실행..."
    cd frontend
    if [ "$AUTO_MODE" = true ] || [ "$QUIET_MODE" = true ]; then
        CI=true npm test -- --watchAll=false --passWithNoTests || {
            log_warn "프론트엔드 테스트 실패"
            if [ "$FORCE_DEPLOY" = false ]; then
                log_error "테스트를 수정하거나 --force 또는 --skip-tests 옵션을 사용하세요."
                exit 1
            else
                log_warn "Force 모드로 인해 테스트 실패를 무시하고 배포를 계속합니다."
            fi
        }
    else
        npm test -- --watchAll=false --passWithNoTests || {
            log_warn "프론트엔드 테스트 실패"
            if [ "$FORCE_DEPLOY" = false ]; then
                log_error "테스트를 수정하거나 --force 또는 --skip-tests 옵션을 사용하세요."
                exit 1
            else
                log_warn "Force 모드로 인해 테스트 실패를 무시하고 배포를 계속합니다."
            fi
        }
    fi
    cd ..
else
    log_info "프론트엔드 테스트 건너뜀"
fi

# 5. 버전 관리
log_step "5. 버전 관리"
log_info "버전 정보 동기화 및 주입..."

# 버전 관리자 실행
if [ -f "scripts/version-manager.js" ]; then
    node scripts/version-manager.js sync
    node scripts/version-manager.js inject
    node scripts/version-manager.js current
else
    log_warn "버전 관리자가 없습니다. 버전 관리를 건너뜁니다."
fi

# 6. 프론트엔드 빌드
log_step "6. 프론트엔드 빌드"
log_info "프론트엔드 빌드 중..."
cd frontend
npm run build

# 빌드 성공 확인
if [ ! -d "build" ]; then
    log_error "프론트엔드 빌드 실패. build 디렉토리가 생성되지 않았습니다"
    exit 1
fi

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

# 7. 데이터베이스 초기화 (옵션)
if [ "$INIT_DB" = true ]; then
    log_step "7. 데이터베이스 초기화"
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

# 8. 백엔드 서버 시작
log_step "8. 백엔드 서버 시작"
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
        pm2 save
    else
        log_warn "PM2가 설치되어 있지 않습니다. 직접 서버를 시작하세요."
        log_info "수동 실행: NODE_ENV=production node server.js"
    fi
else
    log_info "개발 환경에서는 PM2를 사용하지 않습니다."
    log_info "개발 서버 시작: npm run dev"
fi
cd ..

# 9. Nginx 설정 확인 및 업데이트 (프로덕션 환경에서만)
if [ "$ENVIRONMENT" = "production" ]; then
    log_step "9. Nginx 설정 확인 및 업데이트"
    
    # Nginx 설정 업데이트 (옵션)
    if [ "$UPDATE_NGINX" = true ]; then
        log_info "Nginx 설정 업데이트 시작..."
        
        # 설정 파일 경로
        NGINX_CONFIG_FILE="nginx-likorea-simple.conf"
        TARGET_DIR="/etc/nginx/sites-available"
        TARGET_FILE="$TARGET_DIR/likorea"
        ENABLED_DIR="/etc/nginx/sites-enabled"
        ENABLED_FILE="$ENABLED_DIR/likorea"
        
        # 설정 파일 존재 확인
        if [ ! -f "$NGINX_CONFIG_FILE" ]; then
            log_error "Nginx 설정 파일이 없습니다: $NGINX_CONFIG_FILE"
            log_info "프로젝트 루트에 nginx-likorea-simple.conf 파일이 필요합니다."
            exit 1
        fi
        
        # 기존 설정 백업
        log_info "기존 Nginx 설정 백업 중..."
        if [ -f "$TARGET_FILE" ]; then
            sudo cp "$TARGET_FILE" "$TARGET_FILE.backup.$(date +%Y%m%d_%H%M%S)" || {
                log_error "Nginx 설정 백업 실패"
                exit 1
            }
            log_info "백업 완료: $TARGET_FILE.backup.$(date +%Y%m%d_%H%M%S)"
        fi
        
        # 새 설정 복사
        log_info "새 Nginx 설정 적용 중..."
        sudo cp "$NGINX_CONFIG_FILE" "$TARGET_FILE" || {
            log_error "Nginx 설정 복사 실패"
            exit 1
        }
        
        # sites-enabled 처리 (심볼릭 링크 제거하고 직접 복사)
        log_info "sites-enabled 설정 중..."
        if [ -L "$ENABLED_FILE" ]; then
            # 심볼릭 링크면 제거
            sudo rm "$ENABLED_FILE"
            log_info "기존 심볼릭 링크 제거됨"
        fi
        # 직접 파일 복사
        sudo cp "$TARGET_FILE" "$ENABLED_FILE" || {
            log_error "sites-enabled 설정 실패"
            exit 1
        }
        log_info "sites-enabled 설정 완료"
    fi
    
    if command -v nginx &> /dev/null; then
        log_info "Nginx 설정 테스트..."
        if ! sudo nginx -t; then
            log_error "Nginx 설정 오류가 있습니다."
            
            # 업데이트했다면 롤백 시도
            if [ "$UPDATE_NGINX" = true ]; then
                log_warn "이전 설정으로 롤백 시도 중..."
                LATEST_BACKUP=$(ls -t "$TARGET_FILE.backup."* 2>/dev/null | head -1)
                if [ -f "$LATEST_BACKUP" ]; then
                    sudo cp "$LATEST_BACKUP" "$TARGET_FILE"
                    sudo cp "$LATEST_BACKUP" "$ENABLED_FILE"
                    if sudo nginx -t; then
                        log_info "롤백 성공"
                        sudo systemctl reload nginx
                    else
                        log_error "롤백 실패. 수동 복구가 필요합니다."
                    fi
                fi
            fi
            exit 1
        fi
        
        log_info "Nginx 재시작..."
        if command -v systemctl &> /dev/null; then
            # AUTO_MODE에서는 sudo 필요 시 실패 허용
            if [ "$AUTO_MODE" = true ]; then
                sudo systemctl reload nginx 2>/dev/null || systemctl reload nginx || {
                    log_warn "Nginx 재시작 실패. 수동으로 재시작해주세요."
                }
            else
                sudo systemctl reload nginx || systemctl reload nginx || {
                    log_warn "Nginx 재시작 실패. 수동으로 재시작해주세요."
                }
            fi
        else
            log_warn "systemctl을 찾을 수 없습니다. 수동으로 Nginx를 재시작해주세요."
        fi
        
        # 캐시 설정 확인 메시지
        if [ "$UPDATE_NGINX" = true ]; then
            log_info ""
            log_info "========== 캐시 설정 확인 =========="
            log_info "테스트 명령어:"
            log_info "  curl -I https://likorea.com/static/js/[해시].chunk.js | grep Cache-Control"
            log_info ""
            log_info "기대 결과:"
            log_info "  - 해시가 있는 파일: Cache-Control: public, max-age=31536000, immutable"
            log_info "  - 일반 JS/CSS: Cache-Control: public, max-age=604800"
            log_info "  - HTML: Cache-Control: no-cache, no-store, must-revalidate"
            log_info ""
        fi
    else
        log_warn "Nginx가 설치되어 있지 않습니다."
    fi
else
    log_info "개발 환경에서는 Nginx 설정을 건너뜁니다."
fi

# 10. SSL 인증서 설정 (프로덕션)
if [ "$ENVIRONMENT" = "production" ] && [ "$AUTO_MODE" = false ]; then
    log_step "10. SSL 인증서 설정"
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

# 11. 서비스 상태 확인
log_step "11. 서비스 상태 확인"

if [ "$ENVIRONMENT" = "production" ]; then
    if command -v pm2 &> /dev/null; then
        log_info "PM2 프로세스 상태:"
        pm2 list
    fi
    
    log_info "🌐 프로덕션 URL: https://likorea.com"
    log_info "📊 PM2 상태 확인: pm2 status"
    log_info "📝 로그 확인: pm2 logs likorea-backend"
else
    log_info "🌐 개발 서버 URL:"
    log_info "  - 프론트엔드: http://localhost:3000"
    log_info "  - 백엔드: http://localhost:5001"
fi

# 배포 완료
log_info "🎉 배포가 완료되었습니다!"
log_info "✅ 배포 요약:"
log_info "  - 환경: $ENVIRONMENT"
log_info "  - 버전: $([ -f "version.json" ] && node -pe "JSON.parse(require('fs').readFileSync('version.json')).version" || echo "N/A")"
log_info "  - 테스트: $([ "$SKIP_TESTS" = true ] && echo "건너뜀" || echo "실행됨")"
log_info "  - 린트: $([ "$SKIP_LINT" = true ] && echo "건너뜀" || echo "실행됨")"
log_info "  - Git 확인: $([ "$SKIP_GIT_CHECK" = true ] && echo "건너뜀" || echo "실행됨")"
log_info "  - 모드: $([ "$AUTO_MODE" = true ] && echo "자동" || echo "수동")"
if [ "$ENVIRONMENT" = "production" ]; then
    log_info "  - Nginx 업데이트: $([ "$UPDATE_NGINX" = true ] && echo "완료" || echo "건너뜀")"
fi

# 종료 코드
exit 0
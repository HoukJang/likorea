#!/bin/bash

# Nginx 캐시 설정 업데이트 스크립트
# 프로덕션 서버에서 실행

echo "🚀 Nginx 캐시 설정 업데이트 시작..."

# 백업 생성
echo "📦 기존 설정 백업 중..."
sudo cp /etc/nginx/sites-available/likorea.com /etc/nginx/sites-available/likorea.com.backup.$(date +%Y%m%d_%H%M%S)

# nginx 설정 업데이트
echo "⚙️  캐시 설정 추가 중..."

# 캐시 설정을 포함한 새로운 location 블록
cat > /tmp/nginx-cache-update.conf << 'EOF'
    # 정적 파일 캐시 정책 (기존 설정 교체)
    
    # HTML 파일 - 캐시하지 않음
    location ~* \.(?:manifest|appcache|html?|xml|json)$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # JS/CSS 파일 (해시가 있는 경우) - 1년 캐시
    location ~* \.[a-f0-9]{8,}\.(?:js|css)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Content-Type-Options "nosniff";
    }

    # JS/CSS 파일 (해시가 없는 경우) - 7일 캐시
    location ~* \.(?:js|css)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
        add_header X-Content-Type-Options "nosniff";
    }

    # 폰트 파일 - 1년 캐시
    location ~* \.(?:woff|woff2|ttf|otf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Access-Control-Allow-Origin "*";
    }

    # 이미지 파일 - 30일 캐시
    location ~* \.(?:jpg|jpeg|png|gif|ico|svg|webp|avif)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        add_header Vary "Accept";
    }
EOF

echo "📝 Nginx 설정 파일 수정 중..."
# 실제 적용은 수동으로 해야 함
echo ""
echo "⚠️  다음 단계를 수동으로 실행하세요:"
echo ""
echo "1. nginx 설정 파일 편집:"
echo "   sudo nano /etc/nginx/sites-available/likorea.com"
echo ""
echo "2. server 블록 내에서 기존 location 블록들을 찾아서"
echo "   /tmp/nginx-cache-update.conf 내용으로 교체"
echo ""
echo "3. 설정 테스트:"
echo "   sudo nginx -t"
echo ""
echo "4. nginx 재시작:"
echo "   sudo systemctl reload nginx"
echo ""
echo "5. 캐시 헤더 확인:"
echo "   curl -I https://likorea.com/static/js/main.[hash].js"
echo "   → Cache-Control: public, max-age=31536000, immutable 확인"
echo ""

# Express 정적 파일 설정도 확인
echo "📌 Express 정적 파일 캐시 설정도 확인하세요:"
echo ""
echo "backend/server.js에 다음 추가 (이미 추가됨):"
echo "app.use(cacheHeaders);"
echo ""
echo "✅ 스크립트 완료!"
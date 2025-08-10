# 🚀 NGINX 캐시 설정 - 초간단 가이드

## 📌 한 줄 요약
```bash
./apply-nginx-config.sh
```
위 명령어 하나로 모든 nginx 캐시 설정이 완료됩니다.

## 🎯 설정 결과
- **해시가 있는 파일** (예: `main.a3f56b89.js`, `206.5ef4516f.chunk.js`): **1년 캐시**
- **일반 JS/CSS**: 7일 캐시
- **이미지**: 30일 캐시
- **폰트**: 1년 캐시
- **HTML**: 캐시 안 함

## 📁 파일 구조
```
/root/likorea/
├── nginx-likorea-simple.conf   # 완전한 nginx 설정 (이것만 있으면 됨)
├── apply-nginx-config.sh        # 원클릭 적용 스크립트
└── NGINX_CACHE_README.md        # 이 파일
```

## 🔧 수동 적용 방법 (스크립트 안 쓸 경우)
```bash
# 1. 설정 파일 복사
sudo cp /root/likorea/nginx-likorea-simple.conf /etc/nginx/sites-available/likorea
sudo cp /root/likorea/nginx-likorea-simple.conf /etc/nginx/sites-enabled/likorea

# 2. 테스트
sudo nginx -t

# 3. 적용
sudo systemctl reload nginx
```

## ✅ 캐시 확인 방법
```bash
# 해시가 있는 파일 확인 (1년 캐시 확인)
wget --spider --server-response https://likorea.com/static/js/*.chunk.js 2>&1 | grep Cache-Control
# 결과: Cache-Control: public, max-age=31536000, immutable

# HTML 파일 확인 (캐시 안 함 확인) 
wget --spider --server-response https://likorea.com/ 2>&1 | grep Cache-Control
# 결과: Cache-Control: no-cache, no-store, must-revalidate
```

## 🔥 중요 포인트
1. **심볼릭 링크 없음** - sites-available과 sites-enabled에 직접 파일 복사
2. **우선순위 중요** - 해시 파일 패턴이 일반 JS/CSS보다 먼저 매칭되도록 설정
3. **정규식 패턴** - `\.[0-9a-f]{8,}\.(chunk\.)?(js|css)$` 이 패턴이 핵심

## 🆘 문제 해결
만약 캐시가 1분으로 나온다면:
1. sites-enabled에 오래된 설정이 있을 수 있음
2. `./apply-nginx-config.sh` 다시 실행
3. 그래도 안 되면 nginx 재시작: `sudo systemctl restart nginx`

## 📝 다음 업데이트 시
그냥 `nginx-likorea-simple.conf` 파일만 수정하고 스크립트 실행하면 끝!

---
작성일: 2025-08-10
캐시 정책: 해시 파일 1년, 일반 파일 7일, HTML 캐시 안 함
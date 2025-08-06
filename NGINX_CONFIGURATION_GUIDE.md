# Nginx Configuration Guide for Large File Uploads

이 문서는 HTTP 413 (Payload Too Large) 오류를 해결하기 위한 Nginx 설정 가이드입니다.

## 문제 상황
- HTTP 413 오류: 요청 본문이 서버의 최대 허용 크기를 초과
- 이미지 업로드, 맛집봇 콘텐츠 등 대용량 데이터 전송 시 발생

## 해결 방법

### 1. Express 설정 (이미 완료됨)
```javascript
// backend/server.js
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

### 2. Nginx 설정 (서버에서 직접 수정 필요)

#### Nginx 설정 파일 찾기
```bash
# 일반적인 위치들
/etc/nginx/nginx.conf
/etc/nginx/sites-available/likorea.com
/etc/nginx/sites-enabled/likorea.com
```

#### client_max_body_size 설정 추가
```nginx
# nginx.conf 또는 site 설정 파일에 추가
server {
    listen 80;
    listen 443 ssl;
    server_name likorea.com www.likorea.com;
    
    # 최대 업로드 크기를 10MB로 설정
    client_max_body_size 10M;
    
    # 기타 설정들...
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # 프록시 타임아웃 설정 (대용량 파일 업로드 시)
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
        send_timeout 300;
    }
}
```

#### Nginx 설정 테스트 및 재시작
```bash
# 설정 문법 검사
sudo nginx -t

# 설정이 올바르면 Nginx 재시작
sudo systemctl reload nginx
# 또는
sudo service nginx reload
```

### 3. 추가 고려사항

#### MongoDB 문서 크기 제한
- MongoDB의 단일 문서 최대 크기: 16MB
- 큰 이미지는 GridFS 사용 고려

#### 네트워크 타임아웃
- 대용량 파일 업로드 시 타임아웃 설정도 함께 조정 필요

#### 보안 고려사항
- 너무 큰 파일 크기 허용은 DoS 공격에 취약할 수 있음
- 실제 필요한 크기만큼만 설정 권장

## 테스트 방법

1. 작은 이미지로 먼저 테스트
2. 점진적으로 큰 이미지로 테스트
3. 로그 확인:
   ```bash
   # Nginx 에러 로그
   sudo tail -f /var/log/nginx/error.log
   
   # Node.js 애플리케이션 로그
   pm2 logs likorea-backend
   ```

## 문제 지속 시 체크리스트

- [ ] Express body-parser limit 설정 확인
- [ ] Nginx client_max_body_size 설정 확인
- [ ] Nginx 재시작 여부 확인
- [ ] CloudFlare 등 CDN 설정 확인 (사용 중인 경우)
- [ ] 브라우저 개발자 도구에서 정확한 오류 메시지 확인
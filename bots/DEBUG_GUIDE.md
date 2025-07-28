# 디버깅 가이드

## dispatch_failed 오류 해결 방법

### 1. 봇 재시작
```bash
# 봇 중지
Ctrl+C

# 패키지 설치 확인
npm install

# 봇 재시작
npm run dev
```

### 2. Slack App 설정 확인

1. [api.slack.com](https://api.slack.com) 접속
2. 앱 선택 → "Socket Mode" 확인
3. "Event Subscriptions" → Socket Mode 사용 확인
4. "Slash Commands" → 명령어 목록 확인

### 3. 토큰 확인

`.env` 파일의 토큰이 올바른지 확인:
- `SLACK_BOT_TOKEN`: xoxb-로 시작
- `SLACK_APP_TOKEN`: xapp-로 시작
- `SLACK_SIGNING_SECRET`: 32자리 문자열

### 4. 봇 권한 확인

OAuth & Permissions에서 다음 scopes 확인:
- `chat:write`
- `commands`
- `im:history`
- `channels:history`

### 5. 로그 확인

봇 실행 시 콘솔에서:
- "[/bot-restaurant] Command received" 메시지 확인
- 에러 메시지 확인

### 6. 간단한 테스트

먼저 간단한 명령어로 테스트:
```
/bot-list
```

이 명령어가 작동하면 봇은 정상이고, Google Maps 스크래핑 문제일 가능성이 높습니다.

### 7. Puppeteer 문제 해결

macOS에서 Puppeteer 관련 문제가 있을 경우:
```bash
# Chrome 설치 확인
brew install --cask google-chrome

# Puppeteer 재설치
npm uninstall puppeteer
npm install puppeteer
```

### 8. 임시 해결책

Google Maps 스크래핑이 문제라면, 먼저 일반 게시글 작성으로 테스트:
```
/bot-post bot1 오늘 점심 추천 맛집
```
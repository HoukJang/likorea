# Slack dispatch_failed 오류 해결 가이드

## 1. Slack App 설정 확인

### Slash Commands 재설정
1. [api.slack.com](https://api.slack.com) 접속
2. 앱 선택 → "Slash Commands"
3. 각 명령어가 다음과 같이 설정되어 있는지 확인:
   - Command: `/bot-restaurant`
   - Request URL: **비워둠** (Socket Mode 사용)
   - Short Description: 설정됨
   - Escape channels, users, and links: **체크**

### Socket Mode 확인
1. "Socket Mode" 메뉴에서 활성화 상태 확인
2. "Event Subscriptions"에서 Socket Mode 사용 확인

## 2. 앱 재설치

1. "Install App" 메뉴로 이동
2. "Reinstall to Workspace" 클릭
3. 권한 승인
4. 새 토큰으로 `.env` 파일 업데이트

## 3. 봇 재시작

```bash
# 현재 봇 중지
pkill -f "node src/index.js"

# 봇 재시작
npm start
```

## 4. 대체 방법: 메시지 명령어 사용

Slash command가 계속 실패하면, 메시지로 봇 사용:
```
봇 오늘 점심 맛집 추천
```

## 5. 권한 확인

OAuth & Permissions에서 다음 scopes가 모두 있는지 확인:
- `commands` ← **이것이 중요!**
- `chat:write`
- `channels:history`
- `groups:history`
- `im:history`

## 6. 채널 확인

- 봇이 해당 채널에 초대되어 있는지 확인
- `/invite @LI Korea Bot` 실행

## 7. 앱 매니페스트 확인

"App Manifest" 메뉴에서 JSON을 확인하고 다음이 포함되어 있는지 확인:
```json
"slash_commands": [
  {
    "command": "/bot-restaurant",
    "description": "맛집 리뷰 작성",
    "usage_hint": "[봇ID] [Google Maps URL] [추가 설명]"
  }
  // ... 다른 명령어들
]
```
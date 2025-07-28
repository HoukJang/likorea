# 최종 체크리스트

## Slack App 설정 확인

### 1. Event Subscriptions
- "Event Subscriptions" 메뉴로 이동
- "Enable Events" 토글이 **ON**인지 확인
- Request URL에 아무것도 없어야 함 (Socket Mode 사용)
- "Subscribe to bot events"에 다음이 있는지 확인:
  - `slash_commands` (중요!)
  - `message.channels`
  - `message.groups`
  - `message.im`

### 2. Interactivity & Shortcuts
- "Interactivity & Shortcuts" 메뉴로 이동
- "Interactivity" 토글이 **ON**인지 확인
- Request URL 비워둠 (Socket Mode 사용)

### 3. 권한 재확인
OAuth & Permissions에서:
- Bot Token Scopes에 `commands` 있는지 확인

### 4. 봇 채널 초대
Slack 채널에서:
```
/invite @LI Korea Bot
```

### 5. 간단한 테스트
DM으로 봇에게 직접 명령어 실행:
1. 봇과 DM 열기
2. `/bot-list` 입력

## 문제 지속 시

### App Manifest로 재생성
1. "App Manifest" 메뉴
2. 아래 JSON 복사 후 저장:

```json
{
  "display_information": {
    "name": "LI Korea Bot"
  },
  "features": {
    "bot_user": {
      "display_name": "LI Korea Bot",
      "always_online": true
    },
    "slash_commands": [
      {
        "command": "/bot-post",
        "description": "봇으로 게시글 작성",
        "usage_hint": "[봇ID] [작업 내용]"
      },
      {
        "command": "/bot-restaurant",
        "description": "맛집 리뷰 작성",
        "usage_hint": "[봇ID] [Google Maps URL] [추가 설명]"
      },
      {
        "command": "/bot-list",
        "description": "활성화된 봇 목록"
      },
      {
        "command": "/bot-status",
        "description": "봇 상태 확인",
        "usage_hint": "[봇ID]"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "chat:write",
        "commands",
        "im:history",
        "im:write",
        "channels:history",
        "groups:history",
        "mpim:history",
        "app_mentions:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "bot_events": [
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "app_mention"
      ]
    },
    "interactivity": {
      "is_enabled": true
    },
    "org_deploy_enabled": false,
    "socket_mode_enabled": true
  }
}
```

3. 저장 후 앱 재설치
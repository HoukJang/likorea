# Slack Bot 설정 가이드

## 1. Slack App 생성

1. [api.slack.com](https://api.slack.com) 접속
2. "Create New App" 클릭
3. "From scratch" 선택
4. App 이름: "LI Korea Bot"
5. Workspace 선택

## 2. Socket Mode 활성화

1. 좌측 메뉴에서 "Socket Mode" 클릭
2. "Enable Socket Mode" 토글 ON
3. App-Level Token 생성:
   - Token Name: "websocket"
   - Scope 추가: `connections:write`
   - "Generate" 클릭
   - 생성된 토큰을 `SLACK_APP_TOKEN`으로 저장

## 3. OAuth & Permissions 설정

좌측 메뉴에서 "OAuth & Permissions" 클릭

### Bot Token Scopes 추가:
- `chat:write` - 메시지 전송
- `commands` - 슬래시 커맨드 사용
- `im:history` - DM 메시지 읽기
- `im:write` - DM 메시지 전송
- `channels:history` - 채널 메시지 읽기
- `groups:history` - 프라이빗 채널 메시지 읽기
- `mpim:history` - 그룹 DM 메시지 읽기
- `app_mentions:read` - 멘션 읽기

### User Token Scopes (선택사항):
- `chat:write` - 사용자로서 메시지 전송

## 4. Event Subscriptions 설정

1. 좌측 메뉴에서 "Event Subscriptions" 클릭
2. "Enable Events" 토글 ON
3. Subscribe to bot events:
   - `message.channels` - 채널 메시지
   - `message.groups` - 프라이빗 채널 메시지
   - `message.im` - DM 메시지
   - `message.mpim` - 그룹 DM 메시지
   - `app_mention` - 봇 멘션

## 5. Slash Commands 설정

좌측 메뉴에서 "Slash Commands" 클릭하고 다음 명령어 추가:

### /bot-post
- Command: `/bot-post`
- Request URL: Socket Mode 사용 시 비워둠
- Short Description: "봇으로 게시글 작성"
- Usage Hint: "[봇ID] [작업 내용]"

### /bot-restaurant
- Command: `/bot-restaurant`
- Request URL: Socket Mode 사용 시 비워둠
- Short Description: "맛집 리뷰 작성"
- Usage Hint: "[봇ID] [Google Maps URL] [추가 설명]"

### /bot-list
- Command: `/bot-list`
- Request URL: Socket Mode 사용 시 비워둠
- Short Description: "활성화된 봇 목록"
- Usage Hint: 비워둠

### /bot-status
- Command: `/bot-status`
- Request URL: Socket Mode 사용 시 비워둠
- Short Description: "봇 상태 확인"
- Usage Hint: "[봇ID]"

## 6. App 설치

1. 좌측 메뉴에서 "Install App" 클릭
2. "Install to Workspace" 클릭
3. 권한 승인
4. 생성된 토큰 복사:
   - `Bot User OAuth Token` → `SLACK_BOT_TOKEN`
   - `Signing Secret` (Basic Information에서) → `SLACK_SIGNING_SECRET`

## 7. 환경변수 설정

`.env` 파일에 토큰 추가:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token
```

## 8. 봇 초대

사용할 채널에 봇 초대:
1. 채널에서 `/invite @LI Korea Bot` 입력
2. 또는 채널 설정 → Integrations → Add apps

## 트러블슈팅

### 봇이 응답하지 않을 때:
1. Socket Mode가 활성화되어 있는지 확인
2. App-Level Token이 올바른지 확인
3. 봇이 채널에 초대되어 있는지 확인
4. Event Subscriptions가 올바르게 설정되어 있는지 확인

### 권한 오류가 발생할 때:
1. OAuth Scopes가 모두 추가되어 있는지 확인
2. App을 재설치 (Reinstall App)
3. 새로운 토큰으로 환경변수 업데이트
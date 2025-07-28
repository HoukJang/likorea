# Slack App 설정 수정 가이드

## 1. App Home 활성화 (DM 활성화)

api.slack.com에서:

1. **"App Home" 메뉴로 이동**
2. 다음 설정 확인:
   - **"Allow users to send Slash commands and messages from the messages tab"** → ✅ 체크
   - **"Messages Tab"** → Show Tab 활성화

## 2. Event Subscriptions 재확인

"Event Subscriptions" 메뉴에서:

### Subscribe to bot events에 다음 추가:
- `app_home_opened`
- `message.im` (이미 있을 것)
- `im_created`

## 3. 앱 재설치 (중요!)

설정 변경 후:
1. "Install App" → "Reinstall to Workspace"
2. 권한 승인

## 4. 채널에서 직접 테스트

DM 대신 채널에서:
1. 봇이 있는 채널에서 `/bot-list` 입력
2. 작동하지 않으면 다음 단계로

## 5. Socket Mode 재연결

봇 재시작:
```bash
# 현재 봇 중지
pkill -f "node src/index.js"

# 재시작
cd /Users/houkjang/likorea/bots
npm start
```

## 6. 디버그 - 실시간 로그 확인

새 터미널에서:
```bash
tail -f debug.log | grep -i "slash_command"
```

그리고 Slack에서 `/bot-list` 실행하여 로그 확인

## 7. 마지막 방법 - 새 앱 생성

위 방법이 모두 실패하면:
1. 새 Slack App 생성
2. Socket Mode 먼저 활성화
3. Slash Commands 추가
4. 필요한 권한 설정
5. 설치

## 문제의 핵심

`dispatch_failed`는 보통:
- Slack이 봇에게 이벤트를 전달하지 못함
- Socket Mode 연결은 되었지만 slash command 이벤트가 안 옴
- App Home/Messages Tab 설정 문제일 가능성 높음
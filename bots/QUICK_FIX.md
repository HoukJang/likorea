# dispatch_failed 빠른 해결 방법

## 1. Slash Commands 확인 (가장 중요!)

api.slack.com에서:
1. 앱 선택 → "Slash Commands"
2. 명령어 목록에 다음이 있는지 확인:
   - `/bot-post`
   - `/bot-restaurant`
   - `/bot-list`
   - `/bot-status`

**만약 없다면:**
1. "Create New Command" 클릭
2. 다음과 같이 입력:
   - Command: `/bot-restaurant`
   - Request URL: **비워둠** (중요!)
   - Short Description: 맛집 리뷰 작성
   - Usage Hint: [봇ID] [Google Maps URL] [추가 설명]
3. "Save" 클릭

## 2. 앱 재설치 (명령어 추가 후)

1. "Install App" 메뉴
2. "Reinstall to Workspace"
3. 권한 승인

## 3. 봇 재시작

```bash
# 현재 실행 중인 봇 중지
pkill -f "node src/index.js"

# 다시 시작
cd /Users/houkjang/likorea/bots
npm start
```

## 4. 테스트

Slack에서:
```
/bot-list
```

이 명령어가 작동하면 다른 명령어도 작동할 것입니다.

## 주의사항

- Socket Mode 사용 시 Request URL은 반드시 **비워둬야** 합니다
- 명령어 추가 후 반드시 앱을 **재설치**해야 합니다
- Distribution status가 "Not distributed"는 정상입니다
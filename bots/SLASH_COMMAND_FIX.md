# Slash Command 최종 해결 방법

## 문제 진단
- Socket Mode ✅ 작동 중
- 메시지 이벤트 ✅ 수신 중  
- Slash commands ❌ 전달 안 됨

## 해결 방법

### 1. App Manifest 확인 및 수정

api.slack.com에서:
1. "App Manifest" 메뉴로 이동
2. YAML 또는 JSON 편집 모드로 전환
3. `settings.interactivity.is_enabled: true` 확인
4. `settings.socket_mode_enabled: true` 확인
5. **중요**: `features.slash_commands` 섹션이 있는지 확인

### 2. Interactivity & Shortcuts 재설정

1. "Interactivity & Shortcuts" 메뉴
2. Interactivity 토글 OFF → ON (다시 켜기)
3. "Save Changes"

### 3. Slash Commands 재생성

1. "Slash Commands" 메뉴
2. 기존 명령어 모두 삭제
3. 다시 생성:
   - Command: `/bot-list`
   - Request URL: (비워둠)
   - Short Description: 봇 목록
   - Save

### 4. 앱 완전 재설치

1. "Install App" → "Reinstall to Workspace"
2. **모든 권한 체크박스 확인**
3. "Allow"

### 5. 봇 재시작

```bash
pkill -f "node src/index.js"
npm start
```

## 임시 해결책

Slash command가 계속 안 되면 메시지 명령어 사용:
- `봇 [명령어]` 형식으로 사용
- 예: `봇 맛집 추천해줘`
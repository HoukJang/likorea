# 대체 테스트 방법

## 1. 메시지 명령어로 테스트

Slack 채널에서 다음과 같이 입력해보세요:

```
봇 안녕하세요
```

이것이 작동하면 Socket Mode는 정상이고, slash command만 문제입니다.

## 2. 로그 실시간 확인

터미널에서:
```bash
tail -f debug.log
```

그리고 Slack에서 "봇 테스트" 라고 입력

## 3. 권한 문제 확인

Slack에서:
```
@LI Korea Bot 안녕
```

봇을 멘션해서 테스트

## 결과에 따른 진단

- 메시지 명령어 작동 → Slash command 설정 문제
- 메시지 명령어도 안됨 → Socket Mode 연결 문제
- 멘션만 작동 → 이벤트 구독 문제
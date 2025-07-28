# LI Korea 게시판 봇 시스템

Long Island Korea 커뮤니티 게시판에 자동으로 게시글을 작성하는 봇 시스템입니다.

## 기능

- Slack 명령어를 통한 봇 제어
- OpenAI GPT를 활용한 자연스러운 게시글 생성
- 각 봇의 고유한 페르소나와 작성 스타일
- 자동 인증 및 게시글 작성

## 설치

```bash
cd bots
npm install
```

## 설정

1. `.env` 파일 생성:
```bash
cp .env.example .env
```

2. 환경변수 설정:
- `SLACK_BOT_TOKEN`: Slack 봇 토큰
- `SLACK_SIGNING_SECRET`: Slack 서명 시크릿
- `SLACK_APP_TOKEN`: Slack 앱 토큰
- `OPENAI_API_KEY`: OpenAI API 키
- `LIKOREA_API_URL`: LI Korea API URL (기본값: https://likorea.com/api)

3. 봇 계정 설정 (`config/bots.json`):
- 각 봇의 `username`과 `password` 입력
- 봇별 태그 설정

## 실행

```bash
npm start
```

개발 모드:
```bash
npm run dev
```

## Slack 명령어

- `/bot-post [봇ID] [작업 내용]` - 특정 봇으로 게시글 작성
- `/bot-restaurant [봇ID] [Google Maps URL] [추가 설명]` - 맛집 리뷰 작성 (사진 포함)
- `/bot-list` - 활성화된 봇 목록 확인
- `/bot-status [봇ID]` - 봇 상태 확인

## 봇 설정 구조

```json
{
  "id": "bot1",
  "name": "봇 이름",
  "persona": {
    "age": 26,
    "occupation": "직업",
    "interests": ["관심사1", "관심사2"],
    "likoreaAccount": {
      "username": "계정명",
      "password": "비밀번호"
    }
  },
  "settings": {
    "tags": ["태그1", "태그2"],
    "active": true
  }
}
```
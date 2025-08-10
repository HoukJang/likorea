# 프로덕션 로그아웃 문제 해결 가이드

## 문제 설명
프로덕션 환경에서 로그아웃 후에도 다시 접속하면 로그인이 유지되는 문제

## 원인 분석

### 1. **쿠키 삭제 시 속성 불일치**
- 로그인 시 쿠키 설정과 로그아웃 시 쿠키 삭제의 속성이 일치하지 않음
- 특히 `path`와 `domain` 속성이 누락되어 쿠키가 제대로 삭제되지 않음

### 2. **현재 문제 코드**
```javascript
// 로그인 시 (path 없음)
res.cookie('authToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000
});

// 로그아웃 시 (path 없음)
res.clearCookie('authToken', {
  httpOnly: true,
  secure: true,
  sameSite: 'lax'
});
```

## 해결 방안

### 1. **백엔드 수정 사항** ✅ (완료)

**userController.js 수정**:
- 로그인과 로그아웃 시 동일한 쿠키 속성 사용
- `path: '/'` 명시적 설정
- 프로덕션에서 `domain` 설정 추가

### 2. **환경 변수 설정** (필요)

프로덕션 서버의 `.env` 파일에 추가:
```bash
# 쿠키 도메인 설정 (서브도메인 포함)
COOKIE_DOMAIN=.likorea.com
```

### 3. **프론트엔드 개선** (선택사항)

**더 확실한 로그아웃을 위한 추가 조치**:
```javascript
// frontend/src/api/auth.js
export const logout = async () => {
  try {
    await apiClient.post('/api/users/logout');
  } catch (error) {
    // 서버 에러여도 클라이언트 정리는 계속
  }

  // 로컬 상태 정리
  localStorage.clear();
  sessionStorage.clear();
  
  // 강제 리다이렉트 (캐시 무시)
  window.location.href = '/login?logout=true';
};
```

## 테스트 방법

### 개발 환경
1. 로그인 → 개발자 도구에서 쿠키 확인
2. 로그아웃 → 쿠키가 삭제되는지 확인
3. 페이지 새로고침 → 로그인 상태가 유지되지 않는지 확인

### 프로덕션 환경
1. https://likorea.com 에서 로그인
2. 개발자 도구 → Application → Cookies 확인
   - `authToken` 쿠키의 Domain, Path 확인
3. 로그아웃 실행
4. 쿠키가 완전히 삭제되었는지 확인
5. 브라우저 완전히 새로고침 (Ctrl+F5)
6. 로그인 상태가 유지되지 않는지 확인

## 추가 보안 강화 (선택사항)

### 1. **서버측 토큰 블랙리스트**
```javascript
// Redis 또는 메모리에 로그아웃된 토큰 저장
const blacklistedTokens = new Set();

exports.logout = async (req, res) => {
  const token = req.cookies?.authToken;
  if (token) {
    blacklistedTokens.add(token);
    // 토큰 만료 시간 후 자동 제거
    setTimeout(() => blacklistedTokens.delete(token), 24 * 60 * 60 * 1000);
  }
  // ... 쿠키 삭제 로직
};
```

### 2. **인증 미들웨어에서 블랙리스트 확인**
```javascript
if (blacklistedTokens.has(token)) {
  return next(new AuthenticationError('토큰이 무효화되었습니다.'));
}
```

## 배포 체크리스트

- [x] userController.js 수정 (path, domain 설정 추가)
- [ ] 프로덕션 .env에 COOKIE_DOMAIN 추가
- [ ] 프로덕션 배포
- [ ] 로그아웃 테스트
- [ ] 서브도메인 간 테스트 (www.likorea.com ↔ likorea.com)
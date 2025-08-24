# Button Component Usage Guide

## 새로운 버튼 시스템

완전히 새롭게 디자인된 버튼 컴포넌트입니다.

### 기본 사용법
```jsx
import Button from './components/ui/Button';

// Primary button
<Button variant="primary" onClick={handleClick}>
  회원가입
</Button>

// Ghost button
<Button variant="ghost" onClick={handleClick}>
  로그인
</Button>
```

### Props
- `variant`: 'primary' | 'secondary' | 'ghost' | 'text' | 'danger'
- `size`: 'small' | 'medium' | 'large'
- `loading`: boolean
- `disabled`: boolean
- `fullWidth`: boolean
- `icon`: ReactNode
- `iconPosition`: 'left' | 'right'

### 디자인 특징
- **미니멀 디자인**: 깔끔하고 현대적인 스타일
- **부드러운 전환**: cubic-bezier 애니메이션
- **접근성**: 완벽한 키보드 네비게이션 및 ARIA 지원
- **반응형**: 모바일 최적화
- **다크 모드**: 자동 다크 모드 지원

### 색상 팔레트
- Primary: #0047A0 (태극기 파란색)
- Secondary: 흰색 배경 + 테두리
- Ghost: 투명 배경
- Text: 텍스트만
- Danger: #dc2626

### 데모 페이지
http://localhost:3001/button-demo 에서 모든 버튼 변형을 확인할 수 있습니다.
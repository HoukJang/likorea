# 코딩 스타일 가이드

이 문서는 프로젝트의 코딩 스타일 가이드라인을 정의합니다. 새로 작성하거나 수정하는 코드에 점진적으로 적용합니다.

## 일반 원칙

### SOLID 원칙
- **S** (Single Responsibility Principle): 각 클래스/컴포넌트는 단 하나의 책임만 가져야 합니다.
- **O** (Open/Closed Principle): 클래스는 확장에는 열려 있고 수정에는 닫혀 있어야 합니다.
- **L** (Liskov Substitution Principle): 부모 클래스 대신 자식 클래스를 사용해도 프로그램의 동작에 문제가 없어야 합니다.
- **I** (Interface Segregation Principle): 클라이언트는 사용하지 않는 메서드에 의존하지 않아야 합니다.
- **D** (Dependency Inversion Principle): 구체적인 클래스가 아닌 추상화된 클래스나 인터페이스에 의존해야 합니다.

## JavaScript/TypeScript 스타일 가이드

### 들여쓰기
- 2 스페이스 사용
- 탭 사용 금지

### 세미콜론
- 세미콜론 사용

### 따옴표
- 문자열은 작은따옴표(') 사용
- JSX 속성은 큰따옴표(") 사용

### 줄 길이
- 최대 120자

### 함수
```javascript
// Good
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Good - 화살표 함수
const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};
```

### 변수 선언
- `const`를 기본으로 사용
- 재할당이 필요한 경우에만 `let` 사용
- `var` 사용 금지

### 객체와 배열
```javascript
// Good
const user = {
  name: 'John',
  age: 30,
  email: 'john@example.com'
};

// Good
const items = [
  'apple',
  'banana',
  'orange'
];
```

### 조건문
```javascript
// Good
if (condition) {
  doSomething();
} else {
  doSomethingElse();
}

// Good - 단순 조건
const result = condition ? value1 : value2;
```

## React/JSX 스타일 가이드

### 컴포넌트 구조
```jsx
// Good
function UserProfile({ user }) {
  const { name, email } = user;

  return (
    <div className="user-profile">
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
}
```

### Props
- 비구조화 할당 사용
- PropTypes 또는 TypeScript 인터페이스로 타입 정의

### 이벤트 핸들러
```jsx
// Good
function Button({ onClick, children }) {
  const handleClick = (e) => {
    e.preventDefault();
    onClick();
  };

  return (
    <button onClick={handleClick}>
      {children}
    </button>
  );
}
```

## CSS/스타일링

### 클래스명
- kebab-case 사용
- BEM 방법론 권장

```css
/* Good */
.user-profile {
  padding: 20px;
}

.user-profile__header {
  margin-bottom: 10px;
}

.user-profile__header--active {
  color: blue;
}
```

## 파일 및 폴더 구조

### 파일명
- 컴포넌트: PascalCase (예: `UserProfile.jsx`)
- 유틸리티/헬퍼: camelCase (예: `formatDate.js`)
- 스타일: kebab-case (예: `user-profile.css`)

### 폴더 구조
```
src/
  components/
    common/
    features/
  hooks/
  services/
  utils/
  styles/
```

## 커밋 메시지

### 형식
```
<타입>: <제목>

<본문>
```

### 타입
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 업무, 패키지 매니저 설정 등

### 예시
```
feat: 사용자 프로필 컴포넌트 추가

- 사용자 정보 표시 기능 구현
- 프로필 이미지 업로드 기능 추가
```

## 점진적 적용 방안

1. **새 파일**: 이 가이드라인을 완전히 준수
2. **기존 파일 수정**: 수정하는 부분만 가이드라인 적용
3. **대규모 리팩토링**: 별도 PR로 진행
4. **코드 리뷰**: 새 코드가 가이드라인을 따르는지 확인

## 참고사항

- 이 가이드는 프로젝트의 요구사항에 따라 업데이트될 수 있습니다
- 기존 코드를 대규모로 수정하지 않고 점진적으로 개선합니다
- 팀원들과 논의하여 필요시 가이드라인을 조정합니다
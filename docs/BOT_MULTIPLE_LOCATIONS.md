# 다중 지역 뉴스 크롤링 기능

## 개요
뉴스봇이 여러 지역의 뉴스를 동시에 크롤링할 수 있도록 업데이트되었습니다. 사용자가 `/`로 구분하여 여러 지역을 입력하면, 각 지역에 대한 뉴스를 모두 수집하여 종합적으로 요약합니다.

## 사용 방법

### 단일 지역
```
Great Neck
```
- Great Neck 지역의 뉴스만 크롤링

### 여러 지역
```
Great Neck/Flushing/Manhasset
```
- Great Neck, Flushing, Manhasset 세 지역의 뉴스를 모두 크롤링
- `/`로 지역명을 구분
- 공백은 자동으로 처리됨 (예: `Great Neck / Flushing` → `Great Neck`, `Flushing`)

### 기본값
- 지역을 입력하지 않으면 Long Island 전체 뉴스 크롤링

## 구현 상세

### 1. Frontend (BotList.jsx)
- TextField 헬퍼 텍스트에 여러 지역 입력 가능함을 안내
- placeholder 예시 업데이트

### 2. Backend 처리 과정

#### botRoutes.js
```javascript
// "/" 로 구분된 여러 지역 파싱
targetLocations = cleanTask.split('/').map(loc => loc.trim()).filter(loc => loc);
```

#### rssFeedService.js
```javascript
// 지역 배열을 받아 각 지역별 RSS 피드 생성
setLocationFeeds(locations) {
  const locationArray = Array.isArray(locations) ? locations : [locations];
  // 각 지역별로 4개씩 피드 생성 (영어, 한국어, 비즈니스, 교육)
}
```

#### newsAggregatorService.js
```javascript
// 여러 지역의 뉴스를 하나로 집계
async aggregateWeeklyNews(locations) {
  const targetLocations = validLocations.length > 0 ? validLocations : ['Long Island'];
  // 모든 지역의 뉴스를 수집하여 중요도 점수로 정렬
}
```

## RSS 피드 구조

각 지역당 생성되는 피드:
1. **일반 뉴스**: `Google News - [지역명]`
2. **한인 뉴스**: `Google News - [지역명] 한인`
3. **비즈니스 뉴스**: `Google News - [지역명] Business`
4. **교육 뉴스**: `Google News - [지역명] School`

### 예시: Great Neck/Flushing 입력 시
- Great Neck (4개 피드)
- Flushing (4개 피드)
- 기본 Long Island 피드 (4개)
- **총 12개 피드**에서 뉴스 수집

## 캐싱 전략

- 캐시 키: `weekly_[지역1]_[지역2]_[날짜]`
- TTL: 1시간
- 동일한 지역 조합은 캐시 재사용

## 테스트

### 테스트 스크립트 실행
```bash
# 기본 테스트 (실제 크롤링 없이)
node scripts/testMultipleLocations.js

# 실제 크롤링 테스트
node scripts/testMultipleLocations.js --real
```

### 테스트 케이스
1. 단일 지역: `Great Neck`
2. 여러 지역: `Great Neck/Flushing/Manhasset`
3. 공백 포함: ` Great Neck / Flushing `
4. 빈 문자열: `` (기본값 Long Island)
5. 배열 직접 전달: `['Great Neck', 'Flushing']`

## 장점

1. **포괄적 정보 수집**: 여러 지역의 뉴스를 한 번에 수집하여 종합적인 정보 제공
2. **유연한 입력**: 단일 지역 또는 여러 지역 모두 지원
3. **효율적 캐싱**: 동일한 지역 조합은 캐시 활용
4. **자동 중복 제거**: 여러 피드에서 중복된 뉴스 자동 필터링
5. **우선순위 정렬**: 중요도 점수 기반으로 가장 관련성 높은 뉴스 선택

## 주의사항

- 너무 많은 지역을 입력하면 크롤링 시간이 길어질 수 있음
- 각 지역당 4개의 RSS 피드가 생성되므로 네트워크 부하 고려 필요
- 지역명은 정확한 영문 표기 사용 권장 (예: Flushing, Great Neck)
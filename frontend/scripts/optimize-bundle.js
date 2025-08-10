/**
 * JavaScript 번들 최적화 스크립트
 * - 동적 import 최적화
 * - Tree shaking 개선
 * - 사용하지 않는 코드 제거
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob').sync;

// 최적화할 라이브러리 목록
const OPTIMIZATION_TARGETS = {
  'dompurify': {
    description: 'HTML sanitization library',
    usage: ['BoardPostForm', 'PendingPosts'],
    optimization: 'dynamic-import'
  },
  '@mui/material': {
    description: 'Material-UI components',
    usage: ['Admin', 'BotManagement'],
    optimization: 'named-imports'
  },
  'chart.js': {
    description: 'Chart library',
    usage: ['TrafficDashboard'],
    optimization: 'already-lazy'
  }
};

async function analyzeBundleUsage() {
  console.log('📊 번들 사용 분석 시작...\n');

  // 1. 현재 import 패턴 분석
  const srcFiles = glob(path.join(__dirname, '../src/**/*.{js,jsx}'));
  const importPatterns = new Map();

  for (const file of srcFiles) {
    const content = await fs.readFile(file, 'utf-8');
    const imports = content.match(/import .* from ['"]([^'"]+)['"]/g) || [];
    
    imports.forEach(imp => {
      const match = imp.match(/from ['"]([^'"]+)['"]/);
      if (match) {
        const lib = match[1];
        if (!importPatterns.has(lib)) {
          importPatterns.set(lib, []);
        }
        importPatterns.get(lib).push(path.relative(path.join(__dirname, '../src'), file));
      }
    });
  }

  // 2. 최적화 가능한 항목 찾기
  console.log('🔍 최적화 가능한 import 발견:\n');
  
  for (const [lib, target] of Object.entries(OPTIMIZATION_TARGETS)) {
    const files = importPatterns.get(lib) || [];
    if (files.length > 0) {
      console.log(`📦 ${lib}`);
      console.log(`   설명: ${target.description}`);
      console.log(`   사용 위치: ${files.join(', ')}`);
      console.log(`   권장 최적화: ${target.optimization}`);
      console.log('');
    }
  }

  // 3. 최적화 제안 생성
  await generateOptimizationSuggestions();
}

async function generateOptimizationSuggestions() {
  console.log('\n💡 최적화 제안:\n');

  const suggestions = `
# JavaScript 번들 최적화 가이드

## 1. DOMPurify 동적 import 전환

BoardPostForm.jsx와 PendingPosts.jsx에서:

\`\`\`javascript
// 기존 코드
import DOMPurify from 'dompurify';

// 최적화된 코드
let DOMPurify;
const loadDOMPurify = async () => {
  if (!DOMPurify) {
    const module = await import('dompurify');
    DOMPurify = module.default;
  }
  return DOMPurify;
};

// 사용 시
const sanitizeContent = async (content) => {
  const purify = await loadDOMPurify();
  return purify.sanitize(content, domPurifyConfig);
};
\`\`\`

## 2. MUI 개별 import 최적화

\`\`\`javascript
// 기존 코드
import { Button, TextField, Dialog } from '@mui/material';

// 최적화된 코드
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
\`\`\`

## 3. 사용하지 않는 라이브러리 제거

package.json에서 확인 후 제거:
- browser-image-compression의 UPNG/UZIP는 이미 동적 import로 최적화됨
- @kurkle/color는 Chart.js의 의존성이므로 제거 불가

## 4. React 최적화

\`\`\`javascript
// React.memo 활용
export default React.memo(ComponentName, (prevProps, nextProps) => {
  // props 비교 로직
  return prevProps.id === nextProps.id;
});

// useMemo와 useCallback 활용
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
const memoizedCallback = useCallback(() => doSomething(a, b), [a, b]);
\`\`\`

## 5. 코드 분할 추가 개선

\`\`\`javascript
// 라우트 기반 코드 분할은 이미 적용됨
// 컴포넌트 레벨 코드 분할 추가
const HeavyComponent = lazy(() => 
  import(/* webpackChunkName: "heavy" */ './HeavyComponent')
);
\`\`\`

## 예상 효과
- 초기 번들 크기: 약 100-150KB 감소
- FCP: 1-2초 단축
- 사용자 체감 성능 향상
`;

  await fs.writeFile(
    path.join(__dirname, '../docs/bundle-optimization-guide.md'),
    suggestions
  );

  console.log('📝 최적화 가이드가 생성되었습니다: docs/bundle-optimization-guide.md');
}

// 실행
analyzeBundleUsage().catch(console.error);
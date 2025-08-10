/**
 * CSS 최적화 스크립트
 * - 사용하지 않는 CSS 제거
 * - Critical CSS 추출
 * - CSS 분할
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob').sync;
const { PurgeCSS } = require('purgecss');

async function optimizeCSS() {
  console.log('🎨 CSS 최적화 시작...\n');

  // 1. 현재 CSS 파일 분석
  const cssFiles = glob(path.join(__dirname, '../src/**/*.css'));
  let totalSize = 0;

  for (const file of cssFiles) {
    const stats = await fs.stat(file);
    totalSize += stats.size;
    console.log(`📁 ${path.basename(file)}: ${(stats.size / 1024).toFixed(2)} KB`);
  }
  console.log(`\n📊 총 CSS 크기: ${(totalSize / 1024).toFixed(2)} KB\n`);

  // 2. PurgeCSS 설정 생성
  const purgecssConfig = {
    paths: ['../purgecss.config.js'],
    content: `
// PurgeCSS 설정
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html'
  ],
  css: ['./src/**/*.css'],
  defaultExtractor: content => {
    // 클래스명 추출 개선
    const broadMatches = content.match(/[^<>"'\`\\s]*[^<>"'\`\\s:]/g) || [];
    const innerMatches = content.match(/[^<>"'\`\\s.()]*[^<>"'\`\\s.():]/g) || [];
    return broadMatches.concat(innerMatches);
  },
  safelist: {
    standard: [
      // React 관련
      /^root/,
      /^App/,
      
      // MUI 관련
      /^Mui/,
      /^MuiButton/,
      /^MuiDialog/,
      /^MuiTextField/,
      
      // Quill 에디터
      /^ql-/,
      /^quill/,
      
      // 애니메이션
      /fade/,
      /slide/,
      /zoom/,
      
      // 상태 클래스
      /active/,
      /disabled/,
      /selected/,
      /hover/,
      /focus/,
      /error/,
      /success/,
      /warning/,
      
      // 레이아웃
      /container/,
      /row/,
      /col/,
      /grid/,
      
      // 동적 클래스
      /^banner/,
      /^header/,
      /^footer/,
      /^nav/,
      /^board/,
      /^admin/,
      /^loading/,
      /^skeleton/
    ],
    deep: [
      // 자식 선택자 보호
      /children/,
      /icon/
    ],
    greedy: [
      // 부분 매칭
      /btn/,
      /card/,
      /form/,
      /input/,
      /modal/,
      /table/
    ]
  },
  // 폰트 관련 규칙 보호
  fontFace: true,
  keyframes: true,
  variables: true
};
`;
  };

  await fs.writeFile(
    path.join(__dirname, '../purgecss.config.js'),
    purgecssConfig.content
  );

  // 3. Critical CSS 추출을 위한 설정
  const criticalCSSConfig = `
/**
 * Critical CSS 추출 가이드
 * 
 * 1. Above-the-fold 콘텐츠 식별:
 *    - Header/Navigation
 *    - Banner
 *    - 초기 로딩 상태
 *    - 첫 화면에 보이는 콘텐츠
 * 
 * 2. 추출할 CSS 규칙:
 *    - 레이아웃 (display, position, grid, flex)
 *    - 타이포그래피 (font, text)
 *    - 기본 색상 (color, background)
 *    - 필수 spacing (margin, padding)
 * 
 * 3. 인라인할 CSS 크기: 최대 14KB
 * 
 * 4. 구현 방법:
 *    - critical 패키지 사용
 *    - 수동으로 critical.css 생성
 *    - 빌드 시 index.html에 인라인
 */

// Critical CSS 예시
const criticalCSS = \`
/* Reset & Base */
* { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; -webkit-text-size-adjust: 100%; }
body { 
  margin: 0; 
  font-family: 'Pretendard', -apple-system, sans-serif;
  line-height: 1.5;
  background: #fff;
  color: #333;
}

/* Layout */
#root { min-height: 100vh; display: flex; flex-direction: column; }
.App { min-height: 100vh; display: flex; flex-direction: column; }

/* Header Critical */
header { background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: relative; z-index: 1000; }

/* Banner Critical */
.banner { width: 100%; overflow: hidden; position: relative; background: #f5f5f5; min-height: 89px; }
.banner-image { width: 100%; height: auto; display: block; object-fit: cover; }

/* Loading State */
.loading { display: flex; justify-content: center; align-items: center; min-height: 200px; }

/* Navigation */
nav { background: #fff; border-bottom: 1px solid #e0e0e0; position: sticky; top: 0; z-index: 100; }
nav ul { list-style: none; display: flex; gap: 1rem; justify-content: center; }
nav a { color: #333; text-decoration: none; padding: 0.5rem 1rem; }

/* Container */
.container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 20px; }

/* Main */
main { flex: 1; padding: 20px 0; }

/* Mobile */
@media (max-width: 768px) {
  .container { padding: 0 15px; }
  .banner { min-height: 60px; }
}
\`;
`;

  await fs.writeFile(
    path.join(__dirname, '../docs/critical-css-guide.md'),
    criticalCSSConfig
  );

  console.log('\n✅ CSS 최적화 설정 완료!');
  console.log('\n📝 생성된 파일:');
  console.log('- purgecss.config.js (PurgeCSS 설정)');
  console.log('- docs/critical-css-guide.md (Critical CSS 가이드)');
  
  console.log('\n🔧 다음 단계:');
  console.log('1. npm install --save-dev purgecss @fullhuman/postcss-purgecss');
  console.log('2. craco.config.js에 PostCSS 플러그인 추가');
  console.log('3. 빌드 후 CSS 크기 확인');
  
  console.log('\n💡 예상 효과:');
  console.log('- CSS 크기 60-80% 감소');
  console.log('- 초기 로딩 시간 단축');
  console.log('- 렌더 차단 시간 감소');
}

optimizeCSS().catch(console.error);
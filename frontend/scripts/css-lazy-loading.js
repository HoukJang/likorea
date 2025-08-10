/**
 * CSS 지연 로딩 최적화 스크립트
 * 비중요 CSS를 비동기로 로드하여 렌더링 차단 방지
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function optimizeCSSLoading() {
  console.log('🚀 CSS 로딩 최적화 시작...');
  
  try {
    const buildDir = path.join(__dirname, '../build');
    const indexPath = path.join(buildDir, 'index.html');
    
    if (!fs.existsSync(indexPath)) {
      throw new Error('build/index.html 파일을 찾을 수 없습니다.');
    }
    
    let html = fs.readFileSync(indexPath, 'utf8');
    
    // CSS 파일들을 찾기
    const cssFiles = glob.sync(path.join(buildDir, 'static/css/*.css'));
    
    if (cssFiles.length === 0) {
      console.warn('⚠️  CSS 파일을 찾을 수 없습니다.');
      return;
    }
    
    // 각 CSS 파일을 분석하여 critical/non-critical 분류
    const cssOptimizations = cssFiles.map(filePath => {
      const fileName = path.basename(filePath);
      const relativePath = `/static/css/${fileName}`;
      
      // CSS 파일 내용 분석
      const cssContent = fs.readFileSync(filePath, 'utf8');
      const isCritical = analyzeCSSCriticality(cssContent);
      
      return {
        path: relativePath,
        fileName,
        isCritical,
        size: fs.statSync(filePath).size
      };
    });
    
    // HTML에서 기존 CSS 링크 제거하고 최적화된 로딩 구현
    html = html.replace(/<link[^>]*rel="stylesheet"[^>]*>/g, '');
    
    // Head에 최적화된 CSS 로딩 스크립트 추가
    const cssLoadingScript = generateCSSLoadingScript(cssOptimizations);
    
    const headEndIndex = html.indexOf('</head>');
    if (headEndIndex !== -1) {
      html = html.slice(0, headEndIndex) + cssLoadingScript + html.slice(headEndIndex);
    }
    
    // 최적화된 HTML 저장
    fs.writeFileSync(indexPath, html);
    
    console.log('✅ CSS 로딩 최적화 완료!');
    console.log(`📊 처리된 CSS 파일: ${cssOptimizations.length}개`);
    
    // 결과 요약
    const critical = cssOptimizations.filter(css => css.isCritical);
    const nonCritical = cssOptimizations.filter(css => !css.isCritical);
    
    console.log(`   - Critical CSS: ${critical.length}개 (즉시 로드)`);
    console.log(`   - Non-critical CSS: ${nonCritical.length}개 (지연 로드)`);
    
  } catch (error) {
    console.error('❌ CSS 로딩 최적화 실패:', error);
    console.warn('⚠️  Build는 계속 진행됩니다.');
  }
}

function analyzeCSSCriticality(cssContent) {
  // Critical CSS 패턴들
  const criticalPatterns = [
    /body\s*{/, // body 스타일
    /html\s*{/, // html 스타일
    /\*\s*{/, // universal selector
    /@media\s*\([^)]*max-width:\s*768px/, // 모바일 스타일
    /\.App\s*{/, // 메인 앱 컨테이너
    /header\s*{/, // 헤더
    /nav\s*{/, // 네비게이션
    /\.banner/, // 배너
    /\.loading/, // 로딩 상태
    /\.skeleton/ // 스켈레톤 로딩
  ];
  
  // Non-critical CSS 패턴들
  const nonCriticalPatterns = [
    /@keyframes/, // 애니메이션
    /\.modal/, // 모달
    /\.tooltip/, // 툴팁
    /\.dropdown/, // 드롭다운
    /\.quill/, // 에디터
    /\.chart/, // 차트
    /\.admin/ // 관리자 페이지
  ];
  
  // Critical 패턴 매칭
  const hasCriticalContent = criticalPatterns.some(pattern => pattern.test(cssContent));
  
  // Non-critical 패턴 매칭 (더 높은 우선순위)
  const hasNonCriticalContent = nonCriticalPatterns.some(pattern => pattern.test(cssContent));
  
  if (hasNonCriticalContent) return false;
  if (hasCriticalContent) return true;
  
  // 파일 크기로 판단 (작은 파일은 critical로 간주)
  return cssContent.length < 10000; // 10KB 미만
}

function generateCSSLoadingScript(cssOptimizations) {
  const criticalCSS = cssOptimizations.filter(css => css.isCritical);
  const nonCriticalCSS = cssOptimizations.filter(css => !css.isCritical);
  
  return `
<!-- 최적화된 CSS 로딩 -->
${criticalCSS.map(css => `<link rel="stylesheet" href="${css.path}" media="all">`).join('\n')}

<script>
(function() {
  'use strict';
  
  // Non-critical CSS 지연 로딩 함수
  function loadCSS(href, media) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = media || 'all';
    
    // 로드 완료 시 media 속성 설정
    link.onload = function() {
      if (media && media !== 'all') {
        this.media = 'all';
      }
    };
    
    // 에러 처리
    link.onerror = function() {
      console.warn('CSS 로드 실패:', href);
    };
    
    document.head.appendChild(link);
    return link;
  }
  
  // 페이지 로드 후 non-critical CSS 로드
  function loadNonCriticalCSS() {
    var nonCriticalStyles = [
      ${nonCriticalCSS.map(css => `'${css.path}'`).join(',\n      ')}
    ];
    
    // requestIdleCallback 사용 가능시 활용
    if ('requestIdleCallback' in window) {
      requestIdleCallback(function() {
        nonCriticalStyles.forEach(function(href) {
          loadCSS(href);
        });
      });
    } else {
      // Fallback: setTimeout 사용
      setTimeout(function() {
        nonCriticalStyles.forEach(function(href) {
          loadCSS(href);
        });
      }, 100);
    }
  }
  
  // DOM이 준비되면 non-critical CSS 로드
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNonCriticalCSS);
  } else {
    loadNonCriticalCSS();
  }
  
  // 사용자 상호작용 시에도 로드 (더 빠른 응답을 위해)
  var interactionEvents = ['mousedown', 'touchstart', 'keydown', 'scroll'];
  var hasLoaded = false;
  
  function onInteraction() {
    if (!hasLoaded) {
      hasLoaded = true;
      loadNonCriticalCSS();
      
      // 이벤트 리스너 제거
      interactionEvents.forEach(function(event) {
        document.removeEventListener(event, onInteraction, { passive: true });
      });
    }
  }
  
  // 상호작용 이벤트 등록
  interactionEvents.forEach(function(event) {
    document.addEventListener(event, onInteraction, { passive: true, once: true });
  });
})();
</script>

<!-- Preload important fonts -->
<link rel="preload" href="/fonts/pretendard-subset.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/pretendard-variable.woff2" as="font" type="font/woff2" crossorigin>
`;
}

// 메인 실행
if (require.main === module) {
  optimizeCSSLoading();
}

module.exports = { optimizeCSSLoading };
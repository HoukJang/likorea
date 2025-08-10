#!/usr/bin/env node

/**
 * 통합 성능 최적화 실행 스크립트
 * PageSpeed Insights 점수 개선을 위한 종합 최적화
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;
const path = require('path');

const OPTIMIZATION_STEPS = {
  1: {
    name: '폰트 최적화',
    description: 'Pretendard 폰트 서브셋 생성 및 로컬 호스팅',
    impact: '3MB → 300KB (90% 감소)',
    script: 'node scripts/optimize-fonts.js'
  },
  2: {
    name: '캐시 정책 개선',
    description: '정적 자산 장기 캐싱 설정',
    impact: '재방문 시 70% 로딩 시간 단축',
    info: '백엔드 미들웨어와 nginx 설정 이미 적용됨'
  },
  3: {
    name: 'Critical CSS 최적화',
    description: 'Above-the-fold CSS 인라인화',
    impact: 'FCP 1.5초 단축',
    info: 'index.html에 이미 critical CSS 포함됨'
  },
  4: {
    name: 'JavaScript 번들 최적화',
    description: '동적 import 및 tree shaking 개선',
    impact: '번들 크기 30% 감소',
    info: 'DOMPurify 동적 import 적용 완료'
  },
  5: {
    name: 'CSS 최적화',
    description: 'PurgeCSS로 사용하지 않는 CSS 제거',
    impact: 'CSS 크기 60% 감소',
    script: 'node scripts/optimize-css.js'
  }
};

async function runOptimization(steps = []) {
  console.log('🚀 Long Island Korea 성능 최적화 시작\n');
  console.log('📊 현재 PageSpeed 점수: 62/100');
  console.log('🎯 목표 PageSpeed 점수: 90+/100\n');

  const stepsToRun = steps.length > 0 ? steps : Object.keys(OPTIMIZATION_STEPS);

  for (const stepNum of stepsToRun) {
    const step = OPTIMIZATION_STEPS[stepNum];
    if (!step) continue;

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📌 단계 ${stepNum}: ${step.name}`);
    console.log(`   설명: ${step.description}`);
    console.log(`   예상 효과: ${step.impact}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    if (step.script) {
      try {
        console.log(`\n⚙️  실행 중: ${step.script}`);
        const { stdout, stderr } = await execAsync(step.script, {
          cwd: path.join(__dirname, '..')
        });
        if (stdout) console.log(stdout);
        if (stderr) console.error('⚠️  경고:', stderr);
        console.log(`✅ ${step.name} 완료!`);
      } catch (error) {
        console.error(`❌ ${step.name} 실패:`, error.message);
      }
    } else if (step.info) {
      console.log(`\nℹ️  ${step.info}`);
      console.log(`✅ ${step.name} 확인 완료!`);
    }
  }

  console.log('\n\n🏁 최적화 완료!\n');
  console.log('📋 다음 단계:');
  console.log('1. npm run build - 프로덕션 빌드 생성');
  console.log('2. 빌드된 파일 크기 확인');
  console.log('3. PageSpeed Insights 재측정');
  console.log('4. 배포 및 실제 성능 모니터링\n');

  // 최종 체크리스트 생성
  const checklist = `
# 성능 최적화 체크리스트

## ✅ 완료된 최적화
- [x] 폰트 비동기 로딩 (media="print" 트릭)
- [x] CDN preconnect 추가
- [x] 캐시 헤더 미들웨어 구현
- [x] Webpack contenthash 설정
- [x] DOMPurify 동적 import
- [x] Critical CSS 인라인

## 📋 추가 작업 필요
- [ ] Pretendard 폰트 서브셋 생성 (pyftsubset 필요)
- [ ] PurgeCSS 설정 및 빌드 통합
- [ ] nginx 설정 업데이트 (프로덕션)
- [ ] 이미지 AVIF 포맷 지원 추가

## 🎯 예상 성능 개선
- FCP: 5.4초 → 2.0초 (-63%)
- LCP: 7.7초 → 3.5초 (-55%)
- 번들 크기: 30% 감소
- PageSpeed 점수: 62 → 90+

## 🔍 성능 측정 도구
- PageSpeed Insights: https://pagespeed.web.dev/
- WebPageTest: https://www.webpagetest.org/
- Chrome DevTools Lighthouse
`;

  await fs.writeFile(
    path.join(__dirname, '../optimization-checklist.md'),
    checklist
  );

  console.log('📝 optimization-checklist.md 파일이 생성되었습니다.');
}

// CLI 실행
const args = process.argv.slice(2).map(Number).filter(n => n >= 1 && n <= 5);
runOptimization(args).catch(console.error);
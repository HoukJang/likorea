/**
 * JavaScript 번들 분석 및 최적화 스크립트
 * 코드 분할, 동적 import, 불필요한 라이브러리 제거 분석
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BundleAnalyzer {
  constructor() {
    this.srcDir = path.join(__dirname, '../src');
    this.buildDir = path.join(__dirname, '../build');
    this.analysis = {
      components: new Map(),
      imports: new Map(),
      dependencies: new Map(),
      recommendations: []
    };
  }
  
  analyze() {
    console.log('📊 JavaScript 번들 분석 시작...');
    
    // 1. 컴포넌트 분석
    this.analyzeComponents();
    
    // 2. 의존성 분석
    this.analyzeDependencies();
    
    // 3. Import 패턴 분석
    this.analyzeImportPatterns();
    
    // 4. 최적화 권장사항 생성
    this.generateRecommendations();
    
    // 5. 결과 리포트 생성
    this.generateReport();
    
    console.log('✅ 번들 분석 완료!');
  }
  
  analyzeComponents() {
    console.log('🔍 컴포넌트 크기 및 사용 패턴 분석...');
    
    const jsFiles = this.getJSFiles();
    
    jsFiles.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath);
      const fileSize = content.length;
      
      // Import 패턴 분석
      const imports = this.extractImports(content);
      
      // 컴포넌트 복잡도 분석
      const complexity = this.calculateComplexity(content);
      
      this.analysis.components.set(fileName, {
        path: filePath,
        size: fileSize,
        imports: imports.length,
        complexity,
        isLazyLoaded: content.includes('lazy('),
        hasHeavyDeps: this.hasHeavyDependencies(imports)
      });
    });
  }
  
  analyzeDependencies() {
    console.log('📦 의존성 트리 분석...');
    
    const packageJson = require('../package.json');
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // 무거운 라이브러리 식별
    const heavyLibraries = {
      '@mui/material': { size: '~400KB', usage: 'UI 컴포넌트', recommendation: '사용하는 컴포넌트만 import' },
      '@mui/icons-material': { size: '~200KB', usage: '아이콘', recommendation: '개별 아이콘 import 또는 자체 아이콘으로 교체' },
      'quill': { size: '~300KB', usage: '에디터', recommendation: 'lazy loading 필수' },
      'chart.js': { size: '~250KB', usage: '차트', recommendation: 'lazy loading 또는 더 가벼운 대안' },
      'react-chartjs-2': { size: '~50KB', usage: '차트 래퍼', recommendation: 'Chart.js와 함께 lazy loading' },
      'dompurify': { size: '~100KB', usage: 'HTML 정화', recommendation: '필요한 곳에서만 동적 import' }
    };
    
    Object.entries(deps).forEach(([name, version]) => {
      const isHeavy = heavyLibraries[name];
      this.analysis.dependencies.set(name, {
        version,
        isHeavy: !!isHeavy,
        info: isHeavy || { size: 'unknown', usage: 'unknown' }
      });
    });
  }
  
  analyzeImportPatterns() {
    console.log('📥 Import 패턴 최적화 분석...');
    
    this.analysis.components.forEach((info, fileName) => {
      const content = fs.readFileSync(info.path, 'utf8');
      const imports = this.extractImports(content);
      
      imports.forEach(importStatement => {
        const key = this.normalizeImport(importStatement);
        if (!this.analysis.imports.has(key)) {
          this.analysis.imports.set(key, { count: 0, files: [] });
        }
        
        const importInfo = this.analysis.imports.get(key);
        importInfo.count++;
        importInfo.files.push(fileName);
      });
    });
  }
  
  generateRecommendations() {
    console.log('💡 최적화 권장사항 생성...');
    
    const recommendations = [];
    
    // 1. Lazy Loading 권장사항
    this.analysis.components.forEach((info, fileName) => {
      if (!info.isLazyLoaded && (info.size > 5000 || info.hasHeavyDeps)) {
        recommendations.push({
          type: 'lazy-loading',
          priority: info.hasHeavyDeps ? 'high' : 'medium',
          component: fileName,
          reason: info.hasHeavyDeps ? '무거운 의존성 포함' : '큰 파일 크기',
          expectedGain: '초기 번들 크기 감소'
        });
      }
    });
    
    // 2. Tree Shaking 권장사항
    this.analysis.imports.forEach((info, importPath) => {
      if (importPath.includes('@mui') && !importPath.includes('/')) {
        recommendations.push({
          type: 'tree-shaking',
          priority: 'high',
          import: importPath,
          usedIn: info.files,
          reason: 'Default import 사용',
          solution: '개별 컴포넌트 import로 변경',
          expectedGain: '번들 크기 30-50% 감소'
        });
      }
    });
    
    // 3. 코드 분할 권장사항
    const routeComponents = Array.from(this.analysis.components.entries())
      .filter(([name, info]) => {
        const content = fs.readFileSync(info.path, 'utf8');
        return content.includes('function') && content.includes('export default');
      })
      .sort(([, a], [, b]) => b.size - a.size)
      .slice(0, 5);
    
    routeComponents.forEach(([name, info]) => {
      if (!info.isLazyLoaded) {
        recommendations.push({
          type: 'code-splitting',
          priority: 'medium',
          component: name,
          size: info.size,
          reason: '라우트 레벨 컴포넌트',
          solution: 'React.lazy()로 감싸기',
          expectedGain: '초기 로딩 시간 단축'
        });
      }
    });
    
    // 4. 의존성 최적화 권장사항
    this.analysis.dependencies.forEach((info, name) => {
      if (info.isHeavy) {
        recommendations.push({
          type: 'dependency-optimization',
          priority: 'medium',
          dependency: name,
          size: info.info.size,
          usage: info.info.usage,
          recommendation: info.info.recommendation,
          expectedGain: 'Bundle size reduction'
        });
      }
    });
    
    this.analysis.recommendations = recommendations;
  }
  
  generateReport() {
    const report = {
      summary: {
        totalComponents: this.analysis.components.size,
        totalDependencies: this.analysis.dependencies.size,
        lazyLoadedComponents: Array.from(this.analysis.components.values()).filter(c => c.isLazyLoaded).length,
        heavyDependencies: Array.from(this.analysis.dependencies.values()).filter(d => d.isHeavy).length,
        totalRecommendations: this.analysis.recommendations.length
      },
      recommendations: this.analysis.recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }),
      componentAnalysis: Object.fromEntries(this.analysis.components),
      dependencyAnalysis: Object.fromEntries(this.analysis.dependencies)
    };
    
    // 리포트 파일 생성
    const reportPath = path.join(__dirname, '../bundle-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // 콘솔 요약
    console.log('\n📋 번들 분석 결과:');
    console.log(`   📁 총 컴포넌트: ${report.summary.totalComponents}개`);
    console.log(`   ⚡ Lazy-loaded: ${report.summary.lazyLoadedComponents}개`);
    console.log(`   📦 총 의존성: ${report.summary.totalDependencies}개`);
    console.log(`   ⚠️  무거운 의존성: ${report.summary.heavyDependencies}개`);
    console.log(`   💡 권장사항: ${report.summary.totalRecommendations}개`);
    
    // 우선순위별 권장사항
    const highPriority = report.recommendations.filter(r => r.priority === 'high');
    if (highPriority.length > 0) {
      console.log('\n🚨 즉시 적용 권장 (High Priority):');
      highPriority.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.type}: ${rec.component || rec.dependency || rec.import}`);
        console.log(`      → ${rec.reason}`);
      });
    }
    
    console.log(`\n📄 상세 리포트: ${reportPath}`);
  }
  
  // 헬퍼 메서드들
  getJSFiles() {
    const files = [];
    
    function walkDir(dir) {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.')) {
          walkDir(fullPath);
        } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
          files.push(fullPath);
        }
      });
    }
    
    walkDir(this.srcDir);
    return files;
  }
  
  extractImports(content) {
    const importRegex = /import\s+(?:(?:\{[^}]+\}|\w+|\*\s+as\s+\w+)(?:\s*,\s*(?:\{[^}]+\}|\w+))?)?\s+from\s+['"]([^'"]+)['"]/g;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[0]);
    }
    
    return imports;
  }
  
  calculateComplexity(content) {
    // 간단한 복잡도 계산
    const lines = content.split('\n').length;
    const functions = (content.match(/function\s+\w+|=>\s*{|const\s+\w+\s*=/g) || []).length;
    const hooks = (content.match(/use\w+\(/g) || []).length;
    
    return { lines, functions, hooks, score: lines + functions * 2 + hooks };
  }
  
  hasHeavyDependencies(imports) {
    const heavyPatterns = ['@mui', 'chart.js', 'quill', 'lodash'];
    return imports.some(imp => heavyPatterns.some(pattern => imp.includes(pattern)));
  }
  
  normalizeImport(importStatement) {
    const match = importStatement.match(/from\s+['"]([^'"]+)['"]/);
    return match ? match[1] : importStatement;
  }
}

// 실행
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze();
}

module.exports = { BundleAnalyzer };
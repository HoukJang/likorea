#!/usr/bin/env node

/**
 * Deployment Readiness Test Suite
 * 배포 준비 통합 테스트
 *
 * 이 스크립트는 배포 전 모든 주요 기능을 검증합니다.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const colors = require('colors/safe');
const path = require('path');

// Test results tracking
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// Utility functions
const log = {
  info: (msg) => console.log(colors.blue(`ℹ️  ${msg}`)),
  success: (msg) => {
    console.log(colors.green(`✅ ${msg}`));
    testResults.passed.push(msg);
  },
  error: (msg) => {
    console.log(colors.red(`❌ ${msg}`));
    testResults.failed.push(msg);
  },
  warning: (msg) => {
    console.log(colors.yellow(`⚠️  ${msg}`));
    testResults.warnings.push(msg);
  },
  section: (msg) => console.log(colors.cyan(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`))
};

// Test functions
async function testEnvironmentVariables() {
  log.section('1. 환경 변수 검증');

  const requiredVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'ANTHROPIC_API_KEY',
    'PORT',
    'NODE_ENV',
    'ALLOWED_ORIGINS'
  ];

  const optionalVars = [
    'OPENAI_API_KEY',
    'EXTRACT_FULL_ARTICLES',
    'LOG_LEVEL'
  ];

  // Check required variables
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      log.success(`${varName} 설정됨`);
    } else {
      log.error(`${varName} 누락됨`);
    }
  }

  // Check optional variables
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      log.info(`${varName} 설정됨 (선택사항)`);
    } else {
      log.warning(`${varName} 설정되지 않음 (선택사항)`);
    }
  }
}

async function testDatabaseConnection() {
  log.section('2. 데이터베이스 연결 테스트');

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    log.success('MongoDB 연결 성공');

    // Test collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    log.info(`컬렉션 수: ${collections.length}`);

    const expectedCollections = ['users', 'boardposts', 'bots', 'comments', 'tags'];
    for (const coll of expectedCollections) {
      if (collections.find(c => c.name === coll)) {
        log.success(`${coll} 컬렉션 존재`);
      } else {
        log.warning(`${coll} 컬렉션 누락`);
      }
    }

  } catch (error) {
    log.error(`데이터베이스 연결 실패: ${error.message}`);
    return false;
  }

  return true;
}

async function testBotSystem() {
  log.section('3. 봇 시스템 테스트');

  try {
    const Bot = require('../models/Bot');
    const newsAggregatorService = require('../services/newsAggregatorService');

    // Check for bots with full article extraction enabled
    const bots = await Bot.find({ type: 'news' });
    log.info(`뉴스봇 수: ${bots.length}`);

    const enabledBots = bots.filter(bot => bot.apiSettings?.extractFullArticles);
    if (enabledBots.length > 0) {
      log.success(`${enabledBots.length}개 봇이 전체 기사 추출 활성화됨`);
    } else {
      log.warning('전체 기사 추출이 활성화된 봇이 없음');
    }

    // Test news aggregation
    log.info('뉴스 수집 테스트 중...');
    const newsData = await newsAggregatorService.aggregateWeeklyNews('Long Island', {
      extractFullArticles: false,
      maxFullArticles: 1
    });

    if (newsData && newsData.totalArticles > 0) {
      log.success(`뉴스 수집 성공: ${newsData.totalArticles}개 기사`);
    } else {
      log.error('뉴스 수집 실패');
    }

  } catch (error) {
    log.error(`봇 시스템 테스트 실패: ${error.message}`);
  }
}

async function testAPIEndpoints() {
  log.section('4. API 엔드포인트 테스트');

  const baseURL = `http://localhost:${process.env.PORT || 5001}/api`;
  const endpoints = [
    { method: 'GET', path: '/boards', description: '게시판 목록' },
    { method: 'GET', path: '/tags', description: '태그 목록' },
    { method: 'GET', path: '/users/me', description: '사용자 정보 (인증 필요)', expectError: true }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${baseURL}${endpoint.path}`,
        timeout: 3000,
        validateStatus: () => true // Accept any status
      });

      if (response.status < 400) {
        log.success(`${endpoint.description}: ${response.status}`);
      } else if (endpoint.expectError) {
        log.info(`${endpoint.description}: ${response.status} (예상된 오류)`);
      } else {
        log.error(`${endpoint.description}: ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        log.error(`서버가 실행되지 않음 (포트 ${process.env.PORT || 5001})`);
        break;
      } else {
        log.error(`${endpoint.description}: ${error.message}`);
      }
    }
  }
}

async function testArticleExtraction() {
  log.section('5. 기사 추출 시스템 테스트');

  try {
    const articleExtractorService = require('../services/articleExtractorService');
    const urlResolverService = require('../services/urlResolverService');

    // Test URL resolver
    const testUrl = 'https://www.longislandpress.com/';
    const accessible = await urlResolverService.isUrlAccessible(testUrl);

    if (accessible) {
      log.success('URL 접근성 테스트 통과');
    } else {
      log.warning('URL 접근성 테스트 실패 (네트워크 문제일 수 있음)');
    }

    // Check cache stats
    const cacheStats = urlResolverService.getCacheStats();
    log.info(`URL 캐시 상태: ${cacheStats.keys}개 저장, 히트율 ${(cacheStats.hitRate * 100).toFixed(1)}%`);

  } catch (error) {
    log.error(`기사 추출 테스트 실패: ${error.message}`);
  }
}

async function testFrontendBuild() {
  log.section('6. 프론트엔드 빌드 테스트');

  const fs = require('fs');
  const path = require('path');

  // Check if build directory exists
  const buildPath = path.join(__dirname, '../../frontend/build');
  if (fs.existsSync(buildPath)) {
    log.success('프론트엔드 빌드 디렉토리 존재');

    // Check index.html
    const indexPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      log.success('index.html 파일 존재');
    } else {
      log.warning('index.html 파일 누락 - 빌드 필요');
    }
  } else {
    log.warning('프론트엔드 빌드 필요 (npm run build)');
  }

  // Check linkify utility
  const linkifyPath = path.join(__dirname, '../../frontend/src/utils/linkify.js');
  if (fs.existsSync(linkifyPath)) {
    log.success('URL 링크 변환 유틸리티 존재');
  } else {
    log.error('linkify.js 파일 누락');
  }
}

async function checkDependencies() {
  log.section('7. 의존성 검사');

  const backendPackage = require('../package.json');
  const frontendPackage = require('../../frontend/package.json');

  log.info(`백엔드 버전: ${backendPackage.version}`);
  log.info(`프론트엔드 버전: ${frontendPackage.version}`);

  // Check for security vulnerabilities
  const { execSync } = require('child_process');
  try {
    // Note: This requires npm audit to be available
    log.info('보안 취약점 검사 중...');
    const auditResult = execSync('npm audit --json', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8'
    });
    const audit = JSON.parse(auditResult);

    if (audit.metadata.vulnerabilities.total === 0) {
      log.success('보안 취약점 없음');
    } else {
      log.warning(`보안 취약점 발견: ${audit.metadata.vulnerabilities.total}개`);
    }
  } catch (error) {
    log.warning('npm audit 실행 실패');
  }
}

// Main execution
async function runAllTests() {
  console.log(colors.magenta('\n╔════════════════════════════════════════════════════════╗'));
  console.log(colors.magenta('║          배포 준비 통합 테스트 시작                    ║'));
  console.log(colors.magenta('╚════════════════════════════════════════════════════════╝\n'));

  const startTime = Date.now();

  // Run all tests
  await testEnvironmentVariables();

  const dbConnected = await testDatabaseConnection();
  if (dbConnected) {
    await testBotSystem();
    await testArticleExtraction();
  }

  await testAPIEndpoints();
  await testFrontendBuild();
  await checkDependencies();

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  log.section('테스트 결과 요약');
  console.log(colors.green(`✅ 통과: ${testResults.passed.length}개`));
  console.log(colors.yellow(`⚠️  경고: ${testResults.warnings.length}개`));
  console.log(colors.red(`❌ 실패: ${testResults.failed.length}개`));
  console.log(colors.blue(`⏱️  소요 시간: ${duration}초`));

  if (testResults.failed.length === 0) {
    console.log(colors.green('\n🎉 배포 준비 완료!'));
    process.exit(0);
  } else {
    console.log(colors.red('\n⚠️  배포 전 문제 해결 필요'));
    console.log(colors.red('실패 항목:'));
    testResults.failed.forEach(item => console.log(colors.red(`  - ${item}`)));
    process.exit(1);
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error(colors.red('예기치 않은 오류:'), error);
  process.exit(1);
});

// Execute tests
runAllTests().catch(error => {
  console.error(colors.red('테스트 실행 실패:'), error);
  process.exit(1);
}).finally(() => {
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close();
  }
});
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 버전 동기화 스크립트
 * VERSION 파일의 버전을 backend와 frontend package.json에 동기화합니다.
 */

const rootDir = path.join(__dirname, '..');
const versionFile = path.join(rootDir, 'VERSION');
const backendPackageFile = path.join(rootDir, 'backend', 'package.json');
const frontendPackageFile = path.join(rootDir, 'frontend', 'package.json');

function readVersion() {
  try {
    return fs.readFileSync(versionFile, 'utf8').trim();
  } catch (error) {
    console.error('❌ VERSION 파일을 읽을 수 없습니다:', error.message);
    process.exit(1);
  }
}

function updatePackageVersion(packageFile, version) {
  try {
    const packageContent = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
    packageContent.version = version;
    fs.writeFileSync(packageFile, JSON.stringify(packageContent, null, 2) + '\n');
    console.log(`✅ ${path.relative(rootDir, packageFile)} 버전 업데이트: ${version}`);
    return true;
  } catch (error) {
    console.error(`❌ ${path.relative(rootDir, packageFile)} 업데이트 실패:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔄 버전 동기화 시작...');
  
  const version = readVersion();
  console.log(`📋 현재 버전: ${version}`);
  
  let success = true;
  
  // Backend package.json 업데이트
  if (fs.existsSync(backendPackageFile)) {
    success = updatePackageVersion(backendPackageFile, version) && success;
  } else {
    console.warn(`⚠️  Backend package.json을 찾을 수 없습니다: ${backendPackageFile}`);
  }
  
  // Frontend package.json 업데이트
  if (fs.existsSync(frontendPackageFile)) {
    success = updatePackageVersion(frontendPackageFile, version) && success;
  } else {
    console.warn(`⚠️  Frontend package.json을 찾을 수 없습니다: ${frontendPackageFile}`);
  }
  
  if (success) {
    console.log('🎉 버전 동기화 완료!');
    process.exit(0);
  } else {
    console.error('❌ 버전 동기화 중 오류가 발생했습니다.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { readVersion, updatePackageVersion };
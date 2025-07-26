#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { readVersion, updatePackageVersion } = require('./sync-version');

/**
 * 버전 증가 스크립트
 * VERSION 파일의 버전을 증가시키고 모든 package.json에 동기화합니다.
 */

const rootDir = path.join(__dirname, '..');
const versionFile = path.join(rootDir, 'VERSION');

function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`잘못된 버전 형식: ${version}`);
  }
  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3])
  };
}

function incrementVersion(version, type) {
  const { major, minor, patch } = parseVersion(version);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`지원하지 않는 버전 타입: ${type}`);
  }
}

function updateVersionFile(newVersion) {
  try {
    fs.writeFileSync(versionFile, newVersion + '\n');
    console.log(`✅ VERSION 파일 업데이트: ${newVersion}`);
    return true;
  } catch (error) {
    console.error('❌ VERSION 파일 업데이트 실패:', error.message);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  const type = args[0] || 'patch';
  
  if (!['major', 'minor', 'patch'].includes(type)) {
    console.error('❌ 사용법: node bump-version.js [major|minor|patch]');
    console.error('   기본값: patch');
    process.exit(1);
  }
  
  console.log(`🚀 버전 증가 시작 (${type})...`);
  
  const currentVersion = readVersion();
  console.log(`📋 현재 버전: ${currentVersion}`);
  
  try {
    const newVersion = incrementVersion(currentVersion, type);
    console.log(`📈 새 버전: ${newVersion}`);
    
    // VERSION 파일 업데이트
    if (!updateVersionFile(newVersion)) {
      process.exit(1);
    }
    
    // package.json 파일들 동기화
    const syncScript = require('./sync-version');
    
    const backendPackageFile = path.join(rootDir, 'backend', 'package.json');
    const frontendPackageFile = path.join(rootDir, 'frontend', 'package.json');
    
    let success = true;
    
    if (fs.existsSync(backendPackageFile)) {
      success = updatePackageVersion(backendPackageFile, newVersion) && success;
    }
    
    if (fs.existsSync(frontendPackageFile)) {
      success = updatePackageVersion(frontendPackageFile, newVersion) && success;
    }
    
    if (success) {
      console.log('🎉 버전 증가 및 동기화 완료!');
      console.log(`💡 다음 단계: git add . && git commit -m "chore: bump version to ${newVersion}"`);
    } else {
      console.error('❌ 버전 동기화 중 오류가 발생했습니다.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 버전 증가 실패:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
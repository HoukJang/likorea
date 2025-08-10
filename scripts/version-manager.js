#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERSION_FILE = path.join(__dirname, '..', 'version.json');
const ROOT_PACKAGE = path.join(__dirname, '..', 'package.json');
const BACKEND_PACKAGE = path.join(__dirname, '..', 'backend', 'package.json');
const FRONTEND_PACKAGE = path.join(__dirname, '..', 'frontend', 'package.json');

class VersionManager {
  constructor() {
    this.versionData = this.loadVersion();
  }

  loadVersion() {
    try {
      return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
    } catch (error) {
      console.error('Error loading version.json:', error);
      process.exit(1);
    }
  }

  saveVersion() {
    fs.writeFileSync(VERSION_FILE, JSON.stringify(this.versionData, null, 2));
  }

  // 모든 package.json 파일의 버전을 동기화
  syncPackageVersions() {
    const packages = [ROOT_PACKAGE, BACKEND_PACKAGE, FRONTEND_PACKAGE];
    
    packages.forEach(packagePath => {
      try {
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        packageData.version = this.versionData.version;
        fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2) + '\n');
        console.log(`✅ Updated ${path.basename(path.dirname(packagePath))}/package.json to v${this.versionData.version}`);
      } catch (error) {
        console.error(`Error updating ${packagePath}:`, error);
      }
    });
  }

  // Git 태그 생성
  createGitTag(message) {
    const tagName = `v${this.versionData.version}`;
    
    try {
      // 태그가 이미 존재하는지 확인
      execSync(`git rev-parse ${tagName}`, { stdio: 'ignore' });
      console.log(`⚠️  Tag ${tagName} already exists`);
      return false;
    } catch {
      // 태그가 없으면 생성
      const tagMessage = message || `Release ${tagName} - ${this.versionData.codename}\n\n${this.versionData.description}`;
      execSync(`git tag -a ${tagName} -m "${tagMessage}"`);
      console.log(`✅ Created Git tag: ${tagName}`);
      return true;
    }
  }

  // 특정 버전으로 체크아웃
  checkoutVersion(version) {
    const tagName = version.startsWith('v') ? version : `v${version}`;
    
    try {
      execSync(`git checkout ${tagName}`);
      console.log(`✅ Checked out to ${tagName}`);
    } catch (error) {
      console.error(`Error checking out ${tagName}:`, error.message);
      process.exit(1);
    }
  }

  // 버전 목록 표시
  listVersions() {
    try {
      const tags = execSync('git tag -l "v*" --sort=-version:refname').toString().trim().split('\n');
      console.log('\n📋 Available versions:');
      tags.forEach(tag => {
        const current = execSync('git describe --tags --exact-match 2>/dev/null || echo ""').toString().trim();
        const marker = tag === current ? ' (current)' : '';
        console.log(`  ${tag}${marker}`);
      });
    } catch (error) {
      console.error('Error listing versions:', error.message);
    }
  }

  // 버전 업데이트
  updateVersion(newVersion, codename, description) {
    this.versionData.version = newVersion;
    if (codename) this.versionData.codename = codename;
    if (description) this.versionData.description = description;
    this.versionData.releaseDate = new Date().toISOString().split('T')[0];
    
    this.saveVersion();
    this.syncPackageVersions();
    
    console.log(`\n✅ Version updated to ${newVersion}`);
    console.log(`   Codename: ${this.versionData.codename}`);
    console.log(`   Date: ${this.versionData.releaseDate}`);
  }

  // 빌드 시 버전 정보 주입
  injectVersionToBuild() {
    const envPath = path.join(__dirname, '..', 'frontend', '.env.production');
    let envContent = '';
    
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch {
      // 파일이 없으면 새로 생성
    }
    
    // 기존 REACT_APP_VERSION 제거
    envContent = envContent.split('\n')
      .filter(line => !line.startsWith('REACT_APP_VERSION'))
      .join('\n');
    
    // 새 버전 추가
    envContent += `\nREACT_APP_VERSION=${this.versionData.version}\n`;
    envContent += `REACT_APP_VERSION_CODENAME=${this.versionData.codename}\n`;
    envContent += `REACT_APP_VERSION_DATE=${this.versionData.releaseDate}\n`;
    
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    console.log('✅ Version injected to frontend .env.production');
  }

  // 현재 버전 표시
  showCurrentVersion() {
    console.log(`\n🏷️  Current Version: ${this.versionData.version}`);
    console.log(`   Codename: ${this.versionData.codename}`);
    console.log(`   Release Date: ${this.versionData.releaseDate}`);
    console.log(`   Description: ${this.versionData.description}`);
    
    try {
      const currentTag = execSync('git describe --tags --exact-match 2>/dev/null').toString().trim();
      console.log(`   Git Tag: ${currentTag} ✓`);
    } catch {
      console.log(`   Git Tag: Not tagged yet`);
    }
  }
}

// CLI 인터페이스
const args = process.argv.slice(2);
const manager = new VersionManager();

switch (args[0]) {
  case 'sync':
    manager.syncPackageVersions();
    break;
    
  case 'tag':
    manager.createGitTag(args[1]);
    break;
    
  case 'checkout':
    if (!args[1]) {
      console.error('❌ Please specify a version to checkout');
      process.exit(1);
    }
    manager.checkoutVersion(args[1]);
    break;
    
  case 'list':
    manager.listVersions();
    break;
    
  case 'update':
    if (!args[1]) {
      console.error('❌ Please specify a new version');
      process.exit(1);
    }
    manager.updateVersion(args[1], args[2], args[3]);
    break;
    
  case 'inject':
    manager.injectVersionToBuild();
    break;
    
  case 'current':
  case 'show':
    manager.showCurrentVersion();
    break;
    
  default:
    console.log(`
🔧 Version Manager

Usage: node version-manager.js [command] [options]

Commands:
  current, show     Show current version info
  sync             Sync version across all package.json files
  tag [message]    Create Git tag for current version
  checkout <ver>   Checkout to specific version (e.g., 1.0.0 or v1.0.0)
  list             List all available versions
  update <ver>     Update version (e.g., update 1.0.1 "Hotfix" "Bug fixes")
  inject           Inject version info to frontend build

Examples:
  node version-manager.js current
  node version-manager.js update 1.0.1 "Hotfix" "Performance improvements"
  node version-manager.js tag "Initial release"
  node version-manager.js checkout 1.0.0
`);
}
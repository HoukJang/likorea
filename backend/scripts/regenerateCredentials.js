#!/usr/bin/env node

/**
 * 보안 크리덴셜 재생성 도우미 스크립트
 * 노출된 크리덴셜을 안전하게 재생성하는 가이드 제공
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// 유틸리티 함수
const generateSecret = (length = 64) => crypto.randomBytes(length).toString('hex');
const generatePassword = (length = 16) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
};

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log(`${colors.blue}🔐 보안 크리덴셜 재생성 도우미${colors.reset}\n`);
  console.log(`${colors.red}⚠️  경고: 프로덕션 크리덴셜이 노출되었습니다!${colors.reset}`);
  console.log('다음 단계를 따라 안전하게 크리덴셜을 재생성하세요.\n');

  // 1. JWT Secret 생성
  console.log(`${colors.yellow}1. JWT Secret 재생성${colors.reset}`);
  const newJwtSecret = generateSecret(64);
  console.log(`   새로운 JWT_SECRET: ${colors.green}${newJwtSecret}${colors.reset}`);
  console.log('   ⚠️  주의: 이 값을 변경하면 모든 사용자가 재로그인해야 합니다.\n');

  // 2. MongoDB 비밀번호 변경 가이드
  console.log(`${colors.yellow}2. MongoDB Atlas 비밀번호 변경${colors.reset}`);
  const newMongoPassword = generatePassword(20);
  console.log('   권장 단계:');
  console.log('   a) MongoDB Atlas 콘솔에 로그인하세요');
  console.log('   b) Database Access > 사용자 선택 > Edit > 비밀번호 변경');
  console.log(`   c) 추천 비밀번호: ${colors.green}${newMongoPassword}${colors.reset}`);
  console.log('   d) 새 연결 문자열로 MONGO_URI를 업데이트하세요\n');

  // 3. OpenAI API 키 재생성
  console.log(`${colors.yellow}3. OpenAI API 키 재생성${colors.reset}`);
  console.log('   권장 단계:');
  console.log('   a) https://platform.openai.com/api-keys 접속');
  console.log('   b) 기존 키 삭제 (sk-proj-jq9j...)');
  console.log('   c) 새 API 키 생성');
  console.log('   d) 새 키로 OPENAI_API_KEY 업데이트\n');

  // 4. 환경별 .env 파일 생성
  const createEnvFile = await question(`${colors.magenta}.env 파일을 자동으로 생성하시겠습니까? (y/n): ${colors.reset}`);
  
  if (createEnvFile.toLowerCase() === 'y') {
    console.log('\n환경을 선택하세요:');
    console.log('1) Development (.env.development)');
    console.log('2) Production (.env.production)');
    const envChoice = await question('선택 (1 또는 2): ');
    
    const envType = envChoice === '2' ? 'production' : 'development';
    const envFile = envType === 'production' ? '.env.production' : '.env.development';
    
    let mongoUri = '';
    if (envType === 'production') {
      console.log('\n새로운 MongoDB URI를 입력하세요');
      console.log('형식: mongodb+srv://username:password@cluster.mongodb.net/database');
      mongoUri = await question('MONGO_URI: ');
    } else {
      mongoUri = 'mongodb://localhost:27017/likorea_dev';
    }
    
    const openaiKey = await question('\nOpenAI API Key (선택사항, Enter로 건너뛰기): ');
    
    const envContent = `# ${envType.toUpperCase()} 환경 설정
# 생성일: ${new Date().toISOString()}

# 환경
NODE_ENV=${envType}
PORT=5001

# 데이터베이스
MONGO_URI=${mongoUri}

# 보안
JWT_SECRET=${newJwtSecret}
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS
ALLOWED_ORIGINS=${envType === 'production' ? 'https://likorea.com,https://www.likorea.com' : 'http://localhost:3000'}

# OpenAI (선택사항)
${openaiKey ? `OPENAI_API_KEY=${openaiKey}` : '# OPENAI_API_KEY=your-api-key-here'}

# 로깅
LOG_LEVEL=${envType === 'production' ? 'info' : 'debug'}
`;
    
    const envPath = path.join(__dirname, '..', envFile);
    fs.writeFileSync(envPath, envContent);
    console.log(`\n${colors.green}✅ ${envFile} 파일이 생성되었습니다!${colors.reset}`);
    
    // .env.example 업데이트
    const exampleContent = `# 환경 변수 예제 파일
# 이 파일을 복사하여 .env.development 또는 .env.production으로 만드세요

# 환경
NODE_ENV=development
PORT=5001

# 데이터베이스
MONGO_URI=mongodb://localhost:27017/likorea_dev

# 보안 (반드시 변경하세요!)
JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# OpenAI (선택사항)
# OPENAI_API_KEY=your-openai-api-key

# 로깅
LOG_LEVEL=debug
`;
    
    const examplePath = path.join(__dirname, '..', '.env.example');
    fs.writeFileSync(examplePath, exampleContent);
    console.log(`${colors.green}✅ .env.example 파일이 업데이트되었습니다!${colors.reset}`);
  }
  
  // 5. 보안 체크리스트
  console.log(`\n${colors.blue}📋 보안 체크리스트:${colors.reset}`);
  console.log('[ ] MongoDB Atlas에서 비밀번호 변경');
  console.log('[ ] OpenAI 플랫폼에서 API 키 재생성');
  console.log('[ ] 프로덕션 서버의 환경 변수 업데이트');
  console.log('[ ] 로컬 개발 환경의 .env 파일 업데이트');
  console.log('[ ] Git에서 민감한 정보가 포함된 파일 제거');
  console.log('[ ] 모든 팀원에게 크리덴셜 변경 공지');
  
  console.log(`\n${colors.yellow}Git에서 민감한 파일 제거:${colors.reset}`);
  console.log('git rm --cached backend/.env.production');
  console.log('git commit -m "chore: remove exposed credentials"');
  console.log('git push origin main');
  
  console.log(`\n${colors.red}⚠️  중요: 노출된 크리덴셜은 즉시 무효화하세요!${colors.reset}`);
  
  rl.close();
}

main().catch(console.error);
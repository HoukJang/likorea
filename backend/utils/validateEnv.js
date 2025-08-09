/**
 * 환경 변수 검증 유틸리티
 * 필수 환경 변수가 설정되어 있는지 확인하고 보안 경고를 표시
 */

const requiredEnvVars = {
  // 필수 환경 변수
  MONGO_URI: {
    required: true,
    description: 'MongoDB 연결 문자열',
    validator: (value) => {
      if (!value || value.length < 10) return false;
      // 프로덕션에서 localhost 사용 금지
      if (process.env.NODE_ENV === 'production' && value.includes('localhost')) {
        console.warn('⚠️  경고: 프로덕션 환경에서 localhost MongoDB를 사용하고 있습니다!');
        return false;
      }
      return true;
    }
  },
  JWT_SECRET: {
    required: true,
    description: 'JWT 토큰 시크릿',
    validator: (value) => {
      if (!value || value.length < 32) {
        console.error('❌ JWT_SECRET은 최소 32자 이상이어야 합니다.');
        return false;
      }
      // 약한 시크릿 감지
      const weakSecrets = ['secret', 'password', '123456', 'admin'];
      if (weakSecrets.some(weak => value.toLowerCase().includes(weak))) {
        console.error('❌ JWT_SECRET이 너무 약합니다. 강력한 무작위 문자열을 사용하세요.');
        return false;
      }
      return true;
    }
  },
  NODE_ENV: {
    required: true,
    description: '실행 환경',
    validator: (value) => ['development', 'production', 'test'].includes(value)
  },
  PORT: {
    required: false,
    description: '서버 포트',
    default: '5001',
    validator: (value) => {
      const port = parseInt(value);
      return !isNaN(port) && port > 0 && port <= 65535;
    }
  },
  ALLOWED_ORIGINS: {
    required: false,
    description: 'CORS 허용 도메인',
    default: 'http://localhost:3000',
    validator: (value) => {
      if (process.env.NODE_ENV === 'production' && value.includes('localhost')) {
        console.warn('⚠️  경고: 프로덕션 환경에서 localhost를 CORS 허용 목록에 포함하고 있습니다!');
      }
      return true;
    }
  }
};

/**
 * 환경 변수 검증 함수
 */
function validateEnvironment() {
  console.log('🔍 환경 변수 검증 중...\n');

  let hasError = false;
  const missingVars = [];
  const invalidVars = [];

  for (const [varName, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[varName];

    // 필수 변수 확인
    if (config.required && !value) {
      missingVars.push(`${varName}: ${config.description}`);
      hasError = true;
      continue;
    }

    // 기본값 설정
    if (!value && config.default) {
      process.env[varName] = config.default;
      console.log(`ℹ️  ${varName}: 기본값 사용 (${config.default})`);
      continue;
    }

    // 유효성 검증
    if (value && config.validator && !config.validator(value)) {
      invalidVars.push(`${varName}: ${config.description}`);
      hasError = true;
    }
  }

  // 에러 리포트
  if (missingVars.length > 0) {
    console.error('\n❌ 필수 환경 변수가 누락되었습니다:');
    missingVars.forEach(varInfo => console.error(`   - ${varInfo}`));
  }

  if (invalidVars.length > 0) {
    console.error('\n❌ 유효하지 않은 환경 변수:');
    invalidVars.forEach(varInfo => console.error(`   - ${varInfo}`));
  }

  // 보안 경고
  if (process.env.NODE_ENV === 'production') {
    console.log('\n🔐 프로덕션 환경 보안 체크:');

    // MongoDB 보안
    if (process.env.MONGO_URI && !process.env.MONGO_URI.includes('mongodb+srv://')) {
      console.warn('⚠️  MongoDB 연결이 암호화되지 않았습니다. mongodb+srv:// 사용을 권장합니다.');
    }

    // JWT 시크릿 길이
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 64) {
      console.warn('⚠️  프로덕션 환경에서는 JWT_SECRET을 64자 이상으로 설정하는 것을 권장합니다.');
    }
  }

  if (hasError) {
    console.error('\n❌ 환경 변수 검증 실패! .env.example 파일을 참고하여 설정하세요.\n');
    process.exit(1);
  }

  console.log('\n✅ 환경 변수 검증 완료!\n');
}

// 시크릿 생성 도우미 함수
function generateSecureSecret(length = 64) {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

// 환경 변수 설정 가이드 출력
function printSetupGuide() {
  console.log('\n📋 환경 변수 설정 가이드:\n');
  console.log('1. backend 디렉토리에 .env 파일을 생성하세요.');
  console.log('2. .env.example 파일을 참고하여 필요한 값을 설정하세요.');
  console.log('3. 보안을 위해 다음 명령으로 안전한 시크릿을 생성할 수 있습니다:\n');
  console.log('   JWT_SECRET 생성:');
  console.log('   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n');
  console.log('4. 절대로 .env 파일을 Git에 커밋하지 마세요!');
  console.log('5. 프로덕션 환경에서는 환경 변수 관리 서비스 사용을 권장합니다.\n');
}

module.exports = {
  validateEnvironment,
  generateSecureSecret,
  printSetupGuide
};
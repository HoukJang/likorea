/**
 * 비밀번호 정책 및 검증 유틸리티
 */

const bcrypt = require('bcryptjs');

// 비밀번호 정책 설정
const passwordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  commonPasswords: [
    'password', '12345678', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890',
    'likorea', 'longisland', 'newyork'
  ],
  // 비밀번호 만료 정책 (일 단위)
  expirationDays: 90,
  // 비밀번호 재사용 금지 횟수
  historyCount: 5,
  // 로그인 실패 잠금 정책
  maxFailedAttempts: 5,
  lockoutDuration: 30 * 60 * 1000 // 30분
};

/**
 * 비밀번호 강도 검증
 * @param {string} password - 검증할 비밀번호
 * @returns {Object} 검증 결과
 */
function validatePassword(password) {
  const errors = [];
  const warnings = [];

  // 기본 검증
  if (!password) {
    errors.push('비밀번호를 입력해주세요.');
    return { isValid: false, errors, warnings, strength: 0 };
  }

  // 길이 검증
  if (password.length < passwordPolicy.minLength) {
    errors.push(`비밀번호는 최소 ${passwordPolicy.minLength}자 이상이어야 합니다.`);
  }

  if (password.length > passwordPolicy.maxLength) {
    errors.push(`비밀번호는 최대 ${passwordPolicy.maxLength}자를 초과할 수 없습니다.`);
  }

  // 문자 종류 검증
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = new RegExp(`[${passwordPolicy.specialChars.replace(/[[\]\\]/g, '\\$&')}]`).test(password);

  if (passwordPolicy.requireUppercase && !hasUppercase) {
    errors.push('비밀번호에 대문자를 포함해야 합니다.');
  }

  if (passwordPolicy.requireLowercase && !hasLowercase) {
    errors.push('비밀번호에 소문자를 포함해야 합니다.');
  }

  if (passwordPolicy.requireNumbers && !hasNumbers) {
    errors.push('비밀번호에 숫자를 포함해야 합니다.');
  }

  if (passwordPolicy.requireSpecialChars && !hasSpecialChars) {
    errors.push('비밀번호에 특수문자를 포함해야 합니다.');
  }

  // 일반적인 비밀번호 검증
  const lowerPassword = password.toLowerCase();
  if (passwordPolicy.commonPasswords.some(common => lowerPassword.includes(common))) {
    errors.push('너무 일반적인 비밀번호입니다. 더 복잡한 비밀번호를 사용해주세요.');
  }

  // 연속된 문자 검증
  if (/(.)\1{2,}/.test(password)) {
    warnings.push('같은 문자가 3번 이상 연속으로 사용되었습니다.');
  }

  // 키보드 패턴 검증
  const keyboardPatterns = ['qwerty', 'asdfgh', 'zxcvbn', '123456', '987654'];
  if (keyboardPatterns.some(pattern => lowerPassword.includes(pattern))) {
    warnings.push('키보드 패턴이 감지되었습니다. 더 안전한 비밀번호를 권장합니다.');
  }

  // 비밀번호 강도 계산
  let strength = 0;
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 20;
  if (hasUppercase) strength += 15;
  if (hasLowercase) strength += 15;
  if (hasNumbers) strength += 15;
  if (hasSpecialChars) strength += 15;

  // 엔트로피 보너스
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 10) strength += 10;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    strength: Math.min(strength, 100),
    strengthText: getStrengthText(strength)
  };
}

/**
 * 비밀번호 강도 텍스트 반환
 * @param {number} strength - 강도 점수
 * @returns {string} 강도 텍스트
 */
function getStrengthText(strength) {
  if (strength < 30) return '매우 약함';
  if (strength < 50) return '약함';
  if (strength < 70) return '보통';
  if (strength < 90) return '강함';
  return '매우 강함';
}

/**
 * 비밀번호 해시 생성
 * @param {string} password - 원본 비밀번호
 * @returns {Promise<string>} 해시된 비밀번호
 */
async function hashPassword(password) {
  const saltRounds = 12; // 보안 강화를 위해 12 라운드 사용
  return bcrypt.hash(password, saltRounds);
}

/**
 * 비밀번호 검증
 * @param {string} password - 입력된 비밀번호
 * @param {string} hash - 저장된 해시
 * @returns {Promise<boolean>} 일치 여부
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * 안전한 임시 비밀번호 생성
 * @param {number} length - 비밀번호 길이 (기본: 12)
 * @returns {string} 임시 비밀번호
 */
function generateTemporaryPassword(length = 12) {
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specials = '!@#$%^&*';

  // 각 카테고리에서 최소 1개씩 보장
  let password = '';
  password += upperChars.charAt(Math.floor(Math.random() * upperChars.length));
  password += lowerChars.charAt(Math.floor(Math.random() * lowerChars.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += specials.charAt(Math.floor(Math.random() * specials.length));

  // 나머지 길이 채우기
  const allChars = upperChars + lowerChars + numbers + specials;
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // 섞기
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * 비밀번호 만료 여부 확인
 * @param {Date} lastPasswordChange - 마지막 비밀번호 변경일
 * @returns {Object} 만료 정보
 */
function checkPasswordExpiration(lastPasswordChange) {
  const now = new Date();
  const changeDate = new Date(lastPasswordChange);
  const daysSinceChange = Math.floor((now - changeDate) / (1000 * 60 * 60 * 24));
  const isExpired = daysSinceChange >= passwordPolicy.expirationDays;
  const daysRemaining = Math.max(0, passwordPolicy.expirationDays - daysSinceChange);

  return {
    isExpired,
    daysSinceChange,
    daysRemaining,
    expirationDate: new Date(changeDate.getTime() + (passwordPolicy.expirationDays * 24 * 60 * 60 * 1000))
  };
}

module.exports = {
  passwordPolicy,
  validatePassword,
  hashPassword,
  verifyPassword,
  generateTemporaryPassword,
  checkPasswordExpiration,
  getStrengthText
};
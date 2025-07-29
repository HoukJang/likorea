const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    authority: { type: Number, required: true, min: 1, max: 5, default: 3 },
    
    // 보안 관련 필드
    passwordChangedAt: { type: Date, default: Date.now },
    passwordHistory: [{ type: String }], // 이전 비밀번호 해시 (재사용 방지)
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lastFailedLogin: { type: Date },
    lockedUntil: { type: Date },
    
    // 2FA 관련 (향후 구현용)
    twoFactorSecret: { type: String },
    twoFactorEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 비밀번호 해시화 미들웨어
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    // 비밀번호 재사용 확인 (최근 5개)
    if (this.passwordHistory && this.passwordHistory.length > 0) {
      const recentPasswords = this.passwordHistory.slice(-5);
      for (const oldHash of recentPasswords) {
        const isReused = await bcrypt.compare(this.password, oldHash);
        if (isReused) {
          throw new Error('최근 사용한 비밀번호는 재사용할 수 없습니다.');
        }
      }
    }
    
    // 비밀번호 해시화
    const salt = await bcrypt.genSalt(12); // 보안 강화를 위해 12 라운드
    const hashedPassword = await bcrypt.hash(this.password, salt);
    
    // 비밀번호 히스토리에 추가
    if (!this.passwordHistory) {
      this.passwordHistory = [];
    }
    this.passwordHistory.push(hashedPassword);
    
    // 최대 5개까지만 유지
    if (this.passwordHistory.length > 5) {
      this.passwordHistory = this.passwordHistory.slice(-5);
    }
    
    this.password = hashedPassword;
    this.passwordChangedAt = new Date();
    
    next();
  } catch (error) {
    next(error);
  }
});

// 비밀번호 비교 메서드
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

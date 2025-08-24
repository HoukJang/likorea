const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'event'],
    default: 'info'
  },
  icon: {
    type: String,
    default: '📢'
  },
  link: {
    url: {
      type: String,
      trim: true
    },
    text: {
      type: String,
      trim: true,
      default: '자세히 보기'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0 // 높을수록 우선순위 높음
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  dismissible: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// 활성 배너 찾기
bannerSchema.statics.findActiveBanner = async function() {
  const now = new Date();
  return await this.findOne({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).sort({ priority: -1, createdAt: -1 });
};

module.exports = mongoose.model('Banner', bannerSchema);
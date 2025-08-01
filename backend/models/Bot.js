const mongoose = require('mongoose');

const botSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'inactive'
  },
  type: {
    type: String,
    enum: ['poster', 'analyzer', 'moderator'],
    default: 'poster'
  },
  lastActivity: {
    type: Date,
    default: null
  },
  settings: {
    autoPost: {
      type: Boolean,
      default: false
    },
    postInterval: {
      type: Number,
      default: 3600000 // 1시간
    },
    targetCategories: [{
      type: String
    }]
  },
  stats: {
    postsCreated: {
      type: Number,
      default: 0
    },
    lastPostDate: {
      type: Date,
      default: null
    }
  },
  persona: {
    age: Number,
    gender: String,
    occupation: String,
    interests: [String],
    personality: String,
    location: String,
    likoreaAccount: {
      username: String,
      password: String,
      email: String
    }
  },
  prompt: {
    base: {
      type: String,
      default: '당신은 롱아일랜드 한인 커뮤니티의 활발한 회원입니다.'
    },
    postingStyle: String,
    restaurantReviewTemplate: String
  },
  username: {
    type: String,
    unique: true,
    sparse: true
  },
  aiModel: {
    type: String,
    enum: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022'],
    default: 'claude-3-haiku-20240307'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bot', botSchema);
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
    enum: [
      // Claude models (현재 사용 가능한 모델)
      'claude-3-haiku-20240307', 
      'claude-3-5-haiku-20241022', 
      'claude-3-5-sonnet-20241022',
      // OpenAI models
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
      'gpt-4',
      'gpt-4-32k',
      'gpt-4-turbo',
      'gpt-4o',
      'gpt-4o-mini'
    ],
    default: 'claude-3-haiku-20240307'
  },
  aiProvider: {
    type: String,
    enum: ['claude', 'openai'],
    default: 'claude',
    // Provider is determined automatically based on aiModel
    set: function(val) {
      // Auto-detect provider based on model
      if (this.aiModel) {
        if (this.aiModel.startsWith('claude')) return 'claude';
        if (this.aiModel.startsWith('gpt')) return 'openai';
      }
      return val;
    }
  }
}, {
  timestamps: true
});

// Auto-set aiProvider based on aiModel
botSchema.pre('save', function(next) {
  if (this.aiModel) {
    if (this.aiModel.startsWith('claude')) {
      this.aiProvider = 'claude';
    } else if (this.aiModel.startsWith('gpt')) {
      this.aiProvider = 'openai';
    }
  }
  next();
});

module.exports = mongoose.model('Bot', botSchema);
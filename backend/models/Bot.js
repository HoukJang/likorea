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
    base: String,
    postingStyle: String,
    restaurantReviewTemplate: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bot', botSchema);
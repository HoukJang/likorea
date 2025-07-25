const mongoose = require('mongoose');

const trafficLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },
  path: {
    type: String,
    required: true
  },
  statusCode: {
    type: Number,
    required: true
  },
  responseTime: {
    type: Number, // milliseconds
    required: true
  },
  userAgent: {
    type: String,
    default: ''
  },
  ip: {
    type: String,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userAuthority: {
    type: Number,
    default: null
  },
  requestBody: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  error: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// 인덱스 설정 (성능 최적화)
trafficLogSchema.index({ timestamp: -1 });
trafficLogSchema.index({ path: 1, timestamp: -1 });
trafficLogSchema.index({ statusCode: 1, timestamp: -1 });
trafficLogSchema.index({ userId: 1, timestamp: -1 });

// TTL 인덱스 (30일 후 자동 삭제)
trafficLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('TrafficLog', trafficLogSchema); 
const mongoose = require('mongoose');

const adminNotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['bot_failure', 'system_alert', 'user_report', 'maintenance'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  botId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  readBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for performance
adminNotificationSchema.index({ isRead: 1, createdAt: -1 });
adminNotificationSchema.index({ botId: 1 });
adminNotificationSchema.index({ type: 1, severity: 1 });

// Static methods
adminNotificationSchema.statics.getUnreadCount = async function() {
  return await this.countDocuments({ isRead: false });
};

adminNotificationSchema.statics.getRecent = async function(limit = 10, unreadOnly = false) {
  const query = unreadOnly ? { isRead: false } : {};
  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('botId', 'name type')
    .populate('readBy', 'username');
};

// Instance methods
adminNotificationSchema.methods.markAsRead = async function(userId) {
  this.isRead = true;
  this.readAt = new Date();
  this.readBy = userId;
  return await this.save();
};

module.exports = mongoose.model('AdminNotification', adminNotificationSchema);
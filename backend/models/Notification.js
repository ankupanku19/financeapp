const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'goal_reminder',
      'goal_achieved',
      'goal_milestone',
      'income_added',
      'expense_alert',
      'savings_milestone',
      'bill_reminder',
      'security_alert',
      'account_update',
      'marketing',
      'system'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  channels: {
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      templateId: String
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      deviceTokens: [String]
    },
    inApp: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      read: { type: Boolean, default: false },
      readAt: Date
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  scheduledFor: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'cancelled'],
    default: 'pending'
  },
  metadata: {
    source: String, // 'system', 'user_action', 'scheduled'
    category: String,
    tags: [String]
  }
}, {
  timestamps: true,
  indexes: [
    { userId: 1, createdAt: -1 },
    { type: 1, status: 1 },
    { scheduledFor: 1 },
    { expiresAt: 1 }
  ]
});

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Methods
notificationSchema.methods.markAsRead = function() {
  this.channels.inApp.read = true;
  this.channels.inApp.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markChannelSent = function(channel) {
  this.channels[channel].sent = true;
  this.channels[channel].sentAt = new Date();
  
  // Update overall status if all channels are sent
  const allChannelsSent = Object.values(this.channels).every(ch => ch.sent);
  if (allChannelsSent) {
    this.status = 'sent';
  }
  
  return this.save();
};

// Static methods
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    userId,
    'channels.inApp.sent': true,
    'channels.inApp.read': false,
    status: 'sent'
  });
};

notificationSchema.statics.getUserNotifications = function(userId, limit = 20, skip = 0) {
  return this.find({
    userId,
    'channels.inApp.sent': true,
    status: 'sent'
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip)
  .populate('userId', 'name email');
};

module.exports = mongoose.model('Notification', notificationSchema);
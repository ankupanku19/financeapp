const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  channels: {
    email: {
      enabled: { type: Boolean, default: true },
      frequency: {
        type: String,
        enum: ['immediate', 'daily', 'weekly', 'never'],
        default: 'immediate'
      },
      types: {
        goal_reminder: { type: Boolean, default: true },
        goal_achieved: { type: Boolean, default: true },
        goal_milestone: { type: Boolean, default: true },
        income_added: { type: Boolean, default: true },
        expense_alert: { type: Boolean, default: true },
        savings_milestone: { type: Boolean, default: true },
        bill_reminder: { type: Boolean, default: true },
        security_alert: { type: Boolean, default: true },
        account_update: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false },
        system: { type: Boolean, default: true }
      }
    },
    push: {
      enabled: { type: Boolean, default: true },
      frequency: {
        type: String,
        enum: ['immediate', 'daily', 'weekly', 'never'],
        default: 'immediate'
      },
      types: {
        goal_reminder: { type: Boolean, default: true },
        goal_achieved: { type: Boolean, default: true },
        goal_milestone: { type: Boolean, default: true },
        income_added: { type: Boolean, default: true },
        expense_alert: { type: Boolean, default: true },
        savings_milestone: { type: Boolean, default: true },
        bill_reminder: { type: Boolean, default: true },
        security_alert: { type: Boolean, default: true },
        account_update: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false },
        system: { type: Boolean, default: true }
      }
    },
    inApp: {
      enabled: { type: Boolean, default: true },
      frequency: {
        type: String,
        enum: ['immediate', 'daily', 'weekly', 'never'],
        default: 'immediate'
      },
      types: {
        goal_reminder: { type: Boolean, default: true },
        goal_achieved: { type: Boolean, default: true },
        goal_milestone: { type: Boolean, default: true },
        income_added: { type: Boolean, default: true },
        expense_alert: { type: Boolean, default: true },
        savings_milestone: { type: Boolean, default: true },
        bill_reminder: { type: Boolean, default: true },
        security_alert: { type: Boolean, default: true },
        account_update: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false },
        system: { type: Boolean, default: true }
      }
    }
  },
  quietHours: {
    enabled: { type: Boolean, default: false },
    start: { type: String, default: '22:00' }, // HH:MM format
    end: { type: String, default: '08:00' },
    timezone: { type: String, default: 'UTC' }
  },
  deviceTokens: [{
    token: String,
    platform: { type: String, enum: ['ios', 'android', 'web'] },
    lastUsed: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  }]
}, {
  timestamps: true
});

// Methods
notificationPreferenceSchema.methods.isChannelEnabled = function(channel, type) {
  return this.channels[channel]?.enabled && 
         this.channels[channel]?.types?.[type] !== false;
};

notificationPreferenceSchema.methods.isInQuietHours = function() {
  if (!this.quietHours.enabled) return false;
  
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM
  
  const start = this.quietHours.start;
  const end = this.quietHours.end;
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  }
  
  // Handle same-day quiet hours (e.g., 22:00 to 23:00)
  return currentTime >= start && currentTime <= end;
};

notificationPreferenceSchema.methods.addDeviceToken = function(token, platform) {
  const existingToken = this.deviceTokens.find(dt => dt.token === token);
  
  if (existingToken) {
    existingToken.lastUsed = new Date();
    existingToken.isActive = true;
  } else {
    this.deviceTokens.push({
      token,
      platform,
      lastUsed: new Date(),
      isActive: true
    });
  }
  
  return this.save();
};

notificationPreferenceSchema.methods.removeDeviceToken = function(token) {
  this.deviceTokens = this.deviceTokens.filter(dt => dt.token !== token);
  return this.save();
};

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);

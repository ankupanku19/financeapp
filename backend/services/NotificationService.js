const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const User = require('../models/User');
const EmailService = require('./EmailService');
const PushService = require('./PushService');

class NotificationService {
  constructor() {
    this.emailService = new EmailService();
    this.pushService = new PushService();
  }

  /**
   * Create and send a notification
   */
  async sendNotification({
    userId,
    type,
    title,
    message,
    data = {},
    channels = ['inApp', 'push', 'email'],
    priority = 'medium',
    scheduledFor = new Date(),
    metadata = {}
  }) {
    try {
      // Get user preferences
      const preferences = await NotificationPreference.findOne({ userId });
      if (!preferences) {
        throw new Error('User notification preferences not found');
      }

      // Check if user is in quiet hours
      if (preferences.isInQuietHours() && priority !== 'urgent') {
        scheduledFor = this.getNextAvailableTime(preferences.quietHours);
      }

      // Create notification record
      const notification = new Notification({
        userId,
        type,
        title,
        message,
        data,
        channels: {
          email: { sent: false },
          push: { sent: false },
          inApp: { sent: false }
        },
        priority,
        scheduledFor,
        metadata
      });

      await notification.save();

      // Process each channel
      const channelPromises = channels.map(channel => 
        this.processChannel(notification, channel, preferences)
      );

      await Promise.allSettled(channelPromises);

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Process notification for a specific channel
   */
  async processChannel(notification, channel, preferences) {
    try {
      // Check if channel is enabled for this notification type
      if (!preferences.isChannelEnabled(channel, notification.type)) {
        console.log(`Channel ${channel} disabled for type ${notification.type}`);
        return;
      }

      // Check if notification should be sent now
      if (notification.scheduledFor > new Date()) {
        console.log(`Notification scheduled for ${notification.scheduledFor}`);
        return;
      }

      switch (channel) {
        case 'email':
          await this.sendEmailNotification(notification, preferences);
          break;
        case 'push':
          await this.sendPushNotification(notification, preferences);
          break;
        case 'inApp':
          await this.sendInAppNotification(notification);
          break;
      }

      // Mark channel as sent
      await notification.markChannelSent(channel);
    } catch (error) {
      console.error(`Error processing ${channel} notification:`, error);
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(notification, preferences) {
    try {
      const user = await User.findById(notification.userId);
      if (!user || !user.email) {
        throw new Error('User email not found');
      }

      const emailData = {
        to: user.email,
        subject: notification.title,
        template: this.getEmailTemplate(notification.type),
        data: {
          userName: user.name,
          title: notification.title,
          message: notification.message,
          ...notification.data
        }
      };

      await this.emailService.sendEmail(emailData);
      console.log(`Email notification sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending email notification:', error);
      throw error;
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(notification, preferences) {
    try {
      const activeTokens = preferences.deviceTokens
        .filter(dt => dt.isActive)
        .map(dt => dt.token);

      if (activeTokens.length === 0) {
        console.log('No active device tokens found');
        return;
      }

      const pushData = {
        tokens: activeTokens,
        title: notification.title,
        body: notification.message,
        data: {
          notificationId: notification._id.toString(),
          type: notification.type,
          ...notification.data
        },
        priority: notification.priority
      };

      await this.pushService.sendPushNotification(pushData);
      console.log(`Push notification sent to ${activeTokens.length} devices`);
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Send in-app notification
   */
  async sendInAppNotification(notification) {
    try {
      // In-app notifications are automatically available via API
      // This method just marks the channel as sent
      console.log(`In-app notification created for user ${notification.userId}`);
    } catch (error) {
      console.error('Error creating in-app notification:', error);
      throw error;
    }
  }

  /**
   * Get email template for notification type
   */
  getEmailTemplate(type) {
    const templates = {
      goal_reminder: 'goal-reminder',
      goal_achieved: 'goal-achieved',
      goal_milestone: 'goal-milestone',
      income_added: 'income-added',
      expense_alert: 'expense-alert',
      savings_milestone: 'savings-milestone',
      bill_reminder: 'bill-reminder',
      security_alert: 'security-alert',
      account_update: 'account-update',
      marketing: 'marketing',
      system: 'system'
    };

    return templates[type] || 'default';
  }

  /**
   * Get next available time outside quiet hours
   */
  getNextAvailableTime(quietHours) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Set to end of quiet hours tomorrow
    const [hours, minutes] = quietHours.end.split(':');
    tomorrow.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return tomorrow;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const notifications = await Notification.getUserNotifications(userId, limit, skip);
    const totalCount = await Notification.countDocuments({
      userId,
      'channels.inApp.sent': true,
      status: 'sent'
    });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      userId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await notification.markAsRead();
    return notification;
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    return await Notification.getUnreadCount(userId);
  }

  /**
   * Bulk mark as read
   */
  async markAllAsRead(userId) {
    await Notification.updateMany(
      {
        userId,
        'channels.inApp.sent': true,
        'channels.inApp.read': false
      },
      {
        $set: {
          'channels.inApp.read': true,
          'channels.inApp.readAt': new Date()
        }
      }
    );
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications() {
    const now = new Date();
    
    const scheduledNotifications = await Notification.find({
      status: 'pending',
      scheduledFor: { $lte: now }
    }).limit(100);

    console.log(`Processing ${scheduledNotifications.length} scheduled notifications`);

    for (const notification of scheduledNotifications) {
      try {
        const preferences = await NotificationPreference.findOne({
          userId: notification.userId
        });

        if (!preferences) continue;

        // Process each channel
        const channels = ['inApp', 'push', 'email'];
        for (const channel of channels) {
          await this.processChannel(notification, channel, preferences);
        }

        notification.status = 'sent';
        await notification.save();
      } catch (error) {
        console.error(`Error processing notification ${notification._id}:`, error);
        notification.status = 'failed';
        await notification.save();
      }
    }
  }
}

module.exports = NotificationService;

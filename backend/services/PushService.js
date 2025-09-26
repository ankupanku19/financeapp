const { Expo } = require('expo-server-sdk');

class PushService {
  constructor() {
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
      useFcmV1: true
    });
  }

  /**
   * Send push notification
   */
  async sendPushNotification({ tokens, title, body, data = {}, priority = 'normal' }) {
    try {
      // Validate tokens
      const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));
      
      if (validTokens.length === 0) {
        throw new Error('No valid Expo push tokens provided');
      }

      // Create messages
      const messages = validTokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data: {
          ...data,
          timestamp: Date.now()
        },
        priority: priority === 'high' ? 'high' : 'normal',
        channelId: 'default'
      }));

      // Send in chunks
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      // Handle receipts
      await this.handleReceipts(tickets);

      return tickets;
    } catch (error) {
      console.error('Error sending push notifications:', error);
      throw error;
    }
  }

  /**
   * Handle push notification receipts
   */
  async handleReceipts(tickets) {
    const receiptIds = tickets
      .filter(ticket => ticket.status === 'ok')
      .map(ticket => ticket.id);

    if (receiptIds.length === 0) return;

    try {
      const receipts = await this.expo.getPushNotificationReceiptsAsync(receiptIds);
      
      for (const receiptId in receipts) {
        const receipt = receipts[receiptId];
        
        if (receipt.status === 'error') {
          console.error(`Push notification error:`, receipt.message);
          
          // Handle invalid tokens
          if (receipt.details && receipt.details.error === 'DeviceNotRegistered') {
            await this.handleInvalidToken(receiptId);
          }
        }
      }
    } catch (error) {
      console.error('Error handling receipts:', error);
    }
  }

  /**
   * Handle invalid device token
   */
  async handleInvalidToken(tokenId) {
    try {
      // Remove invalid token from user preferences
      const NotificationPreference = require('../models/NotificationPreference');
      
      await NotificationPreference.updateMany(
        { 'deviceTokens.token': tokenId },
        { 
          $set: { 
            'deviceTokens.$.isActive': false,
            'deviceTokens.$.lastUsed': new Date()
          }
        }
      );
      
      console.log(`Marked token ${tokenId} as inactive`);
    } catch (error) {
      console.error('Error handling invalid token:', error);
    }
  }

  /**
   * Send goal reminder push
   */
  async sendGoalReminder(userTokens, goal) {
    return this.sendPushNotification({
      tokens: userTokens,
      title: '🎯 Goal Reminder',
      body: `Don't forget about your goal: ${goal.name}. You're ${goal.progress}% there!`,
      data: {
        type: 'goal_reminder',
        goalId: goal._id.toString(),
        screen: 'goals'
      },
      priority: 'normal'
    });
  }

  /**
   * Send goal achievement push
   */
  async sendGoalAchievement(userTokens, goal) {
    return this.sendPushNotification({
      tokens: userTokens,
      title: '🎉 Goal Achieved!',
      body: `Congratulations! You've achieved your goal: ${goal.name}`,
      data: {
        type: 'goal_achieved',
        goalId: goal._id.toString(),
        screen: 'goals'
      },
      priority: 'high'
    });
  }

  /**
   * Send expense alert push
   */
  async sendExpenseAlert(userTokens, expense) {
    return this.sendPushNotification({
      tokens: userTokens,
      title: '💰 Expense Alert',
      body: `You've spent $${expense.amount} on ${expense.category}`,
      data: {
        type: 'expense_alert',
        expenseId: expense._id.toString(),
        screen: 'expenses'
      },
      priority: 'normal'
    });
  }

  /**
   * Send security alert push
   */
  async sendSecurityAlert(userTokens, alertType, details) {
    return this.sendPushNotification({
      tokens: userTokens,
      title: '🔒 Security Alert',
      body: 'Unusual activity detected on your account',
      data: {
        type: 'security_alert',
        alertType,
        details,
        screen: 'security'
      },
      priority: 'high'
    });
  }

  /**
   * Send bill reminder push
   */
  async sendBillReminder(userTokens, bill) {
    return this.sendPushNotification({
      tokens: userTokens,
      title: '📅 Bill Reminder',
      body: `Your ${bill.name} bill of $${bill.amount} is due ${bill.dueDate}`,
      data: {
        type: 'bill_reminder',
        billId: bill._id.toString(),
        screen: 'bills'
      },
      priority: 'normal'
    });
  }

  /**
   * Send savings milestone push
   */
  async sendSavingsMilestone(userTokens, milestone) {
    return this.sendPushNotification({
      tokens: userTokens,
      title: '💎 Savings Milestone',
      body: `You've reached a savings milestone: $${milestone.amount}`,
      data: {
        type: 'savings_milestone',
        milestoneId: milestone._id.toString(),
        screen: 'savings'
      },
      priority: 'normal'
    });
  }

  /**
   * Send income added push
   */
  async sendIncomeAdded(userTokens, income) {
    return this.sendPushNotification({
      tokens: userTokens,
      title: '💵 Income Added',
      body: `You've added $${income.amount} to your income`,
      data: {
        type: 'income_added',
        incomeId: income._id.toString(),
        screen: 'income'
      },
      priority: 'normal'
    });
  }
}

module.exports = PushService;

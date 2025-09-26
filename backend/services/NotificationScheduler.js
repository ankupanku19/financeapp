const cron = require('node-cron');
const NotificationService = require('./NotificationService');
const Goal = require('../models/Goal');
const User = require('../models/User');

class NotificationScheduler {
  constructor() {
    this.notificationService = new NotificationService();
    this.jobs = new Map();
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    console.log('Starting notification scheduler...');
    
    // Process scheduled notifications every minute
    this.scheduleJob('process-scheduled', '* * * * *', () => {
      this.notificationService.processScheduledNotifications();
    });

    // Daily goal reminders at 9 AM
    this.scheduleJob('goal-reminders', '0 9 * * *', () => {
      this.sendDailyGoalReminders();
    });

    // Weekly financial summary on Sundays at 10 AM
    this.scheduleJob('weekly-summary', '0 10 * * 0', () => {
      this.sendWeeklyFinancialSummary();
    });

    // Monthly progress reports on the 1st at 8 AM
    this.scheduleJob('monthly-report', '0 8 1 * *', () => {
      this.sendMonthlyProgressReport();
    });

    // Bill reminders check every day at 8 AM
    this.scheduleJob('bill-reminders', '0 8 * * *', () => {
      this.sendBillReminders();
    });

    // Savings milestone checks every day at 7 AM
    this.scheduleJob('savings-milestones', '0 7 * * *', () => {
      this.checkSavingsMilestones();
    });

    console.log('Notification scheduler started successfully');
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    console.log('Stopping notification scheduler...');
    
    this.jobs.forEach((job, name) => {
      job.destroy();
      console.log(`Stopped job: ${name}`);
    });
    
    this.jobs.clear();
    console.log('Notification scheduler stopped');
  }

  /**
   * Schedule a cron job
   */
  scheduleJob(name, cronExpression, task) {
    try {
      const job = cron.schedule(cronExpression, task, {
        scheduled: true,
        timezone: 'UTC'
      });

      this.jobs.set(name, job);
      console.log(`Scheduled job: ${name} (${cronExpression})`);
    } catch (error) {
      console.error(`Error scheduling job ${name}:`, error);
    }
  }

  /**
   * Send daily goal reminders
   */
  async sendDailyGoalReminders() {
    try {
      console.log('Sending daily goal reminders...');
      
      const users = await User.find({}).populate('goals');
      
      for (const user of users) {
        const activeGoals = user.goals.filter(goal => 
          goal.status === 'active' && 
          goal.targetDate > new Date()
        );

        if (activeGoals.length > 0) {
          // Find goals that need attention
          const goalsNeedingAttention = activeGoals.filter(goal => {
            const daysRemaining = Math.ceil((goal.targetDate - new Date()) / (1000 * 60 * 60 * 24));
            const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
            
            // Remind if less than 30 days remaining or progress is behind schedule
            return daysRemaining <= 30 || progressPercentage < (daysRemaining / 365) * 100;
          });

          if (goalsNeedingAttention.length > 0) {
            const goalNames = goalsNeedingAttention.map(g => g.name).join(', ');
            
            await this.notificationService.sendNotification({
              userId: user._id,
              type: 'goal_reminder',
              title: '🎯 Daily Goal Reminder',
              message: `Don\'t forget about your goals: ${goalNames}. Keep up the great work!`,
              channels: ['inApp', 'push'],
              priority: 'medium',
              metadata: {
                source: 'scheduled',
                category: 'goal_reminder'
              }
            });
          }
        }
      }
      
      console.log('Daily goal reminders sent successfully');
    } catch (error) {
      console.error('Error sending daily goal reminders:', error);
    }
  }

  /**
   * Send weekly financial summary
   */
  async sendWeeklyFinancialSummary() {
    try {
      console.log('Sending weekly financial summaries...');
      
      const users = await User.find({});
      
      for (const user of users) {
        // Get user's financial data for the past week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        // This would typically involve more complex queries to get actual financial data
        // For now, we'll send a generic weekly summary
        
        await this.notificationService.sendNotification({
          userId: user._id,
          type: 'system',
          title: '📊 Weekly Financial Summary',
          message: 'Check your weekly financial progress and see how you\'re doing with your goals.',
          channels: ['inApp', 'email'],
          priority: 'low',
          metadata: {
            source: 'scheduled',
            category: 'weekly_summary'
          }
        });
      }
      
      console.log('Weekly financial summaries sent successfully');
    } catch (error) {
      console.error('Error sending weekly financial summaries:', error);
    }
  }

  /**
   * Send monthly progress report
   */
  async sendMonthlyProgressReport() {
    try {
      console.log('Sending monthly progress reports...');
      
      const users = await User.find({});
      
      for (const user of users) {
        await this.notificationService.sendNotification({
          userId: user._id,
          type: 'system',
          title: '📈 Monthly Progress Report',
          message: 'Your monthly financial progress report is ready. See how you\'ve improved this month!',
          channels: ['inApp', 'email'],
          priority: 'medium',
          metadata: {
            source: 'scheduled',
            category: 'monthly_report'
          }
        });
      }
      
      console.log('Monthly progress reports sent successfully');
    } catch (error) {
      console.error('Error sending monthly progress reports:', error);
    }
  }

  /**
   * Send bill reminders
   */
  async sendBillReminders() {
    try {
      console.log('Checking for bill reminders...');
      
      // This would typically check a bills collection
      // For now, we'll send a generic reminder
      
      const users = await User.find({});
      
      for (const user of users) {
        await this.notificationService.sendNotification({
          userId: user._id,
          type: 'bill_reminder',
          title: '📅 Bill Reminder',
          message: 'Don\'t forget to pay your upcoming bills. Check your bill calendar for due dates.',
          channels: ['inApp', 'push'],
          priority: 'medium',
          metadata: {
            source: 'scheduled',
            category: 'bill_reminder'
          }
        });
      }
      
      console.log('Bill reminders sent successfully');
    } catch (error) {
      console.error('Error sending bill reminders:', error);
    }
  }

  /**
   * Check for savings milestones
   */
  async checkSavingsMilestones() {
    try {
      console.log('Checking for savings milestones...');
      
      const users = await User.find({}).populate('savings');
      
      for (const user of users) {
        if (user.savings && user.savings.length > 0) {
          const totalSavings = user.savings.reduce((sum, saving) => sum + saving.amount, 0);
          
          // Check for milestone achievements (every $1000)
          const milestone = Math.floor(totalSavings / 1000) * 1000;
          const previousMilestone = milestone - 1000;
          
          if (milestone > 0 && totalSavings >= milestone && totalSavings < milestone + 100) {
            await this.notificationService.sendNotification({
              userId: user._id,
              type: 'savings_milestone',
              title: '💎 Savings Milestone Achieved!',
              message: `Congratulations! You\'ve reached a savings milestone of $${milestone.toLocaleString()}.`,
              channels: ['inApp', 'push', 'email'],
              priority: 'high',
              metadata: {
                source: 'scheduled',
                category: 'savings_milestone',
                milestone: milestone
              }
            });
          }
        }
      }
      
      console.log('Savings milestone checks completed');
    } catch (error) {
      console.error('Error checking savings milestones:', error);
    }
  }

  /**
   * Send immediate notification for goal achievement
   */
  async sendGoalAchievementNotification(userId, goal) {
    try {
      await this.notificationService.sendNotification({
        userId,
        type: 'goal_achieved',
        title: '🎉 Goal Achieved!',
        message: `Congratulations! You\'ve achieved your goal: ${goal.name}`,
        channels: ['inApp', 'push', 'email'],
        priority: 'high',
        metadata: {
          source: 'user_action',
          category: 'goal_achieved',
          goalId: goal._id
        }
      });
    } catch (error) {
      console.error('Error sending goal achievement notification:', error);
    }
  }

  /**
   * Send expense alert notification
   */
  async sendExpenseAlertNotification(userId, expense) {
    try {
      await this.notificationService.sendNotification({
        userId,
        type: 'expense_alert',
        title: '💰 Expense Alert',
        message: `You\'ve spent $${expense.amount} on ${expense.category}. Keep track of your spending!`,
        channels: ['inApp', 'push'],
        priority: 'medium',
        metadata: {
          source: 'user_action',
          category: 'expense_alert',
          expenseId: expense._id
        }
      });
    } catch (error) {
      console.error('Error sending expense alert notification:', error);
    }
  }

  /**
   * Send security alert notification
   */
  async sendSecurityAlertNotification(userId, alertType, details) {
    try {
      await this.notificationService.sendNotification({
        userId,
        type: 'security_alert',
        title: '🔒 Security Alert',
        message: 'Unusual activity detected on your account. Please review your recent activity.',
        channels: ['inApp', 'push', 'email'],
        priority: 'urgent',
        metadata: {
          source: 'system',
          category: 'security_alert',
          alertType,
          details
        }
      });
    } catch (error) {
      console.error('Error sending security alert notification:', error);
    }
  }
}

module.exports = NotificationScheduler;

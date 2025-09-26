const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect: auth } = require('../middleware/auth');
const NotificationService = require('../services/NotificationService');
const NotificationPreference = require('../models/NotificationPreference');

const notificationService = new NotificationService();

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const result = await notificationService.getUserNotifications(
      userId, 
      parseInt(page), 
      parseInt(limit)
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await notificationService.markAsRead(id, userId);

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get user notification preferences
 * @access  Private
 */
router.get('/preferences', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    let preferences = await NotificationPreference.findOne({ userId });
    
    if (!preferences) {
      // Create default preferences
      preferences = new NotificationPreference({ userId });
      await preferences.save();
    }

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences'
    });
  }
});

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update user notification preferences
 * @access  Private
 */
router.put('/preferences', [
  auth,
  body('channels.email.enabled').optional().isBoolean(),
  body('channels.push.enabled').optional().isBoolean(),
  body('channels.inApp.enabled').optional().isBoolean(),
  body('quietHours.enabled').optional().isBoolean(),
  body('quietHours.start').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('quietHours.end').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const updateData = req.body;

    let preferences = await NotificationPreference.findOne({ userId });
    
    if (!preferences) {
      preferences = new NotificationPreference({ userId });
    }

    // Update preferences
    Object.assign(preferences, updateData);
    await preferences.save();

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences'
    });
  }
});

/**
 * @route   POST /api/notifications/device-token
 * @desc    Register device token for push notifications
 * @access  Private
 */
router.post('/device-token', [
  auth,
  body('token').notEmpty().withMessage('Device token is required'),
  body('platform').isIn(['ios', 'android', 'web']).withMessage('Invalid platform')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { token, platform } = req.body;

    let preferences = await NotificationPreference.findOne({ userId });
    
    if (!preferences) {
      preferences = new NotificationPreference({ userId });
    }

    await preferences.addDeviceToken(token, platform);

    res.json({
      success: true,
      message: 'Device token registered successfully'
    });
  } catch (error) {
    console.error('Error registering device token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register device token'
    });
  }
});

/**
 * @route   DELETE /api/notifications/device-token
 * @desc    Remove device token
 * @access  Private
 */
router.delete('/device-token', [
  auth,
  body('token').notEmpty().withMessage('Device token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { token } = req.body;

    const preferences = await NotificationPreference.findOne({ userId });
    
    if (preferences) {
      await preferences.removeDeviceToken(token);
    }

    res.json({
      success: true,
      message: 'Device token removed successfully'
    });
  } catch (error) {
    console.error('Error removing device token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove device token'
    });
  }
});

/**
 * @route   POST /api/notifications/test
 * @desc    Send test notification (admin only)
 * @access  Private
 */
router.post('/test', [
  auth,
  body('type').isIn([
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
  ]).withMessage('Invalid notification type'),
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { type, title, message, channels = ['inApp'] } = req.body;

    const notification = await notificationService.sendNotification({
      userId,
      type,
      title,
      message,
      channels,
      priority: 'normal',
      metadata: {
        source: 'test',
        category: 'test'
      }
    });

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    });
  }
});

module.exports = router;
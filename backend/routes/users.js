const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { StatusCodes } = require('http-status-codes');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          preferences: user.preferences,
          subscription: user.subscription,
          lastLoginAt: user.lastLoginAt,
          loginCount: user.loginCount,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update preferences
// @route   PATCH /api/users/preferences
// @access  Private
router.patch('/preferences', async (req, res) => {
  try {
    const updates = req.body?.preferences || {};
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, error: 'User not found' });
    }

    user.preferences = { ...user.preferences.toObject(), ...updates };
    await user.save();

    res.status(StatusCodes.OK).json({ success: true, data: { preferences: user.preferences } });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: 'Server error' });
  }
});

// @desc    Deactivate user account
// @route   DELETE /api/users/account
// @access  Private
router.delete('/account', async (req, res) => {
  try {
    await req.user.softDelete();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
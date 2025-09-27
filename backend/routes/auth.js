const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Category = require('../models/Category');
const { protect, validateToken } = require('../middleware/auth');
const { StatusCodes } = require('http-status-codes');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const router = express.Router();

// Email transporter setup - using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 30000,
  greetingTimeout: 10000,
  socketTimeout: 30000,
  pool: true,
  maxConnections: 5,
  maxMessages: 100
});

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'strict'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .cookie('refreshToken', refreshToken, {
      ...options,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    })
    .json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          preferences: user.preferences,
          subscription: user.subscription,
          createdAt: user.createdAt
        }
      }
    });
};

// @desc    Register user (send OTP)
// @route   POST /api/auth/register
// @access  Public
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store registration data temporarily (you might want to use Redis for this)
    const tempUserData = {
      email,
      password, // Don't hash here - let the pre-save middleware handle it
      otp,
      otpExpires,
      flow: 'register'
    };

    // Store in memory or Redis (for production, use Redis)
    global.tempRegistrations = global.tempRegistrations || new Map();
    global.tempRegistrations.set(email, tempUserData);

    // Send OTP email
    try {
      console.log('Attempting to send OTP email to:', email);
      console.log('SMTP Config:', {
        host: 'smtp.gmail.com',
        port: 587,
        user: process.env.SMTP_USER?.substring(0, 5) + '***'
      });

      // Verify transporter connection first
      await transporter.verify();
      console.log('SMTP connection verified successfully');

      const mailOptions = {
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: email,
        subject: 'Verify Your Email - Finance App',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366F1;">Welcome to Finance App!</h2>
            <p>Please verify your email address by entering this code:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #6366F1; font-size: 32px; margin: 0;">${otp}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('OTP email sent successfully:', result.messageId);

    } catch (emailError) {
      console.error('Email sending error:', emailError);

      // Return error response instead of continuing silently
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to send email verification code'
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error during registration'
    });
  }
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('flow').isIn(['register', 'reset']).withMessage('Invalid flow')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    const { email, otp, flow } = req.body;

    // Get temp registration data
    global.tempRegistrations = global.tempRegistrations || new Map();
    const tempData = global.tempRegistrations.get(email);

    if (!tempData || tempData.flow !== flow) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Invalid verification request'
      });
    }

    // Check OTP expiry
    if (new Date() > tempData.otpExpires) {
      global.tempRegistrations.delete(email);
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'OTP has expired'
      });
    }

    // Verify OTP
    if (tempData.otp !== otp) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Invalid OTP'
      });
    }

    // Generate temporary token for profile completion
    const tempToken = jwt.sign(
      { email, flow, verified: true },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        tempToken,
        message: 'Email verified successfully'
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error during OTP verification'
    });
  }
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
router.post('/resend-otp', [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('flow').isIn(['register', 'reset']).withMessage('Invalid flow')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    const { email, flow } = req.body;

    // Get temp registration data
    global.tempRegistrations = global.tempRegistrations || new Map();
    const tempData = global.tempRegistrations.get(email);

    if (!tempData || tempData.flow !== flow) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'No pending verification for this email'
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update temp data
    tempData.otp = otp;
    tempData.otpExpires = otpExpires;
    global.tempRegistrations.set(email, tempData);

    // Send OTP email
    try {
      console.log('Attempting to resend OTP email to:', email);

      // Verify transporter connection first
      await transporter.verify();
      console.log('SMTP connection verified successfully for resend');

      const mailOptions = {
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: email,
        subject: 'Verify Your Email - Finance App',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366F1;">Email Verification</h2>
            <p>Here's your new verification code:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #6366F1; font-size: 32px; margin: 0;">${otp}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
          </div>
        `
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('OTP resend email sent successfully:', result.messageId);

    } catch (emailError) {
      console.error('Email resend error:', emailError);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to send email verification code'
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'New verification code sent'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error during OTP resend'
    });
  }
});

// @desc    Complete profile (name, DOB, gender)
// @route   POST /api/auth/complete-profile
// @access  Private (temp token)
router.post('/complete-profile', [
  body('name').notEmpty().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('dateOfBirth').isISO8601().withMessage('Please provide a valid date of birth'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Please select a valid gender')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    // Verify temp token
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('Complete Profile - Token received:', token ? 'Present' : 'Missing');
    console.log('Complete Profile - Headers:', req.headers.authorization);
    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'No token provided'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      console.log('Complete Profile - Token decoded successfully:', decoded);
    } catch (error) {
      console.log('Complete Profile - Token verification failed:', error.message);
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid token'
      });
    }

    if (!decoded.verified || decoded.flow !== 'register') {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid token'
      });
    }

    const { name, dateOfBirth, gender } = req.body;

    // Generate new temp token with profile data
    const newTempToken = jwt.sign(
      { 
        email: decoded.email, 
        flow: 'register', 
        verified: true,
        profileData: { name, dateOfBirth, gender }
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        tempToken: newTempToken,
        message: 'Profile information saved'
      }
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error during profile completion'
    });
  }
});

// @desc    Set avatar
// @route   POST /api/auth/set-avatar
// @access  Private (temp token)
router.post('/set-avatar', [
  body('avatarUrl').notEmpty().withMessage('Avatar URL is required'),
  body('avatarType').isIn(['custom', 'generated']).withMessage('Invalid avatar type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    // Verify temp token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'No token provided'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (error) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid token'
      });
    }

    if (!decoded.verified || !decoded.profileData) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid token or missing profile data'
      });
    }

    const { avatarUrl, avatarType } = req.body;

    // Generate new temp token with avatar data
    const newTempToken = jwt.sign(
      { 
        email: decoded.email, 
        flow: 'register', 
        verified: true,
        profileData: decoded.profileData,
        avatarData: { avatarUrl, avatarType }
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        tempToken: newTempToken,
        message: 'Avatar saved'
      }
    });
  } catch (error) {
    console.error('Set avatar error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error during avatar setup'
    });
  }
});

// @desc    Complete onboarding (create user)
// @route   POST /api/auth/complete-onboarding
// @access  Private (temp token)
router.post('/complete-onboarding', [
  body('financeAnswers').isObject().withMessage('Finance answers are required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    // Verify temp token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'No token provided'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (error) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid token'
      });
    }

    if (!decoded.verified || !decoded.profileData || !decoded.avatarData) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid token or missing data'
      });
    }

    const { financeAnswers } = req.body;

    // Get original registration data
    global.tempRegistrations = global.tempRegistrations || new Map();
    const tempData = global.tempRegistrations.get(decoded.email);

    if (!tempData) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Registration data not found'
      });
    }

    // Create user with all data
    const user = await User.create({
      name: decoded.profileData.name,
      email: decoded.email,
      password: tempData.password,
      dateOfBirth: decoded.profileData.dateOfBirth,
      gender: decoded.profileData.gender,
      avatar: {
        url: decoded.avatarData.avatarUrl,
        type: decoded.avatarData.avatarType
      },
      financeProfile: financeAnswers,
      isActive: true,
      emailVerified: true
    });

    // Create default categories
    try {
      await Category.createDefaultCategories(user._id);
    } catch (categoryError) {
      console.error('Error creating default categories:', categoryError);
    }

    // Update login info
    await user.updateLastLogin();

    // Clean up temp data
    global.tempRegistrations.delete(decoded.email);

    // Send final auth response
    sendTokenResponse(user, StatusCodes.CREATED, res);
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error during onboarding completion'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    const { email, password } = req.body;

    // Check for user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update login info
    await user.updateLastLogin();

    sendTokenResponse(user, StatusCodes.OK, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error during login'
    });
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, (req, res) => {
  res
    .cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    })
    .cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    })
    .status(StatusCodes.OK)
    .json({
      success: true,
      message: 'User logged out successfully'
    });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
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
          createdAt: user.createdAt,
          permissions: user.getPermissions()
        }
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    let refreshToken;

    // Get refresh token from cookie or body
    if (req.cookies && req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    } else if (req.body.refreshToken) {
      refreshToken = req.body.refreshToken;
    }

    if (!refreshToken) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Refresh token not provided'
      });
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback_secret'
      );

      // Get user
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }

      // Generate new tokens
      const newToken = user.generateAuthToken();
      const newRefreshToken = user.generateRefreshToken();

      const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      };

      res
        .cookie('token', newToken, {
          ...options,
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })
        .cookie('refreshToken', newRefreshToken, {
          ...options,
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        })
        .status(StatusCodes.OK)
        .json({
          success: true,
          data: {
            token: newToken,
            refreshToken: newRefreshToken
          }
        });
    } catch (error) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
router.put('/updatedetails', [
  protect,
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    const fieldsToUpdate = {};
    const { name, email } = req.body;

    if (name) fieldsToUpdate.name = name;
    if (email) fieldsToUpdate.email = email;

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          error: 'Email already in use'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          preferences: user.preferences,
          subscription: user.subscription
        }
      }
    });
  } catch (error) {
    console.error('Update details error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
router.put('/updatepassword', [
  protect,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, StatusCodes.OK, res);
  } catch (error) {
    console.error('Update password error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update user preferences
// @route   PUT /api/auth/preferences
// @access  Private
router.put('/preferences', protect, async (req, res) => {
  try {
    const allowedPreferences = [
      'currency',
      'dateFormat',
      'numberFormat',
      'language',
      'timezone',
      'notifications',
      'privacy'
    ];

    const updateFields = {};

    Object.keys(req.body).forEach(key => {
      if (allowedPreferences.includes(key)) {
        updateFields[`preferences.${key}`] = req.body[key];
      }
    });

    if (Object.keys(updateFields).length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'No valid preferences provided'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
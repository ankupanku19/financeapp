const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: false
  },
  avatar: {
    url: {
      type: String,
      default: null
    },
    type: {
      type: String,
      enum: ['custom', 'generated'],
      default: 'generated'
    }
  },
  financeProfile: {
    incomeRange: {
      type: String,
      enum: ['under_2k', '2k_5k', '5k_10k', 'over_10k'],
      required: false
    },
    financialGoals: [{
      type: String,
      enum: ['emergency_fund', 'save_house', 'retirement', 'debt_payoff', 'investment', 'education']
    }],
    spendingPriority: {
      type: String,
      enum: ['necessities', 'entertainment', 'shopping', 'travel'],
      required: false
    },
    financialExperience: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: false
    },
    savingFrequency: {
      type: String,
      enum: ['never', 'sometimes', 'monthly', 'weekly'],
      required: false
    },
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    aiPersonalityProfile: {
      riskTolerance: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      preferredAdviceStyle: {
        type: String,
        enum: ['conservative', 'balanced', 'aggressive'],
        default: 'balanced'
      },
      focusAreas: [{
        type: String,
        enum: ['budgeting', 'investing', 'saving', 'debt_management', 'goal_planning']
      }]
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  preferences: {
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR']
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY',
      enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']
    },
    numberFormat: {
      type: String,
      default: 'US',
      enum: ['US', 'EU', 'IN']
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      weekly_summary: {
        type: Boolean,
        default: true
      },
      goal_reminders: {
        type: Boolean,
        default: true
      },
      budget_alerts: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      profile_visibility: {
        type: String,
        default: 'private',
        enum: ['public', 'private', 'friends']
      },
      data_sharing: {
        type: Boolean,
        default: false
      }
    }
  },
  subscription: {
    plan: {
      type: String,
      default: 'free',
      enum: ['free', 'premium', 'enterprise']
    },
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'inactive', 'cancelled', 'expired']
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    stripeCustomerId: {
      type: String,
      default: null
    },
    stripeSubscriptionId: {
      type: String,
      default: null
    }
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    userId: this._id,
    email: this.email,
    name: this.name
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback_secret',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
  const payload = {
    userId: this._id,
    type: 'refresh'
  };

  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback_secret',
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    }
  );
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true, deletedAt: null });
};

// Method to soft delete user
userSchema.methods.softDelete = function() {
  this.isActive = false;
  this.deletedAt = new Date();
  return this.save();
};

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  this.loginCount += 1;
  return this.save();
};

// Virtual for full name (if we had firstName/lastName)
userSchema.virtual('displayName').get(function() {
  return this.name;
});

// Method to check if user has premium features
userSchema.methods.hasPremiumAccess = function() {
  return this.subscription.plan !== 'free' &&
         this.subscription.status === 'active' &&
         (!this.subscription.endDate || this.subscription.endDate > new Date());
};

// Method to get user permissions
userSchema.methods.getPermissions = function() {
  const basePermissions = [
    'income:read',
    'income:create',
    'income:update',
    'income:delete',
    'goals:read',
    'goals:create',
    'goals:update',
    'goals:delete',
    'savings:read',
    'savings:create',
    'categories:read',
    'analytics:basic'
  ];

  const premiumPermissions = [
    'analytics:advanced',
    'ai:insights',
    'ai:recommendations',
    'export:data',
    'import:data',
    'categories:custom',
    'goals:advanced'
  ];

  return this.hasPremiumAccess()
    ? [...basePermissions, ...premiumPermissions]
    : basePermissions;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
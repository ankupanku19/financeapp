const mongoose = require('mongoose');
const moment = require('moment');

const goalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    minlength: [1, 'Title must be at least 1 character'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [1, 'Target amount must be greater than 0'],
    max: [1000000000, 'Target amount cannot exceed 1 billion']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount cannot be negative'],
    validate: {
      validator: function(value) {
        return value <= this.targetAmount * 1.1; // Allow 10% overfunding
      },
      message: 'Current amount cannot exceed target amount by more than 10%'
    }
  },
  targetDate: {
    type: Date,
    required: [true, 'Target date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Target date must be in the future'
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: [
      'emergency',
      'vacation',
      'car',
      'house',
      'education',
      'retirement',
      'investment',
      'debt_payoff',
      'wedding',
      'health',
      'technology',
      'other'
    ],
    required: [true, 'Category is required']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR']
  },
  autoSave: {
    enabled: {
      type: Boolean,
      default: false
    },
    amount: {
      type: Number,
      min: [0.01, 'Auto-save amount must be greater than 0'],
      required: function() {
        return this.autoSave.enabled;
      }
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly'],
      required: function() {
        return this.autoSave.enabled;
      }
    },
    nextContribution: {
      type: Date,
      required: function() {
        return this.autoSave.enabled;
      }
    }
  },
  milestones: [{
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    achieved: {
      type: Boolean,
      default: false
    },
    achievedAt: {
      type: Date,
      default: null
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Milestone description cannot exceed 200 characters']
    }
  }],
  contributions: [{
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Contribution amount must be greater than 0']
    },
    date: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Contribution description cannot exceed 200 characters']
    },
    type: {
      type: String,
      enum: ['manual', 'auto', 'bonus', 'transfer'],
      default: 'manual'
    }
  }],
  reminders: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    customMessage: {
      type: String,
      trim: true,
      maxlength: [200, 'Custom message cannot exceed 200 characters']
    },
    lastSent: {
      type: Date,
      default: null
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  visibility: {
    type: String,
    enum: ['private', 'shared', 'public'],
    default: 'private'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  completedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
goalSchema.index({ userId: 1 });
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, category: 1 });
goalSchema.index({ userId: 1, priority: 1 });
goalSchema.index({ userId: 1, targetDate: 1 });
goalSchema.index({ userId: 1, isDeleted: 1 });
goalSchema.index({ status: 1 });
goalSchema.index({ targetDate: 1 });
goalSchema.index({ tags: 1 });

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
});

// Virtual for remaining amount
goalSchema.virtual('remainingAmount').get(function() {
  return Math.max(this.targetAmount - this.currentAmount, 0);
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  return Math.max(moment(this.targetDate).diff(moment(), 'days'), 0);
});

// Virtual for is overdue
goalSchema.virtual('isOverdue').get(function() {
  return this.status === 'active' && moment().isAfter(moment(this.targetDate));
});

// Virtual for formatted amounts
goalSchema.virtual('formattedTargetAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.targetAmount);
});

goalSchema.virtual('formattedCurrentAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.currentAmount);
});

goalSchema.virtual('formattedRemainingAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.remainingAmount);
});

// Static method to find by user
goalSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId, isDeleted: false };

  if (options.status) {
    query.status = options.status;
  }

  if (options.category) {
    query.category = options.category;
  }

  if (options.priority) {
    query.priority = options.priority;
  }

  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }

  const findQuery = this.find(query);

  // Apply sorting
  const sortBy = options.sortBy || 'targetDate';
  const sortOrder = options.sortOrder === 'desc' ? -1 : 1;
  findQuery.sort({ [sortBy]: sortOrder });

  return findQuery;
};

// Static method to get goals summary for user
goalSchema.statics.getUserGoalsSummary = function(userId) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isDeleted: false
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalTargetAmount: { $sum: '$targetAmount' },
        totalCurrentAmount: { $sum: '$currentAmount' }
      }
    }
  ]);
};

// Static method to get goals by priority
goalSchema.statics.getGoalsByPriority = function(userId) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'active',
        isDeleted: false
      }
    },
    {
      $group: {
        _id: '$priority',
        goals: { $push: '$$ROOT' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        _id: 1 // Sort by priority
      }
    }
  ]);
};

// Method to add contribution
goalSchema.methods.addContribution = function(amount, description = '', type = 'manual') {
  const contribution = {
    amount,
    description,
    type,
    date: new Date()
  };

  this.contributions.push(contribution);
  this.currentAmount += amount;

  // Check if goal is completed
  if (this.currentAmount >= this.targetAmount && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  }

  // Update milestones
  this.updateMilestones();

  return this.save();
};

// Method to update milestones
goalSchema.methods.updateMilestones = function() {
  const progressPercentage = (this.currentAmount / this.targetAmount) * 100;

  this.milestones.forEach(milestone => {
    if (!milestone.achieved && progressPercentage >= milestone.percentage) {
      milestone.achieved = true;
      milestone.achievedAt = new Date();
    }
  });
};

// Method to calculate required monthly savings
goalSchema.methods.getRequiredMonthlySavings = function() {
  const monthsRemaining = moment(this.targetDate).diff(moment(), 'months', true);

  if (monthsRemaining <= 0) {
    return this.remainingAmount;
  }

  return this.remainingAmount / monthsRemaining;
};

// Method to calculate progress velocity (amount per day)
goalSchema.methods.getProgressVelocity = function() {
  if (this.contributions.length < 2) {
    return 0;
  }

  const sortedContributions = this.contributions
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const firstContribution = sortedContributions[0];
  const lastContribution = sortedContributions[sortedContributions.length - 1];

  const daysDiff = moment(lastContribution.date).diff(moment(firstContribution.date), 'days');

  if (daysDiff === 0) {
    return 0;
  }

  return this.currentAmount / daysDiff;
};

// Method to get completion prediction
goalSchema.methods.getCompletionPrediction = function() {
  const velocity = this.getProgressVelocity();

  if (velocity <= 0) {
    return null;
  }

  const daysToComplete = this.remainingAmount / velocity;
  return moment().add(Math.ceil(daysToComplete), 'days').toDate();
};

// Method to soft delete
goalSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to pause goal
goalSchema.methods.pause = function() {
  this.status = 'paused';
  return this.save();
};

// Method to resume goal
goalSchema.methods.resume = function() {
  if (this.status === 'paused') {
    this.status = 'active';
  }
  return this.save();
};

// Method to cancel goal
goalSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Pre-save middleware to create default milestones
goalSchema.pre('save', function(next) {
  if (this.isNew && this.milestones.length === 0) {
    // Create default milestones at 25%, 50%, 75%, and 100%
    const defaultMilestones = [25, 50, 75, 100].map(percentage => ({
      percentage,
      amount: (this.targetAmount * percentage) / 100,
      description: `${percentage}% of goal reached`
    }));

    this.milestones = defaultMilestones;
  }
  next();
});

// Post-save middleware to send notifications
goalSchema.post('save', async function(doc) {
  try {
    const NotificationService = require('../services/NotificationService');
    const notificationService = new NotificationService();

    // Check if goal was just completed
    if (doc.status === 'completed' && doc.currentAmount >= doc.targetAmount) {
      await notificationService.sendNotification({
        userId: doc.userId,
        type: 'goal_achieved',
        title: '🎉 Goal Achieved!',
        message: `Congratulations! You've achieved your goal: ${doc.title}`,
        channels: ['inApp', 'push', 'email'],
        priority: 'high',
        data: {
          goalId: doc._id,
          goalName: doc.title,
          targetAmount: doc.targetAmount,
          achievedDate: new Date()
        },
        metadata: {
          source: 'user_action',
          category: 'goal_achieved'
        }
      });
    }

    // Check for milestone achievements
    const progressPercentage = (doc.currentAmount / doc.targetAmount) * 100;
    const achievedMilestones = doc.milestones.filter(milestone => 
      milestone.percentage <= progressPercentage && !milestone.achieved
    );

    for (const milestone of achievedMilestones) {
      milestone.achieved = true;
      milestone.achievedAt = new Date();

      await notificationService.sendNotification({
        userId: doc.userId,
        type: 'goal_milestone',
        title: '🎯 Milestone Reached!',
        message: `You've reached ${milestone.percentage}% of your goal: ${doc.title}`,
        channels: ['inApp', 'push'],
        priority: 'medium',
        data: {
          goalId: doc._id,
          goalName: doc.title,
          milestonePercentage: milestone.percentage,
          milestoneAmount: milestone.amount
        },
        metadata: {
          source: 'user_action',
          category: 'goal_milestone'
        }
      });
    }

    // Save milestone updates
    if (achievedMilestones.length > 0) {
      await doc.save();
    }
  } catch (error) {
    console.error('Error sending goal notifications:', error);
  }
});

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;
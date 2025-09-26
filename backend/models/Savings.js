const mongoose = require('mongoose');
const moment = require('moment');

const savingsSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
    max: [1000000000, 'Amount cannot exceed 1 billion']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [1, 'Description must be at least 1 character'],
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null
  },
  type: {
    type: String,
    enum: ['manual', 'auto', 'transfer', 'interest', 'bonus'],
    default: 'manual'
  },
  source: {
    type: String,
    trim: true,
    maxlength: [100, 'Source cannot exceed 100 characters']
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
      'general',
      'other'
    ],
    default: 'general'
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR']
  },
  account: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Account name cannot exceed 100 characters']
    },
    type: {
      type: String,
      enum: ['checking', 'savings', 'investment', 'cash', 'other'],
      default: 'savings'
    },
    institution: {
      type: String,
      trim: true,
      maxlength: [100, 'Institution name cannot exceed 100 characters']
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly'],
      required: function() {
        return this.isRecurring;
      }
    },
    endDate: {
      type: Date,
      validate: {
        validator: function(value) {
          return !this.isRecurring || !value || value > this.date;
        },
        message: 'End date must be after start date'
      }
    },
    nextDate: {
      type: Date,
      required: function() {
        return this.isRecurring;
      }
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
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
savingsSchema.index({ userId: 1 });
savingsSchema.index({ userId: 1, date: -1 });
savingsSchema.index({ userId: 1, goalId: 1 });
savingsSchema.index({ userId: 1, category: 1 });
savingsSchema.index({ userId: 1, isDeleted: 1 });
savingsSchema.index({ date: -1 });
savingsSchema.index({ goalId: 1 });
savingsSchema.index({ type: 1 });
savingsSchema.index({ tags: 1 });

// Populate goal by default
savingsSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'goalId',
    select: 'title targetAmount currentAmount status'
  });
  next();
});

// Virtual for formatted amount
savingsSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Virtual for formatted date
savingsSchema.virtual('formattedDate').get(function() {
  return moment(this.date).format('YYYY-MM-DD');
});

// Static method to find by user
savingsSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId, isDeleted: false };

  if (options.goalId) {
    query.goalId = options.goalId;
  }

  if (options.category) {
    query.category = options.category;
  }

  if (options.type) {
    query.type = options.type;
  }

  if (options.startDate && options.endDate) {
    query.date = {
      $gte: new Date(options.startDate),
      $lte: new Date(options.endDate)
    };
  }

  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }

  if (options.minAmount !== undefined) {
    query.amount = { ...query.amount, $gte: options.minAmount };
  }

  if (options.maxAmount !== undefined) {
    query.amount = { ...query.amount, $lte: options.maxAmount };
  }

  const findQuery = this.find(query);

  // Apply sorting
  const sortBy = options.sortBy || 'date';
  const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
  findQuery.sort({ [sortBy]: sortOrder });

  // Apply pagination
  if (options.page && options.limit) {
    const skip = (options.page - 1) * options.limit;
    findQuery.skip(skip).limit(options.limit);
  }

  return findQuery;
};

// Static method to get monthly savings for user
savingsSchema.statics.getMonthlySavings = function(userId, year, month) {
  const startDate = moment().year(year).month(month - 1).startOf('month').toDate();
  const endDate = moment().year(year).month(month - 1).endOf('month').toDate();

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
};

// Static method to get savings by category
savingsSchema.statics.getSavingsByCategory = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ]);
};

// Static method to get savings by goal
savingsSchema.statics.getSavingsByGoal = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        goalId: { $ne: null },
        isDeleted: false
      }
    },
    {
      $lookup: {
        from: 'goals',
        localField: 'goalId',
        foreignField: '_id',
        as: 'goal'
      }
    },
    {
      $unwind: '$goal'
    },
    {
      $group: {
        _id: '$goalId',
        goalTitle: { $first: '$goal.title' },
        goalTargetAmount: { $first: '$goal.targetAmount' },
        totalSaved: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { totalSaved: -1 }
    }
  ]);
};

// Static method to get savings trends
savingsSchema.statics.getSavingsTrends = function(userId, months = 6) {
  const startDate = moment().subtract(months, 'months').startOf('month').toDate();

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
};

// Static method to get total savings for user
savingsSchema.statics.getTotalSavings = function(userId) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
        minAmount: { $min: '$amount' },
        maxAmount: { $max: '$amount' }
      }
    }
  ]);
};

// Method to soft delete
savingsSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to restore
savingsSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

// Method to generate next occurrence for recurring savings
savingsSchema.methods.getNextOccurrence = function() {
  if (!this.isRecurring) return null;

  const { frequency, endDate } = this.recurringPattern;
  let nextDate = moment(this.recurringPattern.nextDate || this.date);

  switch (frequency) {
    case 'daily':
      nextDate.add(1, 'day');
      break;
    case 'weekly':
      nextDate.add(1, 'week');
      break;
    case 'biweekly':
      nextDate.add(2, 'weeks');
      break;
    case 'monthly':
      nextDate.add(1, 'month');
      break;
    case 'quarterly':
      nextDate.add(3, 'months');
      break;
  }

  if (endDate && nextDate.isAfter(moment(endDate))) {
    return null;
  }

  return nextDate.toDate();
};

// Pre-save middleware to update goal contribution
savingsSchema.pre('save', async function(next) {
  if (this.isNew && this.goalId) {
    try {
      const Goal = mongoose.model('Goal');
      const goal = await Goal.findById(this.goalId);

      if (goal) {
        await goal.addContribution(this.amount, this.description, this.type);
      }
    } catch (error) {
      console.error('Error updating goal contribution:', error);
    }
  }
  next();
});

// Post-save middleware to send notifications
savingsSchema.post('save', async function(doc) {
  try {
    const NotificationService = require('../services/NotificationService');
    const notificationService = new NotificationService();

    // Check for savings milestones (every $1000)
    const totalSavings = await Savings.aggregate([
      { $match: { userId: doc.userId, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const currentTotal = totalSavings.length > 0 ? totalSavings[0].total : 0;
    const milestone = Math.floor(currentTotal / 1000) * 1000;
    const previousMilestone = milestone - 1000;

    // Check if we've crossed a milestone
    if (milestone > 0 && currentTotal >= milestone && currentTotal < milestone + 100) {
      await notificationService.sendNotification({
        userId: doc.userId,
        type: 'savings_milestone',
        title: '💎 Savings Milestone!',
        message: `Congratulations! You've reached a savings milestone of $${milestone.toLocaleString()}`,
        channels: ['inApp', 'push', 'email'],
        priority: 'high',
        data: {
          milestone: milestone,
          totalSavings: currentTotal,
          recentAmount: doc.amount
        },
        metadata: {
          source: 'user_action',
          category: 'savings_milestone'
        }
      });
    }
  } catch (error) {
    console.error('Error sending savings notification:', error);
  }
});

const Savings = mongoose.model('Savings', savingsSchema);

module.exports = Savings;
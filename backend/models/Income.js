const mongoose = require('mongoose');
const moment = require('moment');

const incomeSchema = new mongoose.Schema({
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
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  source: {
    type: String,
    trim: true,
    maxlength: [100, 'Source cannot exceed 100 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
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
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      required: function() {
        return this.isRecurring && this.recurringPattern.frequency === 'weekly';
      }
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
      required: function() {
        return this.isRecurring &&
               ['monthly', 'quarterly', 'yearly'].includes(this.recurringPattern.frequency);
      }
    },
    monthOfYear: {
      type: Number,
      min: 1,
      max: 12,
      required: function() {
        return this.isRecurring && this.recurringPattern.frequency === 'yearly';
      }
    }
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR']
  },
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
  aiCategoryScore: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  aiSuggestions: [{
    type: {
      type: String,
      enum: ['category', 'description', 'tag', 'source']
    },
    suggestion: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    applied: {
      type: Boolean,
      default: false
    }
  }],
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
incomeSchema.index({ userId: 1 });
incomeSchema.index({ userId: 1, date: -1 });
incomeSchema.index({ userId: 1, categoryId: 1 });
incomeSchema.index({ userId: 1, isDeleted: 1 });
incomeSchema.index({ date: -1 });
incomeSchema.index({ isRecurring: 1 });
incomeSchema.index({ tags: 1 });

// Populate category by default
incomeSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'categoryId',
    select: 'name color icon'
  });
  next();
});

// Virtual for formatted amount
incomeSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Virtual for date formatted
incomeSchema.virtual('formattedDate').get(function() {
  return moment(this.date).format('YYYY-MM-DD');
});

// Static method to find by user
incomeSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId, isDeleted: false };

  if (options.categoryId) {
    query.categoryId = options.categoryId;
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

  if (options.source) {
    query.source = new RegExp(options.source, 'i');
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

// Static method to get monthly income for user
incomeSchema.statics.getMonthlyIncome = function(userId, year, month) {
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

// Static method to get income by category
incomeSchema.statics.getIncomeByCategory = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isDeleted: false
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $unwind: '$category'
    },
    {
      $group: {
        _id: '$categoryId',
        categoryName: { $first: '$category.name' },
        categoryColor: { $first: '$category.color' },
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

// Static method to get income trends
incomeSchema.statics.getIncomeTrends = function(userId, months = 6) {
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

// Method to soft delete
incomeSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to restore
incomeSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

// Method to generate next occurrence for recurring income
incomeSchema.methods.getNextOccurrence = function() {
  if (!this.isRecurring) return null;

  const { frequency, endDate } = this.recurringPattern;
  let nextDate = moment(this.date);

  switch (frequency) {
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
    case 'yearly':
      nextDate.add(1, 'year');
      break;
  }

  if (endDate && nextDate.isAfter(moment(endDate))) {
    return null;
  }

  return nextDate.toDate();
};

// Post-save middleware to send notifications
incomeSchema.post('save', async function(doc) {
  try {
    const NotificationService = require('../services/NotificationService');
    const notificationService = new NotificationService();

    // Send income added notification
    await notificationService.sendNotification({
      userId: doc.userId,
      type: 'income_added',
      title: '💵 Income Added',
      message: `You've added $${doc.amount.toLocaleString()} to your income from ${doc.source}`,
      channels: ['inApp', 'push'],
      priority: 'low',
      data: {
        incomeId: doc._id,
        amount: doc.amount,
        source: doc.source,
        category: doc.category
      },
      metadata: {
        source: 'user_action',
        category: 'income_added'
      }
    });
  } catch (error) {
    console.error('Error sending income notification:', error);
  }
});

const Income = mongoose.model('Income', incomeSchema);

module.exports = Income;
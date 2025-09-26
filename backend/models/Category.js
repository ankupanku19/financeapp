const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    minlength: [1, 'Category name must be at least 1 character'],
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  color: {
    type: String,
    required: [true, 'Category color is required'],
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color code']
  },
  icon: {
    type: String,
    required: [true, 'Category icon is required'],
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
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
categorySchema.index({ userId: 1 });
categorySchema.index({ userId: 1, name: 1 }, { unique: true });
categorySchema.index({ isDefault: 1 });
categorySchema.index({ isActive: 1 });

// Static method to get default categories
categorySchema.statics.getDefaultCategories = function() {
  return [
    {
      name: 'Salary',
      color: '#6366F1',
      icon: 'briefcase',
      isDefault: true,
      sortOrder: 1,
      description: 'Regular salary income'
    },
    {
      name: 'Freelance',
      color: '#10B981',
      icon: 'laptop',
      isDefault: true,
      sortOrder: 2,
      description: 'Freelance work income'
    },
    {
      name: 'Investment',
      color: '#F59E0B',
      icon: 'trending-up',
      isDefault: true,
      sortOrder: 3,
      description: 'Investment returns and dividends'
    },
    {
      name: 'Side Hustle',
      color: '#EF4444',
      icon: 'zap',
      isDefault: true,
      sortOrder: 4,
      description: 'Side business income'
    },
    {
      name: 'Bonus',
      color: '#8B5CF6',
      icon: 'gift',
      isDefault: true,
      sortOrder: 5,
      description: 'Bonuses and incentives'
    },
    {
      name: 'Rental',
      color: '#06B6D4',
      icon: 'home',
      isDefault: true,
      sortOrder: 6,
      description: 'Rental property income'
    },
    {
      name: 'Other',
      color: '#6B7280',
      icon: 'more-horizontal',
      isDefault: true,
      sortOrder: 7,
      description: 'Other income sources'
    }
  ];
};

// Static method to create default categories for a user
categorySchema.statics.createDefaultCategories = async function(userId) {
  const defaultCategories = this.getDefaultCategories();

  const categories = defaultCategories.map(category => ({
    ...category,
    userId: userId
  }));

  return await this.insertMany(categories);
};

// Method to check if category can be deleted
categorySchema.methods.canBeDeleted = function() {
  return !this.isDefault;
};

// Static method to find user categories
categorySchema.statics.findByUser = function(userId, includeInactive = false) {
  const query = { userId };
  if (!includeInactive) {
    query.isActive = true;
  }
  return this.find(query).sort({ sortOrder: 1, name: 1 });
};

// Static method to find active categories for user
categorySchema.statics.findActiveByUser = function(userId) {
  return this.find({ userId, isActive: true }).sort({ sortOrder: 1, name: 1 });
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Income = require('../models/Income');
const Category = require('../models/Category');
const { protect, checkOwnership } = require('../middleware/auth');
const { StatusCodes } = require('http-status-codes');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const createIncomeValidation = [
  body('amount')
    .isFloat({ min: 0.01, max: 1000000000 })
    .withMessage('Amount must be between 0.01 and 1,000,000,000'),
  body('description')
    .notEmpty()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters'),
  body('categoryId')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date')
];

// @desc    Get all income for user
// @route   GET /api/income
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['date', 'amount', 'description']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || 'date',
      sortOrder: req.query.sortOrder || 'desc',
      categoryId: req.query.categoryId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      tags: req.query.tags ? req.query.tags.split(',') : null,
      source: req.query.source,
      minAmount: req.query.minAmount ? parseFloat(req.query.minAmount) : undefined,
      maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount) : undefined
    };

    const income = await Income.findByUser(req.user._id, options);
    const total = await Income.countDocuments({ userId: req.user._id, isDeleted: false });

    res.status(StatusCodes.OK).json({
      success: true,
      data: income,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Get income error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single income
// @route   GET /api/income/:id
// @access  Private
router.get('/:id', checkOwnership(Income), async (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    data: req.resource
  });
});

// @desc    Create new income
// @route   POST /api/income
// @access  Private
router.post('/', createIncomeValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    // Verify category belongs to user
    const category = await Category.findOne({
      _id: req.body.categoryId,
      userId: req.user._id,
      isActive: true
    });

    if (!category) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Invalid category'
      });
    }

    const incomeData = {
      ...req.body,
      userId: req.user._id
    };

    const income = await Income.create(incomeData);
    await income.populate('categoryId', 'name color icon');

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: income
    });
  } catch (error) {
    console.error('Create income error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update income
// @route   PUT /api/income/:id
// @access  Private
router.put('/:id', [
  checkOwnership(Income),
  ...createIncomeValidation.map(validation => validation.optional())
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    // Verify category belongs to user if provided
    if (req.body.categoryId) {
      const category = await Category.findOne({
        _id: req.body.categoryId,
        userId: req.user._id,
        isActive: true
      });

      if (!category) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          error: 'Invalid category'
        });
      }
    }

    const income = await Income.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('categoryId', 'name color icon');

    res.status(StatusCodes.OK).json({
      success: true,
      data: income
    });
  } catch (error) {
    console.error('Update income error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete income
// @route   DELETE /api/income/:id
// @access  Private
router.delete('/:id', checkOwnership(Income), async (req, res) => {
  try {
    await req.resource.softDelete();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Income deleted successfully'
    });
  } catch (error) {
    console.error('Delete income error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get income by category
// @route   GET /api/income/category/:categoryId
// @access  Private
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify category belongs to user
    const category = await Category.findOne({
      _id: categoryId,
      userId: req.user._id,
      isActive: true
    });

    if (!category) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: 'Category not found'
      });
    }

    const options = { categoryId };
    if (startDate && endDate) {
      options.startDate = startDate;
      options.endDate = endDate;
    }

    const income = await Income.findByUser(req.user._id, options);

    res.status(StatusCodes.OK).json({
      success: true,
      data: income
    });
  } catch (error) {
    console.error('Get income by category error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
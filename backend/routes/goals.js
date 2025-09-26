const express = require('express');
const { body, validationResult } = require('express-validator');
const Goal = require('../models/Goal');
const { protect, checkOwnership } = require('../middleware/auth');
const { StatusCodes } = require('http-status-codes');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const createGoalValidation = [
  body('title')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('targetAmount')
    .isFloat({ min: 1, max: 1000000000 })
    .withMessage('Target amount must be between 1 and 1,000,000,000'),
  body('targetDate')
    .isISO8601()
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Target date must be in the future');
      }
      return true;
    }),
  body('category')
    .isIn(['emergency', 'vacation', 'car', 'house', 'education', 'retirement', 'investment', 'debt_payoff', 'wedding', 'health', 'technology', 'other'])
    .withMessage('Invalid category')
];

// @desc    Get all goals for user
// @route   GET /api/goals
// @access  Private
router.get('/', async (req, res) => {
  try {
    const options = {
      status: req.query.status,
      category: req.query.category,
      priority: req.query.priority,
      sortBy: req.query.sortBy || 'targetDate',
      sortOrder: req.query.sortOrder || 'asc'
    };

    const goals = await Goal.findByUser(req.user._id, options);

    res.status(StatusCodes.OK).json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single goal
// @route   GET /api/goals/:id
// @access  Private
router.get('/:id', checkOwnership(Goal), async (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    data: req.resource
  });
});

// @desc    Create new goal
// @route   POST /api/goals
// @access  Private
router.post('/', createGoalValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    const goalData = {
      ...req.body,
      userId: req.user._id
    };

    const goal = await Goal.create(goalData);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private
router.put('/:id', [
  checkOwnership(Goal),
  ...createGoalValidation.map(validation => validation.optional())
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    const goal = await Goal.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
router.delete('/:id', checkOwnership(Goal), async (req, res) => {
  try {
    await req.resource.softDelete();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Add contribution to goal
// @route   POST /api/goals/:id/contribute
// @access  Private
router.post('/:id/contribute', [
  checkOwnership(Goal),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    const { amount, description, type } = req.body;

    await req.resource.addContribution(amount, description, type);

    res.status(StatusCodes.OK).json({
      success: true,
      data: req.resource
    });
  } catch (error) {
    console.error('Add contribution error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
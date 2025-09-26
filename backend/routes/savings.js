const express = require('express');
const { body, validationResult } = require('express-validator');
const Savings = require('../models/Savings');
const Goal = require('../models/Goal');
const { protect, checkOwnership } = require('../middleware/auth');
const { StatusCodes } = require('http-status-codes');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const createSavingsValidation = [
  body('amount')
    .isFloat({ min: 0.01, max: 1000000000 })
    .withMessage('Amount must be between 0.01 and 1,000,000,000'),
  body('description')
    .notEmpty()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
  body('goalId')
    .optional()
    .isMongoId()
    .withMessage('Goal ID must be valid')
];

// @desc    Get all savings for user
// @route   GET /api/savings
// @access  Private
router.get('/', async (req, res) => {
  try {
    const options = {
      goalId: req.query.goalId,
      category: req.query.category,
      type: req.query.type,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      sortBy: req.query.sortBy || 'date',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const savings = await Savings.findByUser(req.user._id, options);

    res.status(StatusCodes.OK).json({
      success: true,
      data: savings
    });
  } catch (error) {
    console.error('Get savings error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single savings entry
// @route   GET /api/savings/:id
// @access  Private
router.get('/:id', checkOwnership(Savings), async (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    data: req.resource
  });
});

// @desc    Create new savings entry
// @route   POST /api/savings
// @access  Private
router.post('/', createSavingsValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    // Verify goal belongs to user if provided
    if (req.body.goalId) {
      const goal = await Goal.findOne({
        _id: req.body.goalId,
        userId: req.user._id,
        isDeleted: false
      });

      if (!goal) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          error: 'Invalid goal'
        });
      }
    }

    const savingsData = {
      ...req.body,
      userId: req.user._id
    };

    const savings = await Savings.create(savingsData);
    await savings.populate('goalId', 'title targetAmount currentAmount status');

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: savings
    });
  } catch (error) {
    console.error('Create savings error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update savings entry
// @route   PUT /api/savings/:id
// @access  Private
router.put('/:id', [
  checkOwnership(Savings),
  ...createSavingsValidation.map(validation => validation.optional())
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    // Verify goal belongs to user if provided
    if (req.body.goalId) {
      const goal = await Goal.findOne({
        _id: req.body.goalId,
        userId: req.user._id,
        isDeleted: false
      });

      if (!goal) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          error: 'Invalid goal'
        });
      }
    }

    const savings = await Savings.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('goalId', 'title targetAmount currentAmount status');

    res.status(StatusCodes.OK).json({
      success: true,
      data: savings
    });
  } catch (error) {
    console.error('Update savings error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete savings entry
// @route   DELETE /api/savings/:id
// @access  Private
router.delete('/:id', checkOwnership(Savings), async (req, res) => {
  try {
    await req.resource.softDelete();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Savings entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete savings error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
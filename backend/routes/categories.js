const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { protect, checkOwnership } = require('../middleware/auth');
const { StatusCodes } = require('http-status-codes');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const createCategoryValidation = [
  body('name')
    .notEmpty()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters'),
  body('color')
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code'),
  body('icon')
    .notEmpty()
    .withMessage('Icon is required')
];

// @desc    Get all categories for user
// @route   GET /api/categories
// @access  Private
router.get('/', async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const categories = await Category.findByUser(req.user._id, includeInactive);

    res.status(StatusCodes.OK).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
router.get('/:id', checkOwnership(Category), async (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    data: req.resource
  });
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
router.post('/', createCategoryValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    // Check if category name already exists for user
    const existingCategory = await Category.findOne({
      userId: req.user._id,
      name: req.body.name,
      isActive: true
    });

    if (existingCategory) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        error: 'Category with this name already exists'
      });
    }

    const categoryData = {
      ...req.body,
      userId: req.user._id
    };

    const category = await Category.create(categoryData);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
router.put('/:id', [
  checkOwnership(Category),
  ...createCategoryValidation.map(validation => validation.optional())
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', ')
      });
    }

    // Check if category name already exists for user (excluding current category)
    if (req.body.name) {
      const existingCategory = await Category.findOne({
        userId: req.user._id,
        name: req.body.name,
        isActive: true,
        _id: { $ne: req.params.id }
      });

      if (existingCategory) {
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          error: 'Category with this name already exists'
        });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
router.delete('/:id', checkOwnership(Category), async (req, res) => {
  try {
    // Check if category can be deleted (not default)
    if (!req.resource.canBeDeleted()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Default categories cannot be deleted'
      });
    }

    // Soft delete by setting isActive to false
    req.resource.isActive = false;
    await req.resource.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
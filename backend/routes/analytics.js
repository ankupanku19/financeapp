const express = require('express');
const Income = require('../models/Income');
const Savings = require('../models/Savings');
const Goal = require('../models/Goal');
const { protect } = require('../middleware/auth');
const { StatusCodes } = require('http-status-codes');
const moment = require('moment');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user._id;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get current month income
    const monthlyIncome = await Income.getMonthlyIncome(userId, currentYear, currentMonth);
    const monthlyIncomeTotal = monthlyIncome[0]?.totalAmount || 0;

    // Get current month savings
    const monthlySavings = await Savings.getMonthlySavings(userId, currentYear, currentMonth);
    const monthlySavingsTotal = monthlySavings[0]?.totalAmount || 0;

    // Get total savings
    const totalSavingsData = await Savings.getTotalSavings(userId);
    const totalSavings = totalSavingsData[0]?.totalAmount || 0;

    // Get goals summary
    const goalsSummary = await Goal.getUserGoalsSummary(userId);
    const activeGoals = goalsSummary.find(g => g._id === 'active')?.count || 0;
    const completedGoals = goalsSummary.find(g => g._id === 'completed')?.count || 0;

    // Get income trends (last 6 months)
    const incomeTrends = await Income.getIncomeTrends(userId, 6);

    // Get savings trends (last 6 months)
    const savingsTrends = await Savings.getSavingsTrends(userId, 6);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        currentMonth: {
          income: monthlyIncomeTotal,
          savings: monthlySavingsTotal,
          savingsRate: monthlyIncomeTotal > 0 ? (monthlySavingsTotal / monthlyIncomeTotal) * 100 : 0
        },
        totals: {
          savings: totalSavings
        },
        goals: {
          active: activeGoals,
          completed: completedGoals
        },
        trends: {
          income: incomeTrends,
          savings: savingsTrends
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get income analytics
// @route   GET /api/analytics/income
// @access  Private
router.get('/income', async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : moment().subtract(12, 'months').toDate();
    const end = endDate ? new Date(endDate) : new Date();

    // Get income by category
    const incomeByCategory = await Income.getIncomeByCategory(userId, start, end);

    // Get income trends
    const incomeTrends = await Income.getIncomeTrends(userId, 12);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        byCategory: incomeByCategory,
        trends: incomeTrends
      }
    });
  } catch (error) {
    console.error('Get income analytics error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get savings analytics
// @route   GET /api/analytics/savings
// @access  Private
router.get('/savings', async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : moment().subtract(12, 'months').toDate();
    const end = endDate ? new Date(endDate) : new Date();

    // Get savings by category
    const savingsByCategory = await Savings.getSavingsByCategory(userId, start, end);

    // Get savings by goal
    const savingsByGoal = await Savings.getSavingsByGoal(userId, start, end);

    // Get savings trends
    const savingsTrends = await Savings.getSavingsTrends(userId, 12);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        byCategory: savingsByCategory,
        byGoal: savingsByGoal,
        trends: savingsTrends
      }
    });
  } catch (error) {
    console.error('Get savings analytics error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get goals analytics
// @route   GET /api/analytics/goals
// @access  Private
router.get('/goals', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get goals summary
    const goalsSummary = await Goal.getUserGoalsSummary(userId);

    // Get goals by priority
    const goalsByPriority = await Goal.getGoalsByPriority(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        summary: goalsSummary,
        byPriority: goalsByPriority
      }
    });
  } catch (error) {
    console.error('Get goals analytics error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
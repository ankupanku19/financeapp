const express = require('express');
const OpenAI = require('openai');
const Income = require('../models/Income');
const Goal = require('../models/Goal');
const Category = require('../models/Category');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { StatusCodes } = require('http-status-codes');
const moment = require('moment');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get AI insights
// @route   GET /api/ai/insights
// @access  Private
router.get('/insights', async (req, res) => {
  try {
    const userId = req.user._id;

    // Generate AI insights using OpenAI
    const insights = await generateOpenAIInsights(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Get AI insights error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get goal recommendations
// @route   GET /api/ai/goal-recommendations
// @access  Private
router.get('/goal-recommendations', async (req, res) => {
  try {
    const userId = req.user._id;

    // Generate AI goal recommendations using OpenAI
    const recommendations = await generateOpenAIGoalRecommendations(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Get goal recommendations error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Analyze income patterns
// @route   GET /api/ai/analyze-patterns
// @access  Private
router.get('/analyze-patterns', async (req, res) => {
  try {
    const userId = req.user._id;

    // Analyze income patterns
    const patterns = await analyzeIncomePatterns(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: patterns
    });
  } catch (error) {
    console.error('Analyze patterns error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Helper function to generate AI insights using OpenAI
async function generateAIInsights(userId) {
  const insights = [];

  try {
    // Get recent income data
    const recentIncome = await Income.findByUser(userId, {
      startDate: moment().subtract(3, 'months').toDate(),
      endDate: new Date(),
      limit: 100
    });

    const currentMonthIncome = await Income.getMonthlyIncome(
      userId,
      new Date().getFullYear(),
      new Date().getMonth() + 1
    );

    const lastMonthIncome = await Income.getMonthlyIncome(
      userId,
      new Date().getFullYear(),
      new Date().getMonth()
    );

    const currentTotal = currentMonthIncome[0]?.totalAmount || 0;
    const lastTotal = lastMonthIncome[0]?.totalAmount || 0;

    // Income trend insight
    if (currentTotal > lastTotal * 1.1) {
      insights.push({
        id: `insight-${Date.now()}-1`,
        type: 'trend',
        title: 'Income Growth Detected',
        description: `Your income has increased by ${((currentTotal - lastTotal) / lastTotal * 100).toFixed(1)}% compared to last month. Great progress!`,
        confidence: 0.9,
        actionable: false
      });
    } else if (currentTotal < lastTotal * 0.9) {
      insights.push({
        id: `insight-${Date.now()}-2`,
        type: 'warning',
        title: 'Income Decrease Alert',
        description: `Your income has decreased by ${((lastTotal - currentTotal) / lastTotal * 100).toFixed(1)}% compared to last month. Consider reviewing your income sources.`,
        confidence: 0.85,
        actionable: true
      });
    }

    // Goals progress insight
    const activeGoals = await Goal.find({
      userId,
      status: 'active',
      isDeleted: false
    });

    const goalsNearCompletion = activeGoals.filter(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      return progress >= 80 && progress < 100;
    });

    if (goalsNearCompletion.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-3`,
        type: 'achievement',
        title: 'Goals Nearly Complete',
        description: `You're almost there! ${goalsNearCompletion.length} of your goals are over 80% complete. Keep up the momentum!`,
        confidence: 1.0,
        actionable: false
      });
    }

    // Savings rate recommendation
    if (currentTotal > 0) {
      const monthlySavings = await require('../models/Savings').getMonthlySavings(
        userId,
        new Date().getFullYear(),
        new Date().getMonth() + 1
      );
      const savingsTotal = monthlySavings[0]?.totalAmount || 0;
      const savingsRate = (savingsTotal / currentTotal) * 100;

      if (savingsRate < 10) {
        insights.push({
          id: `insight-${Date.now()}-4`,
          type: 'recommendation',
          title: 'Increase Savings Rate',
          description: `Your current savings rate is ${savingsRate.toFixed(1)}%. Financial experts recommend saving at least 20% of your income. Consider setting up automatic transfers.`,
          confidence: 0.8,
          actionable: true
        });
      }
    }

  } catch (error) {
    console.error('Error generating insights:', error);
  }

  // Add default insights if none generated
  if (insights.length === 0) {
    insights.push({
      id: `insight-${Date.now()}-default`,
      type: 'recommendation',
      title: 'Start Tracking Your Progress',
      description: 'Begin by logging your income and setting up your first financial goal. Consistent tracking is the key to financial success.',
      confidence: 0.7,
      actionable: true
    });
  }

  return insights;
}

// Helper function to generate goal recommendations
async function generateGoalRecommendations(userId) {
  const recommendations = [];

  try {
    const recentIncome = await Income.getIncomeTrends(userId, 3);
    const existingGoals = await Goal.find({
      userId,
      isDeleted: false
    });

    const avgMonthlyIncome = recentIncome.reduce((sum, month) => sum + month.totalAmount, 0) / Math.max(recentIncome.length, 1);

    // Emergency fund recommendation
    const hasEmergencyFund = existingGoals.some(goal => goal.category === 'emergency');
    if (!hasEmergencyFund && avgMonthlyIncome > 0) {
      recommendations.push({
        title: 'Emergency Fund',
        targetAmount: Math.round(avgMonthlyIncome * 6),
        timeframe: '12 months',
        reasoning: 'Build a safety net covering 6 months of expenses for financial security.',
        priority: 'high',
        confidence: 0.95
      });
    }

    // Investment goal recommendation
    const hasInvestmentGoal = existingGoals.some(goal => goal.category === 'investment');
    if (!hasInvestmentGoal && avgMonthlyIncome > 3000) {
      recommendations.push({
        title: 'Investment Portfolio',
        targetAmount: Math.round(avgMonthlyIncome * 3),
        timeframe: '18 months',
        reasoning: 'Start building long-term wealth through diversified investments.',
        priority: 'medium',
        confidence: 0.8
      });
    }

    // Vacation goal recommendation
    const hasVacationGoal = existingGoals.some(goal => goal.category === 'vacation');
    if (!hasVacationGoal) {
      recommendations.push({
        title: 'Dream Vacation',
        targetAmount: 3000,
        timeframe: '10 months',
        reasoning: 'Take time to recharge and create lasting memories.',
        priority: 'low',
        confidence: 0.7
      });
    }

  } catch (error) {
    console.error('Error generating goal recommendations:', error);
  }

  return recommendations;
}

// Helper function to analyze income patterns
async function analyzeIncomePatterns(userId) {
  const patterns = [];

  try {
    const last6Months = await Income.getIncomeTrends(userId, 6);

    last6Months.forEach((month, index) => {
      const period = moment().subtract(5 - index, 'months').format('MMM YYYY');
      const prevMonth = last6Months[index - 1];

      let trend = 'stable';
      let prediction = month.totalAmount;

      if (prevMonth) {
        const change = ((month.totalAmount - prevMonth.totalAmount) / prevMonth.totalAmount) * 100;
        if (change > 5) {
          trend = 'up';
          prediction = month.totalAmount * 1.05;
        } else if (change < -5) {
          trend = 'down';
          prediction = month.totalAmount * 0.95;
        } else {
          prediction = month.totalAmount * 1.02;
        }
      }

      patterns.push({
        period,
        amount: month.totalAmount,
        trend,
        prediction: Math.round(prediction)
      });
    });

  } catch (error) {
    console.error('Error analyzing patterns:', error);
  }

  return patterns;
}

// New OpenAI-powered insights function
async function generateOpenAIInsights(userId) {
  try {
    // Get user data for context
    const user = await User.findById(userId);
    const recentIncome = await Income.findByUser(userId, {
      startDate: moment().subtract(3, 'months').toDate(),
      endDate: new Date(),
      limit: 100
    });

    const activeGoals = await Goal.find({ userId, status: 'active' });
    
    const currentMonthIncome = await Income.getMonthlyIncome(
      userId,
      new Date().getFullYear(),
      new Date().getMonth() + 1
    );

    const lastMonthIncome = await Income.getMonthlyIncome(
      userId,
      new Date().getFullYear(),
      new Date().getMonth()
    );

    // Prepare data summary for AI
    const currentTotal = currentMonthIncome[0]?.totalAmount || 0;
    const lastTotal = lastMonthIncome[0]?.totalAmount || 0;
    const totalIncome = recentIncome.reduce((sum, income) => sum + income.amount, 0);
    const avgMonthlyIncome = totalIncome / 3;
    
    // Create AI prompt for personalized insights
    const prompt = `You are a personal finance AI advisor. Analyze the following user data and provide 3-4 personalized financial insights.

User Profile:
- Name: ${user.name}
- Income Range: ${user.financeProfile?.incomeRange || 'not specified'}
- Financial Goals: ${user.financeProfile?.financialGoals?.join(', ') || 'not specified'}
- Experience Level: ${user.financeProfile?.financialExperience || 'not specified'}
- Spending Priority: ${user.financeProfile?.spendingPriority || 'not specified'}
- Saving Frequency: ${user.financeProfile?.savingFrequency || 'not specified'}

Financial Data (Last 3 months):
- Current Month Income: $${currentTotal}
- Last Month Income: $${lastTotal}
- Average Monthly Income: $${avgMonthlyIncome.toFixed(2)}
- Total Income Transactions: ${recentIncome.length}
- Active Financial Goals: ${activeGoals.length}
- Total Goal Target Amount: $${activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0)}

Please provide insights in this exact JSON format:
{
  "insights": [
    {
      "id": "insight-1",
      "type": "trend",
      "title": "Insight Title",
      "description": "Detailed, personalized description based on user's data and profile",
      "confidence": 0.8,
      "actionable": true,
      "action": "Specific action recommendation"
    }
  ]
}

Make the insights:
1. Highly personalized to their financial profile and goals
2. Based on their actual data patterns
3. Actionable with specific recommendations
4. Encouraging and supportive in tone
5. Relevant to their experience level

Types: trend, warning, achievement, suggestion, pattern, recommendation`;

    // Call OpenAI API only if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, using fallback insights');
      return generateFallbackInsights({ currentTotal, lastTotal, activeGoalsCount: activeGoals.length });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert personal finance advisor who provides personalized, actionable insights based on user financial data and profiles. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiResponse = completion.choices[0].message.content;
    
    try {
      const parsedResponse = JSON.parse(aiResponse);
      return parsedResponse.insights || [];
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return generateFallbackInsights({ currentTotal, lastTotal, activeGoalsCount: activeGoals.length });
    }

  } catch (error) {
    console.error('Error generating OpenAI insights:', error);
    return generateFallbackInsights({ currentTotal: 0, lastTotal: 0, activeGoalsCount: 0 });
  }
}

// Fallback function for basic insights when AI fails
function generateFallbackInsights({ currentTotal = 0, lastTotal = 0, activeGoalsCount = 0 }) {
  const insights = [];

  if (currentTotal > lastTotal * 1.1) {
    insights.push({
      id: `insight-${Date.now()}-1`,
      type: 'trend',
      title: 'Income Growth Detected',
      description: `Your income increased by ${((currentTotal - lastTotal) / lastTotal * 100).toFixed(1)}% this month! This is great progress.`,
      confidence: 0.9,
      actionable: false
    });
  } else if (currentTotal < lastTotal * 0.9 && lastTotal > 0) {
    insights.push({
      id: `insight-${Date.now()}-2`,
      type: 'warning',
      title: 'Income Decrease Alert',
      description: `Your income decreased by ${((lastTotal - currentTotal) / lastTotal * 100).toFixed(1)}% this month. Consider reviewing your income sources.`,
      confidence: 0.85,
      actionable: true,
      action: 'Review and diversify your income sources'
    });
  }

  if (activeGoalsCount > 0) {
    insights.push({
      id: `insight-${Date.now()}-3`,
      type: 'suggestion',
      title: 'Goal Progress Check',
      description: `You have ${activeGoalsCount} active financial goals. Regular progress reviews help maintain momentum.`,
      confidence: 0.8,
      actionable: true,
      action: 'Review your goals and adjust monthly contributions'
    });
  } else {
    insights.push({
      id: `insight-${Date.now()}-4`,
      type: 'recommendation',
      title: 'Set Financial Goals',
      description: 'Consider setting specific financial goals to give your money management more direction and purpose.',
      confidence: 0.9,
      actionable: true,
      action: 'Create your first financial goal in the Goals section'
    });
  }

  if (currentTotal > 0) {
    insights.push({
      id: `insight-${Date.now()}-5`,
      type: 'pattern',
      title: 'Income Tracking Active',
      description: `You're actively tracking your income with $${currentTotal.toFixed(2)} recorded this month. Consistent tracking leads to better financial decisions.`,
      confidence: 1.0,
      actionable: false
    });
  }

  return insights.slice(0, 4); // Return max 4 insights
}

// OpenAI-powered goal recommendations
async function generateOpenAIGoalRecommendations(userId) {
  try {
    const user = await User.findById(userId);
    const recentIncome = await Income.findByUser(userId, {
      startDate: moment().subtract(3, 'months').toDate(),
      endDate: new Date(),
      limit: 100
    });

    const activeGoals = await Goal.find({ userId, status: 'active' });
    
    const currentMonthIncome = await Income.getMonthlyIncome(
      userId,
      new Date().getFullYear(),
      new Date().getMonth() + 1
    );

    const currentTotal = currentMonthIncome[0]?.totalAmount || 0;
    const avgMonthlyIncome = recentIncome.reduce((sum, income) => sum + income.amount, 0) / 3;

    const prompt = `You are a financial advisor. Based on the user's profile and financial data, recommend 2-3 specific financial goals.

User Profile:
- Name: ${user.name}
- Age: ${user.dateOfBirth ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'unknown'}
- Income Range: ${user.financeProfile?.incomeRange || 'not specified'}
- Financial Goals: ${user.financeProfile?.financialGoals?.join(', ') || 'not specified'}
- Experience Level: ${user.financeProfile?.financialExperience || 'not specified'}
- Saving Frequency: ${user.financeProfile?.savingFrequency || 'not specified'}

Financial Data:
- Current Month Income: $${currentTotal}
- Average Monthly Income: $${avgMonthlyIncome.toFixed(2)}
- Existing Active Goals: ${activeGoals.length}

Respond with this exact JSON format:
{
  "recommendations": [
    {
      "title": "Goal Title",
      "targetAmount": 5000,
      "priority": "high",
      "reasoning": "Detailed explanation of why this goal is recommended",
      "timeframe": "6 months",
      "monthlyContribution": 833
    }
  ]
}

Priorities: high, medium, low
Make recommendations realistic based on their income and experience level.`;

    if (!process.env.OPENAI_API_KEY) {
      return generateFallbackGoalRecommendations(user, currentTotal);
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a financial advisor who provides personalized goal recommendations. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const aiResponse = completion.choices[0].message.content;
    
    try {
      const parsedResponse = JSON.parse(aiResponse);
      return parsedResponse.recommendations || [];
    } catch (parseError) {
      console.error('Error parsing AI goal recommendations:', parseError);
      return generateFallbackGoalRecommendations(user, currentTotal);
    }

  } catch (error) {
    console.error('Error generating OpenAI goal recommendations:', error);
    return generateFallbackGoalRecommendations(user, currentTotal);
  }
}

function generateFallbackGoalRecommendations(user, monthlyIncome = 0) {
  const recommendations = [];
  
  // Emergency fund recommendation
  const emergencyAmount = monthlyIncome * 3;
  if (emergencyAmount > 0) {
    recommendations.push({
      title: 'Emergency Fund',
      targetAmount: emergencyAmount,
      priority: 'high',
      reasoning: 'Build a safety net covering 3 months of expenses for unexpected situations.',
      timeframe: '6 months',
      monthlyContribution: Math.round(emergencyAmount / 6)
    });
  }

  // Savings goal based on experience level
  const savingsAmount = user.financeProfile?.financialExperience === 'beginner' ? 1000 : 5000;
  recommendations.push({
    title: 'General Savings',
    targetAmount: savingsAmount,
    priority: 'medium',
    reasoning: 'Start building your savings habit with a manageable target amount.',
    timeframe: '12 months',
    monthlyContribution: Math.round(savingsAmount / 12)
  });

  return recommendations.slice(0, 3);
}

module.exports = router;
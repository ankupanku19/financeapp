export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences?: {
    currency?: string;
    dateFormat?: string;
    numberFormat?: string;
    language?: string;
    timezone?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      weekly_summary?: boolean;
      goal_reminders?: boolean;
      budget_alerts?: boolean;
    };
    privacy?: {
      profile_visibility?: 'public' | 'private' | 'friends';
      data_sharing?: boolean;
    };
  };
}

export interface Category {
  _id: string;
  name: string;
  color: string;
  icon: string;
  userId: string;
  isDefault: boolean;
}

export interface AISuggestion {
  suggestion: string;
  confidence: number;
  reasoning: string;
}

export interface Income {
  _id: string;
  amount: number;
  description: string;
  categoryId: Category;
  date: string;
  source?: string;
  tags: string[];
  isRecurring: boolean;
  currency: string;
  notes?: string;
  aiCategoryScore: number;
  aiSuggestions: AISuggestion[];
  userId: string;
}

export interface Savings {
  _id: string;
  amount: number;
  description: string;
  date: string;
  goalId?: string;
  userId: string;
}

export interface Goal {
  _id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  status: 'active' | 'completed' | 'paused';
  userId: string;
  category: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface AIInsight {
  id: string;
  type: 'trend' | 'recommendation' | 'warning' | 'achievement';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  data?: any;
}

export interface AIGoalRecommendation {
  title: string;
  targetAmount: number;
  timeframe: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  type: 'goal_reminder' | 'goal_achieved' | 'goal_milestone' | 'income_added' | 'expense_alert' | 'savings_milestone' | 'bill_reminder' | 'security_alert' | 'account_update' | 'marketing' | 'system';
  title: string;
  message: string;
  data: any;
  channels: {
    email: {
      sent: boolean;
      sentAt?: string;
      templateId?: string;
    };
    push: {
      sent: boolean;
      sentAt?: string;
      deviceTokens?: string[];
    };
    inApp: {
      sent: boolean;
      sentAt?: string;
      read: boolean;
      readAt?: string;
    };
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor: string;
  expiresAt: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  metadata: {
    source: string;
    category: string;
    tags?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    email: {
      enabled: boolean;
      frequency: 'immediate' | 'daily' | 'weekly' | 'never';
      types: Record<string, boolean>;
    };
    push: {
      enabled: boolean;
      frequency: 'immediate' | 'daily' | 'weekly' | 'never';
      types: Record<string, boolean>;
    };
    inApp: {
      enabled: boolean;
      frequency: 'immediate' | 'daily' | 'weekly' | 'never';
      types: Record<string, boolean>;
    };
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  deviceTokens: Array<{
    token: string;
    platform: 'ios' | 'android' | 'web';
    lastUsed: string;
    isActive: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

export interface IncomePattern {
  period: string;
  amount: number;
  trend: 'up' | 'down' | 'stable';
  prediction?: number;
}
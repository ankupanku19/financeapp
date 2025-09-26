import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, Income, Savings, Goal, Category, AIInsight, 
  AIGoalRecommendation, AuthResponse, ApiResponse,
  AISuggestion, IncomePattern, NotificationItem
} from '@/types/api';
import { ENV_CONFIG } from '@/config/environment';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || ENV_CONFIG.API_BASE_URL;
const AUTH_TOKEN_KEY = 'auth_token';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.initializeToken();
  }

  private async initializeToken() {
    try {
      this.token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error initializing token:', error);
    }
  }

  // Allow setting token from outside (e.g., after app reload)
  public async setToken(token: string | null) {
    try {
      this.token = token;
      if (token) {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  private async getHeaders(includeAuth = true): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = await this.getHeaders(options.headers?.Authorization !== 'skip');

      // Add timeout and better error handling for deployed server
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...options.headers },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { error: await response.text() };
      }

      if (!response.ok) {
        console.error(`API Error on ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          data,
          url
        });
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`API Timeout on ${endpoint}`);
        throw new Error('Request timeout - please check your internet connection');
      }
      console.error(`API Error on ${endpoint}:`, error);
      throw error;
    }
  }


  // Health check for deployed server
  async healthCheck(): Promise<{ status: string; timestamp: string; uptime: number }> {
    const response = await this.request<{ status: string; timestamp: string; uptime: number }>('/health', {
      headers: { Authorization: 'skip' },
    });
    return response.data;
  }

  // Authentication
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { Authorization: 'skip' },
    });

    if (response.success && response.data.token) {
      await this.setToken(response.data.token);
    }

    return response.data;
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
      headers: { Authorization: 'skip' },
    });

    if (response.success && response.data.token) {
      await this.setToken(response.data.token);
    }

    return response.data;
  }

  async getMe(): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/me');
    return (response as any).data.user;
  }

  async logout(): Promise<void> {
    await this.setToken(null);
    await AsyncStorage.removeItem('demo_mode');
  }

  // Income
  async getIncome(): Promise<Income[]> {
    const response = await this.request<Income[]>('/income');
    return response.data;
  }

  async createIncome(income: Partial<Income>): Promise<Income> {
    const response = await this.request<Income>('/income', {
      method: 'POST',
      body: JSON.stringify(income),
    });
    return response.data;
  }

  async updateIncome(id: string, income: Partial<Income>): Promise<Income> {
    const response = await this.request<Income>(`/income/${id}`, {
      method: 'PUT',
      body: JSON.stringify(income),
    });
    return response.data;
  }

  async deleteIncome(id: string): Promise<void> {
    await this.request(`/income/${id}`, { method: 'DELETE' });
  }

  // Savings
  async getSavings(): Promise<Savings[]> {
    const response = await this.request<Savings[]>('/savings');
    return response.data;
  }

  async createSavings(savings: Partial<Savings>): Promise<Savings> {
    const response = await this.request<Savings>('/savings', {
      method: 'POST',
      body: JSON.stringify(savings),
    });
    return response.data;
  }

  async updateSavings(id: string, savings: Partial<Savings>): Promise<Savings> {
    const response = await this.request<Savings>(`/savings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(savings),
    });
    return response.data;
  }

  async deleteSavings(id: string): Promise<void> {
    await this.request(`/savings/${id}`, {
      method: 'DELETE',
    });
  }

  // Goals
  async getGoals(): Promise<Goal[]> {
    const response = await this.request<Goal[]>('/goals');
    return response.data;
  }

  async createGoal(goal: Partial<Goal>): Promise<Goal> {
    const response = await this.request<Goal>('/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
    return response.data;
  }

  async updateGoal(id: string, goal: Partial<Goal>): Promise<Goal> {
    const response = await this.request<Goal>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goal),
    });
    return response.data;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const response = await this.request<Category[]>('/categories');
    return response.data;
  }

  async createCategory(category: Partial<Category>): Promise<Category> {
    const response = await this.request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
    return response.data;
  }

  // AI Features
  async categorizeIncome(description: string, amount: number): Promise<{
    category: Category;
    confidence: number;
    alternatives: Array<{ category: Category; confidence: number }>;
  }> {
    const response = await this.request('/ai/categorize-income', {
      method: 'POST',
      body: JSON.stringify({ description, amount }),
    });
    return response.data;
  }

  async getSuggestedDescriptions(partial: string): Promise<AISuggestion[]> {
    const response = await this.request<AISuggestion[]>('/ai/suggest-descriptions', {
      method: 'POST',
      body: JSON.stringify({ partial }),
    });
    return response.data;
  }

  async getInsights(): Promise<AIInsight[]> {
    const response = await this.request<AIInsight[]>('/ai/insights');
    return response.data;
  }

  async getGoalRecommendations(): Promise<AIGoalRecommendation[]> {
    const response = await this.request<AIGoalRecommendation[]>('/ai/goal-recommendations');
    return response.data;
  }

  async analyzePatterns(): Promise<IncomePattern[]> {
    const response = await this.request<IncomePattern[]>('/ai/analyze-patterns');
    return response.data;
  }

  async getSavingsSuggestions(): Promise<{
    suggestedAmount: number;
    reasoning: string;
    tips: string[];
  }> {
    const response = await this.request('/ai/savings-suggestions');
    return response.data;
  }

  async getFinancialAdvice(query: string): Promise<{
    advice: string;
    actionItems: string[];
    confidence: number;
  }> {
    const response = await this.request('/ai/financial-advice', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
    return response.data;
  }

  // Notifications
  async getNotifications(page = 1, limit = 20): Promise<{
    notifications: NotificationItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const response = await this.request(`/notifications?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await this.request('/notifications/unread-count');
    return response.data;
  }

  async markNotificationAsRead(id: string): Promise<NotificationItem> {
    const response = await this.request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
    return response.data;
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.request('/notifications/mark-all-read', { method: 'PUT' });
  }

  async getNotificationPreferences(): Promise<any> {
    const response = await this.request('/notifications/preferences');
    return response.data;
  }

  async updateNotificationPreferences(preferences: any): Promise<any> {
    const response = await this.request('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
    return response.data;
  }

  async registerDeviceToken(token: string, platform: 'ios' | 'android' | 'web'): Promise<void> {
    await this.request('/notifications/device-token', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    });
  }

  async removeDeviceToken(token: string): Promise<void> {
    await this.request('/notifications/device-token', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    });
  }

  async sendTestNotification(type: string, title: string, message: string): Promise<any> {
    const response = await this.request('/notifications/test', {
      method: 'POST',
      body: JSON.stringify({ type, title, message }),
    });
    return response.data;
  }

  // Preferences
  async updatePreferences(preferences: Partial<User['preferences']>): Promise<User['preferences']> {
    const response = await this.request<{ preferences: User['preferences'] }>(`/users/preferences`, {
      method: 'PATCH',
      body: JSON.stringify({ preferences }),
    });
    return response.data.preferences;
  }
}

export const apiService = new ApiService();
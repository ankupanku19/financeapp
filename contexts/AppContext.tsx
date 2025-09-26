import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Income, Savings, Goal, Category, AIInsight } from '@/types/api';
import { apiService } from '@/services/api';
import { useAuth } from './AuthContext';

interface AppContextType {
  // Data
  income: Income[];
  savings: Savings[];
  goals: Goal[];
  categories: Category[];
  insights: AIInsight[];
  
  // Loading states
  isLoadingIncome: boolean;
  isLoadingSavings: boolean;
  isLoadingGoals: boolean;
  isLoadingCategories: boolean;
  isLoadingInsights: boolean;
  
  // Actions
  refreshIncome: () => Promise<void>;
  refreshSavings: () => Promise<void>;
  refreshGoals: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshInsights: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Income actions
  addIncome: (income: Partial<Income>) => Promise<void>;
  updateIncome: (id: string, income: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  
  // Savings actions
  addSavings: (savings: Partial<Savings>) => Promise<void>;
  updateSavings: (id: string, savings: Partial<Savings>) => Promise<void>;
  deleteSavings: (id: string) => Promise<void>;
  
  // Goal actions
  addGoal: (goal: Partial<Goal>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  
  // Helper functions
  getGoalProgress: (goalId: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

interface AppProviderProps {
  children: ReactNode;
}

const CACHE_KEYS = {
  income: 'cached_income',
  savings: 'cached_savings',
  goals: 'cached_goals',
  categories: 'cached_categories',
  insights: 'cached_insights',
};

export function AppProvider({ children }: AppProviderProps) {
  const { isAuthenticated } = useAuth();
  
  // Data states
  const [income, setIncome] = useState<Income[]>([]);
  const [savings, setSavings] = useState<Savings[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  
  // Loading states
  const [isLoadingIncome, setIsLoadingIncome] = useState(false);
  const [isLoadingSavings, setIsLoadingSavings] = useState(false);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadCachedData();
      initializeData();
    } else {
      clearData();
    }
  }, [isAuthenticated]);

  const initializeData = async () => {
    try {
      await refreshAll();
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };


  const loadCachedData = async () => {
    try {
      const [cachedIncome, cachedSavings, cachedGoals, cachedCategories, cachedInsights] = 
        await Promise.all([
          AsyncStorage.getItem(CACHE_KEYS.income),
          AsyncStorage.getItem(CACHE_KEYS.savings),
          AsyncStorage.getItem(CACHE_KEYS.goals),
          AsyncStorage.getItem(CACHE_KEYS.categories),
          AsyncStorage.getItem(CACHE_KEYS.insights),
        ]);

      if (cachedIncome) setIncome(JSON.parse(cachedIncome));
      if (cachedSavings) setSavings(JSON.parse(cachedSavings));
      if (cachedGoals) setGoals(JSON.parse(cachedGoals));
      if (cachedCategories) setCategories(JSON.parse(cachedCategories));
      if (cachedInsights) setInsights(JSON.parse(cachedInsights));
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  const clearData = () => {
    setIncome([]);
    setSavings([]);
    setGoals([]);
    setCategories([]);
    setInsights([]);
  };

  const refreshIncome = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoadingIncome(true);
      const data = await apiService.getIncome();
      setIncome(data);
      await AsyncStorage.setItem(CACHE_KEYS.income, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to refresh income:', error);
    } finally {
      setIsLoadingIncome(false);
    }
  };

  const refreshSavings = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoadingSavings(true);
      const data = await apiService.getSavings();
      setSavings(data);
      await AsyncStorage.setItem(CACHE_KEYS.savings, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to refresh savings:', error);
    } finally {
      setIsLoadingSavings(false);
    }
  };

  const refreshGoals = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoadingGoals(true);
      const data = await apiService.getGoals();
      setGoals(data);
      await AsyncStorage.setItem(CACHE_KEYS.goals, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to refresh goals:', error);
    } finally {
      setIsLoadingGoals(false);
    }
  };

  const refreshCategories = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoadingCategories(true);
      const data = await apiService.getCategories();
      setCategories(data);
      await AsyncStorage.setItem(CACHE_KEYS.categories, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to refresh categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const refreshInsights = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoadingInsights(true);
      const data = await apiService.getInsights();
      setInsights(data);
      await AsyncStorage.setItem(CACHE_KEYS.insights, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to refresh insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      refreshIncome(),
      refreshSavings(),
      refreshGoals(),
      refreshCategories(),
      refreshInsights(),
    ]);
  };

  const addIncome = async (incomeData: Partial<Income>) => {
    try {
      const newIncome = await apiService.createIncome(incomeData);
      setIncome(prev => [newIncome, ...prev]);
      await refreshInsights(); // Refresh insights after adding income
    } catch (error) {
      console.error('Failed to add income:', error);
      throw error;
    }
  };

  const updateIncome = async (id: string, incomeData: Partial<Income>) => {
    try {
      const updatedIncome = await apiService.updateIncome(id, incomeData);
      setIncome(prev => prev.map(item => item._id === id ? updatedIncome : item));
    } catch (error) {
      console.error('Failed to update income:', error);
      throw error;
    }
  };

  const deleteIncome = async (id: string) => {
    try {
      await apiService.deleteIncome(id);
      setIncome(prev => prev.filter(item => item._id !== id));
      await refreshInsights();
    } catch (error) {
      console.error('Failed to delete income:', error);
      throw error;
    }
  };

  const addSavings = async (savingsData: Partial<Savings>) => {
    try {
      const newSavings = await apiService.createSavings(savingsData);
      setSavings(prev => [newSavings, ...prev]);
      
      // If savings is linked to a goal, update the goal's current amount locally
      if (newSavings.goalId) {
        const goalId = typeof newSavings.goalId === 'string' 
          ? newSavings.goalId 
          : newSavings.goalId._id;
        
        setGoals(prev => prev.map(goal => {
          if (goal._id === goalId) {
            return {
              ...goal,
              currentAmount: goal.currentAmount + newSavings.amount,
              // Check if goal is completed
              status: (goal.currentAmount + newSavings.amount) >= goal.targetAmount ? 'completed' : goal.status
            };
          }
          return goal;
        }));
      }
      
      await refreshInsights(); // Refresh insights after adding savings
    } catch (error) {
      console.error('Failed to add savings:', error);
      throw error;
    }
  };

  const updateSavings = async (id: string, savingsData: Partial<Savings>) => {
    try {
      const updatedSavings = await apiService.updateSavings(id, savingsData);
      setSavings(prev => prev.map(item => item._id === id ? updatedSavings : item));
    } catch (error) {
      console.error('Failed to update savings:', error);
      throw error;
    }
  };

  const deleteSavings = async (id: string) => {
    try {
      // Find the savings entry before deleting to update the goal
      const savingsToDelete = savings.find(s => s._id === id);
      
      await apiService.deleteSavings(id);
      setSavings(prev => prev.filter(item => item._id !== id));
      
      // If savings was linked to a goal, update the goal's current amount locally
      if (savingsToDelete?.goalId) {
        const goalId = typeof savingsToDelete.goalId === 'string' 
          ? savingsToDelete.goalId 
          : savingsToDelete.goalId._id;
        
        setGoals(prev => prev.map(goal => {
          if (goal._id === goalId) {
            const newCurrentAmount = Math.max(0, goal.currentAmount - savingsToDelete.amount);
            return {
              ...goal,
              currentAmount: newCurrentAmount,
              // If goal was completed and now has less money, revert to active
              status: newCurrentAmount < goal.targetAmount && goal.status === 'completed' ? 'active' : goal.status
            };
          }
          return goal;
        }));
      }
      
      await refreshInsights();
    } catch (error) {
      console.error('Failed to delete savings:', error);
      throw error;
    }
  };

  const addGoal = async (goalData: Partial<Goal>) => {
    try {
      const newGoal = await apiService.createGoal(goalData);
      setGoals(prev => [newGoal, ...prev]);
    } catch (error) {
      console.error('Failed to add goal:', error);
      throw error;
    }
  };

  const updateGoal = async (id: string, goalData: Partial<Goal>) => {
    try {
      const updatedGoal = await apiService.updateGoal(id, goalData);
      setGoals(prev => prev.map(item => item._id === id ? updatedGoal : item));
    } catch (error) {
      console.error('Failed to update goal:', error);
      throw error;
    }
  };

  const getGoalProgress = (goalId: string): number => {
    const goalSavings = savings.filter(saving => {
      // Handle both string and object goalId formats
      const savingGoalId = typeof saving.goalId === 'string' 
        ? saving.goalId 
        : saving.goalId?._id;
      return savingGoalId === goalId;
    });
    const total = goalSavings.reduce((sum, saving) => sum + saving.amount, 0);
    return total;
  };

  const value: AppContextType = {
    // Data
    income,
    savings,
    goals,
    categories,
    insights,
    
    // Loading states
    isLoadingIncome,
    isLoadingSavings,
    isLoadingGoals,
    isLoadingCategories,
    isLoadingInsights,
    
    // Actions
    refreshIncome,
    refreshSavings,
    refreshGoals,
    refreshCategories,
    refreshInsights,
    refreshAll,
    
    // Income actions
    addIncome,
    updateIncome,
    deleteIncome,
    
    // Savings actions
    addSavings,
    updateSavings,
    deleteSavings,
    
    // Goal actions
    addGoal,
    updateGoal,
    
    // Helper functions
    getGoalProgress,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
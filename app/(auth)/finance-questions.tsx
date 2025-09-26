import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Brain, DollarSign, Target, TrendingUp, PiggyBank } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';

interface Question {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  options: { id: string; label: string; icon?: React.ReactNode }[];
}

const FINANCE_QUESTIONS: Question[] = [
  {
    id: 'income_range',
    question: 'What is your monthly income range?',
    type: 'single',
    options: [
      { id: 'under_2k', label: 'Under $2,000', icon: <DollarSign size={20} color="#6366F1" /> },
      { id: '2k_5k', label: '$2,000 - $5,000', icon: <DollarSign size={20} color="#6366F1" /> },
      { id: '5k_10k', label: '$5,000 - $10,000', icon: <DollarSign size={20} color="#6366F1" /> },
      { id: 'over_10k', label: 'Over $10,000', icon: <DollarSign size={20} color="#6366F1" /> },
    ],
  },
  {
    id: 'financial_goals',
    question: 'What are your primary financial goals?',
    type: 'multiple',
    options: [
      { id: 'emergency_fund', label: 'Build Emergency Fund', icon: <PiggyBank size={20} color="#10B981" /> },
      { id: 'save_house', label: 'Save for a House', icon: <Target size={20} color="#F59E0B" /> },
      { id: 'retirement', label: 'Retirement Planning', icon: <TrendingUp size={20} color="#8B5CF6" /> },
      { id: 'debt_payoff', label: 'Pay Off Debt', icon: <DollarSign size={20} color="#EF4444" /> },
      { id: 'investment', label: 'Investment Growth', icon: <TrendingUp size={20} color="#6366F1" /> },
      { id: 'education', label: 'Education Fund', icon: <Target size={20} color="#F97316" /> },
    ],
  },
  {
    id: 'spending_priority',
    question: 'What do you spend most of your money on?',
    type: 'single',
    options: [
      { id: 'necessities', label: 'Basic Necessities (Food, Rent)', icon: <DollarSign size={20} color="#6366F1" /> },
      { id: 'entertainment', label: 'Entertainment & Dining', icon: <DollarSign size={20} color="#6366F1" /> },
      { id: 'shopping', label: 'Shopping & Lifestyle', icon: <DollarSign size={20} color="#6366F1" /> },
      { id: 'travel', label: 'Travel & Experiences', icon: <DollarSign size={20} color="#6366F1" /> },
    ],
  },
  {
    id: 'financial_experience',
    question: 'How would you describe your financial experience?',
    type: 'single',
    options: [
      { id: 'beginner', label: 'Just Getting Started', icon: <Brain size={20} color="#6366F1" /> },
      { id: 'intermediate', label: 'Some Experience', icon: <Brain size={20} color="#6366F1" /> },
      { id: 'advanced', label: 'Very Experienced', icon: <Brain size={20} color="#6366F1" /> },
    ],
  },
  {
    id: 'saving_frequency',
    question: 'How often do you currently save money?',
    type: 'single',
    options: [
      { id: 'never', label: 'Rarely or Never', icon: <PiggyBank size={20} color="#6366F1" /> },
      { id: 'sometimes', label: 'Sometimes', icon: <PiggyBank size={20} color="#6366F1" /> },
      { id: 'monthly', label: 'Every Month', icon: <PiggyBank size={20} color="#6366F1" /> },
      { id: 'weekly', label: 'Every Week', icon: <PiggyBank size={20} color="#6366F1" /> },
    ],
  },
];

export default function FinanceQuestionsScreen() {
  const { tempToken } = useLocalSearchParams<{ tempToken: string }>();
  const { refreshUser } = useAuth();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const question = FINANCE_QUESTIONS[currentQuestion];
  const isLastQuestion = currentQuestion === FINANCE_QUESTIONS.length - 1;
  const currentAnswers = answers[question.id] || [];

  const handleAnswerSelect = (optionId: string) => {
    const newAnswers = { ...answers };
    
    if (question.type === 'single') {
      newAnswers[question.id] = [optionId];
    } else {
      const current = newAnswers[question.id] || [];
      if (current.includes(optionId)) {
        newAnswers[question.id] = current.filter(id => id !== optionId);
      } else {
        newAnswers[question.id] = [...current, optionId];
      }
    }
    
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentAnswers.length === 0) {
      Alert.alert('Please select an answer', 'Choose at least one option to continue');
      return;
    }

    if (isLastQuestion) {
      handleComplete();
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      setIsLoading(true);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/complete-onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`,
        },
        body: JSON.stringify({
          financeAnswers: answers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete onboarding');
      }

      // Store the final auth token and user data
      if (data.success && data.data.token) {
        // Store the authentication token
        await AsyncStorage.setItem('auth_token', data.data.token);
        
        // Refresh the auth context to load the new user data
        await refreshUser();
        
        // Navigate to main app
        console.log('Finance Questions - Full response:', data);
        console.log('Finance Questions - Navigating to main app');
        router.replace('/(tabs)');
      } else {
        throw new Error('No authentication token received');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete setup');
    } finally {
      setIsLoading(false);
    }
  };

  const OptionButton = ({ option }: { option: { id: string; label: string; icon?: React.ReactNode } }) => {
    const isSelected = currentAnswers.includes(option.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.optionButton,
          isSelected && styles.optionButtonSelected,
        ]}
        onPress={() => handleAnswerSelect(option.id)}
        activeOpacity={0.7}
      >
        <View style={styles.optionContent}>
          {option.icon && (
            <View style={[
              styles.optionIcon,
              { backgroundColor: isSelected ? '#EEF2FF' : '#F3F4F6' }
            ]}>
              {option.icon}
            </View>
          )}
          <Text style={[
            styles.optionLabel,
            { color: isSelected ? '#6366F1' : '#374151' }
          ]}>
            {option.label}
          </Text>
        </View>
        {isSelected && (
          <View style={styles.selectedCheck}>
            <Text style={styles.selectedCheckmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={currentQuestion > 0 ? handlePrevious : () => router.back()}
        >
          <ArrowLeft size={20} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Financial Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <Text style={styles.question}>{question.question}</Text>
          
          {question.type === 'multiple' && (
            <Text style={styles.instruction}>Select all that apply</Text>
          )}

          {/* Options */}
          <View style={styles.optionsContainer}>
            {question.options.map((option) => (
              <OptionButton key={option.id} option={option} />
            ))}
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            <Animated.View
              style={{
                transform: [{ scale: buttonScale }],
              }}
            >
              <TouchableOpacity
                style={[styles.nextButton, isLoading && styles.disabledButton]}
                onPress={handleNext}
                disabled={isLoading || currentAnswers.length === 0}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={[styles.nextButtonText, { marginLeft: 8 }]}>
                      {isLastQuestion ? 'Completing...' : 'Next'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.nextButtonText}>
                    {isLastQuestion ? 'Complete Setup' : 'Next'}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  instruction: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 40,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  optionButtonSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  selectedCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckmark: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  navigationContainer: {
    gap: 12,
  },
  nextButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

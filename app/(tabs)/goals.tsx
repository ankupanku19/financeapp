import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeArea } from '@/constants/SafeArea';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ProgressBar } from '@/components/ProgressBar';
import { AddGoalSheet } from '@/components/AddGoalSheet';
import { AnimatedGoalStats } from '@/components/AnimatedGoalStats';
import { apiService } from '@/services/api';
import { AIGoalRecommendation } from '@/types/api';
import { 
  Target, 
  Plus, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Pause, 
  Lightbulb, 
  TrendingUp, 
  Award, 
  Zap, 
  MoreVertical 
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

interface GoalCardProps {
  goal: any;
  currentAmount: number;
  progress: number;
  daysLeft: number;
  onStatusChange: (goalId: string, status: 'active' | 'completed' | 'paused') => void;
  index: number;
}

const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  currentAmount,
  progress,
  daysLeft,
  onStatusChange,
  index,
}) => {
  const { theme } = useTheme();
  const cardAnimValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(cardAnimValue, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }, index * 100);

    return () => clearTimeout(timer);
  }, [index]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color={theme.colors.success[600]} />;
      case 'paused':
        return <Pause size={16} color={theme.colors.warning[600]} />;
      default:
        return <Clock size={16} color={theme.colors.primary[600]} />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.goalCard,
        { backgroundColor: theme.colors.background.primary },
        {
          opacity: cardAnimValue,
          transform: [
            {
              translateY: cardAnimValue.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
            { scale: scaleValue },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        style={styles.goalCardContent}
        activeOpacity={0.9}
      >
        <View style={styles.goalHeader}>
          <View style={styles.goalInfo}>
            <View style={styles.goalTitleRow}>
              {getStatusIcon(goal.status)}
              <Text style={[styles.goalTitle, { color: theme.colors.text.primary }]}>
                {goal.title}
              </Text>
            </View>
            <Text style={[styles.goalCategory, { color: theme.colors.text.secondary }]}>
              {goal.category}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                'Goal Actions',
                'What would you like to do?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Mark Complete',
                    onPress: () => onStatusChange(goal._id, 'completed')
                  },
                  {
                    text: 'Pause Goal',
                    onPress: () => onStatusChange(goal._id, 'paused')
                  },
                ]
              );
            }}
          >
            <MoreVertical size={16} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.goalAmounts}>
          <Text style={[styles.currentAmount, { color: theme.colors.success[600] }]}>
            ${(currentAmount || 0).toLocaleString()}
          </Text>
          <Text style={[styles.targetAmount, { color: theme.colors.text.secondary }]}>
            of ${(goal.targetAmount || 0).toLocaleString()}
          </Text>
        </View>

        <View style={styles.progressSection}>
          <ProgressBar 
            current={currentAmount || 0}
            target={goal.targetAmount || 1}
            height={6}
            backgroundColor={theme.colors.neutral[200]}
            progressColor={theme.colors.primary[500]}
            showLabels={false}
            showPercentage={false}
          />
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: theme.colors.text.secondary }]}>
              {Math.round(progress)}% complete
            </Text>
            <Text style={[styles.daysLeft, { color: theme.colors.text.secondary }]}>
              {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function GoalsScreen() {
  const { theme } = useTheme();
  const { headerWithSafeArea } = useSafeArea();
  const {
    goals,
    isLoadingGoals,
    refreshGoals,
    addGoal,
    updateGoal,
    getGoalProgress,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<AIGoalRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    loadGoalRecommendations();
    
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
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadGoalRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const recommendations = await apiService.getGoalRecommendations();
      setAiRecommendations(recommendations);
    } catch (error) {
      console.error('Failed to load goal recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshGoals(), loadGoalRecommendations()]);
    setRefreshing(false);
  };

  const handleCreateGoalFromRecommendation = async (recommendation: AIGoalRecommendation) => {
    try {
      await addGoal({
        title: recommendation.title,
        targetAmount: recommendation.targetAmount,
        currentAmount: 0,
        targetDate: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toISOString(),
        status: 'active',
        category: 'savings',
        description: recommendation.reasoning,
        priority: recommendation.priority,
      });
      Alert.alert('Goal Created', `"${recommendation.title}" has been added to your goals!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to create goal. Please try again.');
    }
  };

  const handleGoalStatusChange = async (goalId: string, newStatus: 'active' | 'completed' | 'paused') => {
    try {
      await updateGoal(goalId, { status: newStatus });
    } catch (error) {
      Alert.alert('Error', 'Failed to update goal status. Please try again.');
    }
  };

  const activeGoals = goals.filter(goal => goal.status === 'active');
  const completedGoals = goals.filter(goal => goal.status === 'completed');
  const totalSaved = activeGoals.reduce((sum, goal) => sum + getGoalProgress(goal._id), 0);
  const totalTarget = activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const averageProgress = activeGoals.length > 0
    ? activeGoals.reduce((sum, goal) => {
        const progress = goal.targetAmount > 0 ? (getGoalProgress(goal._id) / goal.targetAmount) * 100 : 0;
        return sum + progress;
      }, 0) / activeGoals.length
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, headerWithSafeArea, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitle}>
            <Target size={28} color={theme.colors.primary[500]} />
            <View>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>Goals</Text>
              <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                Track your financial targets
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.colors.primary[500] }]}
            onPress={() => setShowAddGoal(true)}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary[500]]}
            tintColor={theme.colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Goal Stats */}
        <Animated.View
          style={[
            styles.statsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <AnimatedGoalStats
            stats={[
              {
                title: "Active Goals",
                value: (activeGoals?.length || 0).toString(),
                subtitle: "In Progress",
                icon: <Target size={20} color="#FFFFFF" />,
                gradientColors: [theme.colors.primary[400] || '#818CF8', theme.colors.primary[600] || '#4F46E5'],
              },
              {
                title: "Completed",
                value: (completedGoals?.length || 0).toString(),
                subtitle: "Achieved",
                icon: <Award size={20} color="#FFFFFF" />,
                gradientColors: [theme.colors.success[400] || '#4ADE80', theme.colors.success[600] || '#16A34A'],
              },
              {
                title: "Total Saved",
                value: `$${(totalSaved || 0).toLocaleString()}`,
                subtitle: `of $${(totalTarget || 0).toLocaleString()}`,
                icon: <TrendingUp size={20} color="#FFFFFF" />,
                gradientColors: [theme.colors.warning[400] || '#FBBF24', theme.colors.warning[600] || '#D97706'],
              },
              {
                title: "Avg Progress",
                value: `${Math.round(averageProgress || 0)}%`,
                subtitle: "Completion Rate",
                icon: <Zap size={20} color="#FFFFFF" />,
                gradientColors: [theme.colors.accent[400] || '#FBBF24', theme.colors.accent[600] || '#D97706'],
              },
            ]}
            autoAnimate={true}
            animateInterval={3000}
          />
        </Animated.View>

        {/* Goals List */}
        <Animated.View
          style={[
            styles.goalsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Your Goals
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
              {activeGoals.length} active
            </Text>
          </View>

          {isLoadingGoals ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="large" />
            </View>
          ) : activeGoals.length > 0 ? (
            <View style={styles.goalsList}>
              {activeGoals.map((goal, index) => {
                const currentAmount = getGoalProgress(goal._id);
                const progress = goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0;
                const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <GoalCard
                    key={goal._id}
                    goal={goal}
                    currentAmount={currentAmount}
                    progress={progress}
                    daysLeft={daysLeft}
                    onStatusChange={handleGoalStatusChange}
                    index={index}
                  />
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: `${theme.colors.text.secondary}15` }]}>
                <Target size={32} color={theme.colors.text.secondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                No active goals yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
                Create your first savings goal to get started
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: theme.colors.primary[500] }]}
                onPress={() => setShowAddGoal(true)}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Add Goal</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <Animated.View
            style={[
              styles.completedSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Completed Goals
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
                {completedGoals.length} achieved
              </Text>
            </View>
            
            <View style={styles.goalsList}>
              {completedGoals.map((goal, index) => (
                <View key={goal._id} style={[styles.completedGoalCard, { backgroundColor: theme.colors.background.secondary }]}>
                  <View style={styles.completedGoalHeader}>
                    <CheckCircle size={16} color={theme.colors.success[500]} />
                    <Text style={[styles.completedGoalTitle, { color: theme.colors.text.primary }]}>
                      {goal.title}
                    </Text>
                    <View style={[styles.completedBadge, { backgroundColor: theme.colors.success[100] }]}>
                      <Text style={[styles.completedBadgeText, { color: theme.colors.success[700] }]}>
                        COMPLETED
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.completedGoalAmount, { color: theme.colors.success[600] }]}>
                    ${(goal.targetAmount || 0).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* AI Recommendations - Moved to Bottom */}
        {aiRecommendations.length > 0 && (
          <Animated.View
            style={[
              styles.recommendationsSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                AI Recommendations
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
                Suggested goals
              </Text>
            </View>
            
            {loadingRecommendations ? (
              <View style={styles.loadingContainer}>
                <LoadingSpinner size="large" />
              </View>
            ) : (
              <View style={styles.recommendationsList}>
                {aiRecommendations.slice(0, 2).map((recommendation, index) => (
                  <View key={index} style={[styles.recommendationCard, { backgroundColor: theme.colors.background.secondary }]}>
                    <View style={styles.recommendationHeader}>
                      <Lightbulb size={16} color={theme.colors.warning[500]} />
                      <Text style={[styles.recommendationTitle, { color: theme.colors.text.primary }]}>
                        {recommendation.title}
                      </Text>
                      <View style={[
                        styles.priorityBadge,
                        { 
                          backgroundColor: recommendation.priority === 'high' ? theme.colors.error[100] : 
                                           recommendation.priority === 'medium' ? theme.colors.warning[100] : theme.colors.neutral[100]
                        }
                      ]}>
                        <Text style={[
                          styles.priorityText,
                          { 
                            color: recommendation.priority === 'high' ? theme.colors.error[700] : 
                                   recommendation.priority === 'medium' ? theme.colors.warning[700] : theme.colors.neutral[700]
                          }
                        ]}>
                          {recommendation.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={[styles.recommendationAmount, { color: theme.colors.text.secondary }]}>
                      Target: ${(recommendation.targetAmount || 0).toLocaleString()}
                    </Text>
                    
                    <Text style={[styles.recommendationReasoning, { color: theme.colors.text.secondary }]}>
                      {recommendation.reasoning}
                    </Text>
                    
                    <TouchableOpacity
                      style={[styles.createGoalButton, { backgroundColor: theme.colors.primary[500] }]}
                      onPress={() => handleCreateGoalFromRecommendation(recommendation)}
                    >
                      <Plus size={16} color="#FFFFFF" />
                      <Text style={styles.createGoalButtonText}>Create Goal</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Add Goal Modal */}
      <AddGoalSheet
        visible={showAddGoal}
        onClose={() => setShowAddGoal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  statsSection: {
    marginBottom: 32,
  },
  goalsSection: {
    marginBottom: 32,
  },
  completedSection: {
    marginBottom: 32,
  },
  recommendationsSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  goalsList: {
    gap: 12,
  },
  goalCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  goalCardContent: {
    padding: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  goalCategory: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 16,
  },
  currentAmount: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  targetAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressSection: {
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  daysLeft: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completedGoalCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  completedGoalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  completedGoalTitle: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  completedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  completedGoalAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  recommendationsList: {
    gap: 16,
  },
  recommendationCard: {
    padding: 16,
    borderRadius: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  recommendationAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  recommendationReasoning: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  createGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  createGoalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeArea } from '@/constants/SafeArea';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AddSavingsSheet } from '@/components/AddSavingsSheet';
import { AnimatedStatCards } from '@/components/AnimatedStatCards';
import {
  Plus,
  PiggyBank,
  Target,
  Calendar,
  TrendingUp,
  Award,
  Activity,
  DollarSign,
  Clock,
  Zap,
} from 'lucide-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function SavingsScreen() {
  const {
    savings,
    goals,
    isLoadingSavings,
    refreshSavings,
    refreshGoals,
    getGoalProgress
  } = useApp();
  const { theme } = useTheme();
  const { headerWithSafeArea, contentWithSafeArea } = useSafeArea();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddSavings, setShowAddSavings] = useState(false);


  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshSavings(), refreshGoals()]);
    setRefreshing(false);
  };


  // Calculate savings stats with proper null checks
  const totalSavings = savings?.reduce((sum, item) => sum + (item?.amount || 0), 0) || 0;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlySavings = savings?.filter(item => {
    if (!item?.date) return false;
    const date = new Date(item.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).reduce((sum, item) => sum + (item?.amount || 0), 0) || 0;

  const averageSaving = savings?.length > 0 ? totalSavings / savings.length : 0;

  // Separate general savings from goal-linked savings
  const generalSavings = savings?.filter(saving => {
    if (!saving) return false;
    const goalId = typeof saving.goalId === 'string' ? saving.goalId : saving.goalId?._id;
    return !goalId;
  }) || [];

  const goalLinkedSavings = savings?.filter(saving => {
    if (!saving) return false;
    const goalId = typeof saving.goalId === 'string' ? saving.goalId : saving.goalId?._id;
    return !!goalId;
  }) || [];

  const generalSavingsTotal = generalSavings.reduce((sum, item) => sum + (item?.amount || 0), 0);
  const goalSavingsTotal = goalLinkedSavings.reduce((sum, item) => sum + (item?.amount || 0), 0);

  const activeGoals = goals?.filter(goal => {
    if (!goal) return false;
    const goalSavings = getGoalProgress(goal._id);
    const progress = goal.targetAmount > 0 ? (goalSavings / goal.targetAmount) * 100 : 0;
    return progress < 100;
  }) || [];

  // Carousel data
  const carouselData = [
    {
      title: "Total General",
      value: `$${generalSavingsTotal.toLocaleString()}`,
      subtitle: "Unallocated",
      icon: <PiggyBank size={28} color="#FFFFFF" />,
      gradientColors: [theme.colors.primary[400] || '#6366F1', theme.colors.primary[600] || '#4F46E5']
    },
    {
      title: "Goal Total",
      value: `$${goalSavingsTotal.toLocaleString()}`,
      subtitle: "Allocated",
      icon: <Target size={28} color="#FFFFFF" />,
      gradientColors: [theme.colors.warning[400] || '#F59E0B', theme.colors.warning[600] || '#D97706']
    },
    {
      title: "This Month",
      value: `$${monthlySavings.toLocaleString()}`,
      subtitle: "Current period",
      icon: <TrendingUp size={28} color="#FFFFFF" />,
      gradientColors: [theme.colors.success[400] || '#10B981', theme.colors.success[600] || '#059669']
    },
    {
      title: "Active Goals",
      value: activeGoals.length.toString(),
      subtitle: "In progress",
      icon: <Award size={28} color="#FFFFFF" />,
      gradientColors: [theme.colors.primary[400] || '#6366F1', theme.colors.primary[600] || '#4F46E5']
    },
    {
      title: "Average",
      value: `$${Math.round(averageSaving).toLocaleString()}`,
      subtitle: "Per saving",
      icon: <Activity size={28} color="#FFFFFF" />,
      gradientColors: [theme.colors.warning[400] || '#F59E0B', theme.colors.warning[600] || '#D97706']
    },
    {
      title: "Total Saved",
      value: `$${totalSavings.toLocaleString()}`,
      subtitle: "All time",
      icon: <DollarSign size={28} color="#FFFFFF" />,
      gradientColors: [theme.colors.success[400] || '#10B981', theme.colors.success[600] || '#059669']
    }
  ];


  const GoalCard = ({ goal, index }: { goal: any; index: number }) => {
    if (!goal) return null;
    
    const goalSavings = getGoalProgress(goal._id);
    const progress = goal.targetAmount > 0 ? (goalSavings / goal.targetAmount) * 100 : 0;

    return (
      <View style={[styles.goalCard, { backgroundColor: theme.colors.background.primary }]}>
        <TouchableOpacity
          style={styles.goalCardContent}
          activeOpacity={0.9}
        >
          <View style={styles.goalHeader}>
            <View style={styles.goalInfo}>
              <Text style={[styles.goalTitle, { color: theme.colors.text.primary }]}>
                {goal.title || 'Untitled Goal'}
              </Text>
              <Text style={[styles.goalTarget, { color: theme.colors.text.secondary }]}>
                Target: ${(goal.targetAmount || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.goalProgressBadge}>
              <Text style={[styles.goalProgressText, { color: theme.colors.primary[600] || '#4F46E5' }]}>
                {Math.round(progress)}%
              </Text>
            </View>
          </View>

          <View style={styles.goalStats}>
            <Text style={[styles.goalCurrent, { color: theme.colors.text.primary }]}>
              ${goalSavings.toLocaleString()}
            </Text>
            <Text style={[styles.goalRemaining, { color: theme.colors.text.secondary }]}>
              ${Math.max(0, (goal.targetAmount || 0) - goalSavings).toLocaleString()} remaining
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: `${theme.colors.primary[500] || '#6366F1'}20` }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: progress >= 100 ? (theme.colors.success[500] || '#10B981') : (theme.colors.primary[500] || '#6366F1')
                  }
                ]}
              />
            </View>
            <View style={styles.goalMeta}>
              <View style={styles.goalDateInfo}>
                <Calendar size={12} color={theme.colors.text.secondary} />
                <Text style={[styles.goalDate, { color: theme.colors.text.secondary }]}>
                  Due {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: new Date(goal.targetDate).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                  }) : 'No date'}
                </Text>
              </View>
              {progress >= 100 && (
                <View style={[styles.completeBadge, { backgroundColor: theme.colors.success[500] || '#10B981' }]}>
                  <Award size={12} color="#FFFFFF" />
                  <Text style={styles.completeText}>Complete</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const SavingCard = ({ saving, index }: { saving: any; index: number }) => {
    if (!saving) return null;
    
    const goalId = typeof saving.goalId === 'string' ? saving.goalId : saving.goalId?._id;
    const relatedGoal = goals?.find(g => g?._id === goalId);

    return (
      <View style={[styles.savingCard, { backgroundColor: theme.colors.background.primary }]}>
        <TouchableOpacity
          style={styles.savingCardContent}
          activeOpacity={0.9}
        >
          <View style={styles.savingHeader}>
            <View style={styles.savingInfo}>
              <Text style={[styles.savingTitle, { color: theme.colors.text.primary }]}>
                {saving.description || 'Untitled Savings'}
              </Text>
              <View style={styles.savingMeta}>
                <Calendar size={12} color={theme.colors.text.secondary} />
                <Text style={[styles.savingDate, { color: theme.colors.text.secondary }]}>
                  {saving.date ? new Date(saving.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  }) : 'No date'}
                </Text>
              </View>
            </View>
            <View style={styles.savingAmount}>
              <Text style={[styles.savingValue, { color: theme.colors.success[600] || '#10B981' }]}>
                +${(saving.amount || 0).toLocaleString()}
              </Text>
              {relatedGoal && (
                <View style={[styles.goalBadge, { backgroundColor: `${theme.colors.primary[500] || '#6366F1'}15` }]}>
                  <Target size={10} color={theme.colors.primary[500] || '#6366F1'} />
                  <Text style={[styles.goalBadgeText, { color: theme.colors.primary[500] || '#6366F1' }]}>
                    {relatedGoal.title || 'Unknown Goal'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          headerWithSafeArea,
          {
            backgroundColor: theme.colors.background.primary,
          }
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitle}>
            <PiggyBank size={28} color={theme.colors.primary[500]} />
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              Savings Dashboard
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary[500] }]}
            onPress={() => setShowAddSavings(true)}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          {goals.length} goals • {savings.length} savings entries
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, contentWithSafeArea]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary[500]]}
            tintColor={theme.colors.primary[500]}
          />
        }
      >
        {/* Statistics Cards */}
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Savings Overview
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
              {savings.length} total entries
            </Text>
          </View>
        </View>
        
        {/* Full-width carousel outside the padded container */}
        <View style={styles.carouselFullWidth}>
          <AnimatedStatCards 
            cards={carouselData}
            autoplay={true}
            autoplayInterval={4000}
          />
        </View>
        
        <View style={styles.sectionsContainer}>
        {/* Goals Section */}
        <View style={styles.goalsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Active Goals
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
              {goals.length} items
            </Text>
          </View>

          {isLoadingSavings ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="large" />
            </View>
          ) : goals.length > 0 ? (
            <View style={styles.goalsList}>
              {goals.slice(0, 5).map((goal, index) => (
                <GoalCard key={goal._id} goal={goal} index={index} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: `${theme.colors.text.secondary}15` }]}>
                <Target size={32} color={theme.colors.text.secondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                No Goals Set
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
                Create savings goals to track your progress
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: theme.colors.primary[500] }]}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Create Goal</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* General Savings */}
        <View style={styles.savingsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              General Savings
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
              {generalSavings.length} items
            </Text>
          </View>

          {generalSavings.length > 0 ? (
            <View style={styles.savingsList}>
              {generalSavings.slice(0, 5).map((saving, index) => (
                <SavingCard key={saving._id} saving={saving} index={index} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: `${theme.colors.text.secondary}15` }]}>
                <PiggyBank size={32} color={theme.colors.text.secondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                No General Savings
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
                Add savings without linking to specific goals
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: theme.colors.primary[500] || '#6366F1' }]}
                onPress={() => setShowAddSavings(true)}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Add General Savings</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Goal-Linked Savings */}
        <View style={styles.savingsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Goal-Linked Savings
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
              {goalLinkedSavings.length} items
            </Text>
          </View>

          {goalLinkedSavings.length > 0 ? (
            <View style={styles.savingsList}>
              {goalLinkedSavings.slice(0, 5).map((saving, index) => (
                <SavingCard key={saving._id} saving={saving} index={index} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: `${theme.colors.text.secondary}15` }]}>
                <Target size={32} color={theme.colors.text.secondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                No Goal Savings
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
                Add savings linked to specific goals
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: theme.colors.primary[500] || '#6366F1' }]}
                onPress={() => setShowAddSavings(true)}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Add Goal Savings</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        </View>
      </ScrollView>

      {/* Add Savings Modal */}
      <AddSavingsSheet
        visible={showAddSavings}
        onClose={() => setShowAddSavings(false)}
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
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
    paddingBottom: 120,
  },
  statsSection: {
    marginBottom: 16,
  },
  carouselFullWidth: {
    marginBottom: 32,
  },
  sectionsContainer: {
    paddingHorizontal: 12,
  },
  goalsSection: {
    marginBottom: 32,
  },
  savingsSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  goalsList: {
    gap: 16,
  },
  goalCard: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  goalCardContent: {
    padding: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalInfo: {
    flex: 1,
    marginRight: 16,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 22,
  },
  goalTarget: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.8,
  },
  goalProgressBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 50,
    alignItems: 'center',
  },
  goalProgressText: {
    fontSize: 13,
    fontWeight: '700',
  },
  goalStats: {
    marginBottom: 16,
  },
  goalCurrent: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  goalRemaining: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  progressContainer: {
    gap: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  savingsList: {
    gap: 16,
  },
  savingCard: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  savingCardContent: {
    padding: 20,
  },
  savingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  savingInfo: {
    flex: 1,
    marginRight: 16,
  },
  savingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  savingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savingDate: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  savingAmount: {
    alignItems: 'flex-end',
    gap: 6,
  },
  savingValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  goalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
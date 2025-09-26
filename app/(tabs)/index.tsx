import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
// Removed LineChart in favor of a custom responsive chart
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeArea } from '@/constants/SafeArea';
import { useNotifications } from '@/hooks/useNotifications';
import { InsightCard } from '@/components/InsightCard';
import { ProgressBar } from '@/components/ProgressBar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AddIncomeSheet } from '@/components/AddIncomeSheet';
import {
  DollarSign,
  TrendingUp,
  Target,
  PiggyBank,
  Plus,
  Eye,
  EyeOff,
  Bell,
  Settings,
  User
} from 'lucide-react-native';
import ReactNative from 'react-native';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { headerWithSafeArea, contentWithSafeArea } = useSafeArea();
  const { unreadCount } = useNotifications();
  const {
    income,
    goals,
    insights,
    isLoadingInsights,
    refreshAll
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [chartRange, setChartRange] = useState<'6M' | '12M'>('6M');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [addIncomeVisible, setAddIncomeVisible] = useState(false);
  const barMinHeight = 4;

  const ResponsiveBarChart = ({ labels, values, maxBars = 12, themeColors }: { labels: string[]; values: number[]; maxBars?: number; themeColors: any }) => {
    const maxValue = Math.max(1, ...values);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingVertical: 8 }}>
        {values.map((val, idx) => {
          const heightPercent = (val / maxValue) || 0;
          return (
            <View key={`${labels[idx]}-${idx}`} style={{ alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  width: '100%',
                  height: 160,
                  justifyContent: 'flex-end',
                }}
              >
                <View
                  style={{
                    height: Math.max(barMinHeight, heightPercent * 150),
                    backgroundColor: themeColors.primary[500],
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    borderBottomLeftRadius: 10,
                    borderBottomRightRadius: 10,
                    ...{ shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
                  }}
                />
              </View>
              <Text style={{ marginTop: 6, color: theme.colors.text.tertiary, fontSize: 12 }} numberOfLines={1}>
                {labels[idx]}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  // Calculate stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyIncome = (income || []).filter(item => {
    const date = new Date(item.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).reduce((sum, item) => sum + item.amount, 0);

  const totalGoals = (goals || []).filter(goal => goal.status === 'active').length;
  const completedGoals = (goals || []).filter(goal => goal.status === 'completed').length;

  // Generate chart data for last 6 months
  const generateChartData = () => {
    const months = [];
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();

      months.push(date.toLocaleDateString('en', { month: 'short' }));

      const monthIncome = (income || []).filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === month && itemDate.getFullYear() === year;
      }).reduce((sum, item) => sum + item.amount, 0);

      data.push(monthIncome);
    }

    return { labels: months, data };
  };

  const chartData = generateChartData();
  const visibleLabels = chartRange === '6M' ? chartData.labels.slice(-6) : chartData.labels;
  const visibleData = chartRange === '6M' ? chartData.data.slice(-6) : chartData.data;
  const activeGoals = (goals || []).filter(goal => goal.status === 'active').slice(0, 3);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={[theme.colors.primary[500], theme.colors.primary[600]]}
        style={[styles.headerGradient, headerWithSafeArea]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/notifications')}>
              <View style={styles.notificationContainer}>
                <Bell size={22} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/profile')}>
              <User size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/settings')}>
              <Settings size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, contentWithSafeArea]}
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
        {/* Enhanced Balance Card */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            style={styles.balanceCardGradient}
          >
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Total Balance This Month</Text>
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setBalanceVisible(!balanceVisible)}
              >
                {balanceVisible ? (
                  <Eye size={20} color={theme.colors.text.secondary} />
                ) : (
                  <EyeOff size={20} color={theme.colors.text.secondary} />
                )}
              </TouchableOpacity>
            </View>
            <Text style={[styles.balanceAmount, { color: theme.colors.primary[600] }]}>
              {balanceVisible ? `$${monthlyIncome.toLocaleString()}` : '••••••••'}
            </Text>
            <Text style={styles.balanceSubtext}>
              {balanceVisible && monthlyIncome > 0
                ? `+${((monthlyIncome / (monthlyIncome * 0.9) - 1) * 100).toFixed(1)}% from last month`
                : 'Add income to see your progress'
              }
            </Text>
          </LinearGradient>
        </View>

        {/* Enhanced Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.success[50], borderColor: theme.colors.success[200] }]}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.success[500] }]}>
              <Target size={20} color="#FFFFFF" />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: theme.colors.success[700] }]}>{totalGoals}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.success[600] }]}>Active Goals</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.warning[50], borderColor: theme.colors.warning[200] }]}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.warning[500] }]}>
              <TrendingUp size={20} color="#FFFFFF" />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: theme.colors.warning[700] }]}>{completedGoals}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.warning[600] }]}>Completed</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.primary[50], borderColor: theme.colors.primary[200] }]}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.primary[500] }]}>
              <PiggyBank size={20} color="#FFFFFF" />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: theme.colors.primary[700] }]}>$0</Text>
              <Text style={[styles.statLabel, { color: theme.colors.primary[600] }]}>Saved</Text>
            </View>
          </View>
        </View>

        {/* Enhanced Income Trend Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Income Overview</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setChartRange('6M')}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: chartRange === '6M' ? theme.colors.primary[500] : theme.colors.background.secondary,
                  borderWidth: 1,
                  borderColor: chartRange === '6M' ? theme.colors.primary[500] : theme.colors.border.light,
                }}
              >
                <Text style={{ color: chartRange === '6M' ? '#FFFFFF' : theme.colors.text.secondary, fontWeight: '600' }}>6M</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setChartRange('12M')}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: chartRange === '12M' ? theme.colors.primary[500] : theme.colors.background.secondary,
                  borderWidth: 1,
                  borderColor: chartRange === '12M' ? theme.colors.primary[500] : theme.colors.border.light,
                }}
              >
                <Text style={{ color: chartRange === '12M' ? '#FFFFFF' : theme.colors.text.secondary, fontWeight: '600' }}>12M</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.chartContainer, { backgroundColor: theme.colors.background.primary, borderColor: theme.colors.border.light }]}> 
            <ResponsiveBarChart labels={visibleLabels} values={visibleData} maxBars={12} themeColors={theme.colors} />
          </View>
        </View>

        {/* Enhanced Goals Progress */}
        {activeGoals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Goal Progress</Text>
              <TouchableOpacity style={styles.sectionAction}>
                <Text style={[styles.sectionActionText, { color: theme.colors.primary[500] }]}>View All</Text>
              </TouchableOpacity>
            </View>
            {activeGoals.map(goal => (
              <View key={goal._id} style={[styles.goalCard, { backgroundColor: theme.colors.background.primary, borderColor: theme.colors.border.light }]}>
                <View style={styles.goalHeader}>
                  <Text style={[styles.goalTitle, { color: theme.colors.text.primary }]}>{goal.title}</Text>
                  <Text style={[styles.goalAmount, { color: theme.colors.text.secondary }]}>
                    ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
                  </Text>
                </View>
                <ProgressBar
                  current={goal.currentAmount}
                  target={goal.targetAmount}
                  showPercentage={true}
                />
              </View>
            ))}
          </View>
        )}

        {/* Enhanced AI Insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>AI Insights</Text>
            <TouchableOpacity style={styles.sectionAction}>
              <Text style={[styles.sectionActionText, { color: theme.colors.primary[500] }]}>View All</Text>
            </TouchableOpacity>
          </View>
          {isLoadingInsights ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner />
            </View>
          ) : (insights || []).length > 0 ? (
            (insights || []).slice(0, 2).map(insight => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onPress={() => {/* Navigate to insight details */}}
              />
            ))
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: theme.colors.background.primary, borderColor: theme.colors.border.light }]}>
              <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                No insights available yet. Add some income data to get started!
              </Text>
            </View>
          )}
        </View>

        {/* Enhanced Quick Actions */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.primary[50], borderColor: theme.colors.primary[200] }]} onPress={() => setAddIncomeVisible(true)}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary[500] }]}>
                <Plus size={18} color="#FFFFFF" />
              </View>
              <Text style={[styles.actionText, { color: theme.colors.primary[700] }]}>Add Income</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.success[50], borderColor: theme.colors.success[200] }]}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.success[500] }]}>
                <PiggyBank size={18} color="#FFFFFF" />
              </View>
              <Text style={[styles.actionText, { color: theme.colors.success[700] }]}>Add Savings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.warning[50], borderColor: theme.colors.warning[200] }]}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.warning[500] }]}>
                <Target size={18} color="#FFFFFF" />
              </View>
              <Text style={[styles.actionText, { color: theme.colors.warning[700] }]}>New Goal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.secondary[50], borderColor: theme.colors.secondary[200] }]}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.secondary[500] }]}>
                <TrendingUp size={18} color="#FFFFFF" />
              </View>
              <Text style={[styles.actionText, { color: theme.colors.secondary[700] }]}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <AddIncomeSheet visible={addIncomeVisible} onClose={() => setAddIncomeVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  balanceCard: {
    marginTop: -16,
    marginHorizontal: 0,
    marginBottom: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceCardGradient: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  balanceSubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 0,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 0,
    marginBottom: 32,
  },
  lastSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionAction: {
    padding: 4,
  },
  sectionActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'visible',
  },
  chart: {
    marginVertical: 8,
  },
  goalCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  goalAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});
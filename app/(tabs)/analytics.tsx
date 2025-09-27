import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeArea } from '@/constants/SafeArea';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiService } from '@/services/api';
import { IncomePattern } from '@/types/api';
import { ChartBar as BarChart3, TrendingUp, Calendar, Filter, Brain, Info, Activity, DollarSign, PieChart as PieChartIcon } from 'lucide-react-native';

const screenWidth = Dimensions.get('window').width;

type TimePeriod = 'week' | 'month' | '3months' | '6months' | 'year';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactElement;
  colors: string[];
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, colors, delay }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.statCard,
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statCardGradient}
      >
        <View style={styles.statCardContent}>
          <View style={styles.statCardHeader}>
            <View style={styles.statIconContainer}>
              {icon}
            </View>
            <Text style={styles.statTitle}>{title}</Text>
          </View>
          <Text style={styles.statValue}>{value}</Text>
          {subtitle && (
            <Text style={styles.statSubtitle}>{subtitle}</Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

interface ChartCardProps {
  title: string;
  icon: React.ReactElement;
  children: React.ReactNode;
  delay: number;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, icon, children, delay }) => {
  const { theme } = useTheme();

  return (
    <View>

      <View style={[styles.chartContainer, { backgroundColor: theme.colors.background.secondary }]}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            {icon}
            <Text style={[styles.chartTitle, { color: theme.colors.text.primary }]}>
              {title}
            </Text>
          </View>
        </View>
        {children}
      </View>
    </View>
  );
};

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const { headerWithSafeArea, contentWithSafeArea } = useSafeArea();
  const {
    income,
    categories,
    refreshAll
  } = useApp();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const [patterns, setPatterns] = useState<IncomePattern[]>([]);
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');

  useEffect(() => {
    loadPatternAnalysis();
  }, [selectedPeriod]);

  const loadPatternAnalysis = async () => {
    try {
      setLoadingPatterns(true);
      const patternData = await apiService.analyzePatterns();
      setPatterns(patternData);
      
      // Generate AI insight based on patterns
      if (patternData.length > 0) {
        const trend = patternData[patternData.length - 1]?.trend;
        const latestAmount = patternData[patternData.length - 1]?.amount || 0;
        
        let insight = '';
        if (trend === 'up') {
          insight = `📈 Your income is trending upward! You've earned $${latestAmount.toLocaleString()} this period, showing positive growth.`;
        } else if (trend === 'down') {
          insight = `📉 Your income has decreased this period. Consider reviewing your income sources and exploring new opportunities.`;
        } else {
          insight = `📊 Your income remains stable at $${latestAmount.toLocaleString()}. This consistency provides a solid foundation for financial planning.`;
        }
        
        setAiInsight(insight);
      }
    } catch (error) {
      console.error('Failed to load pattern analysis:', error);
    } finally {
      setLoadingPatterns(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    await loadPatternAnalysis();
    setRefreshing(false);
  };

  const filterDataByPeriod = (data: any[], period: TimePeriod) => {
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return data.filter(item => new Date(item.date) >= startDate);
  };

  const generateIncomeChart = () => {
    const filteredIncome = filterDataByPeriod(income, selectedPeriod);
    
    // Group by time periods
    const periods: { [key: string]: number } = {};
    const periodLabels: string[] = [];
    
    filteredIncome.forEach(item => {
      const date = new Date(item.date);
      let key = '';
      
      if (selectedPeriod === 'week') {
        key = date.toLocaleDateString('en', { weekday: 'short' });
      } else if (selectedPeriod === 'month') {
        key = date.getDate().toString();
      } else {
        key = date.toLocaleDateString('en', { month: 'short' });
      }
      
      if (!periods[key]) {
        periods[key] = 0;
        periodLabels.push(key);
      }
      periods[key] += item.amount;
    });
    
    const sortedLabels = periodLabels.sort();
    const data = sortedLabels.map(label => periods[label] || 0);
    
    return {
      labels: sortedLabels.slice(-7), // Show last 7 periods
      datasets: [{
        data: data.slice(-7),
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const generateCategoryChart = () => {
    const filteredIncome = filterDataByPeriod(income, selectedPeriod);
    const categoryTotals: { [key: string]: number } = {};
    
    filteredIncome.forEach(item => {
      const categoryName = item.categoryId.name;
      if (!categoryTotals[categoryName]) {
        categoryTotals[categoryName] = 0;
      }
      categoryTotals[categoryName] += item.amount;
    });
    
    const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
    
    return Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6) // Top 6 categories
      .map(([name, amount], index) => ({
        name: name.length > 10 ? name.substring(0, 10) + '...' : name,
        amount,
        color: colors[index % colors.length],
        legendFontColor: '#374151',
        legendFontSize: 12,
      }));
  };

  const getPeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last Month';
      case '3months': return 'Last 3 Months';
      case '6months': return 'Last 6 Months';
      case 'year': return 'Last Year';
      default: return 'Last Month';
    }
  };

  const incomeChartData = generateIncomeChart();
  const categoryChartData = generateCategoryChart();
  const filteredIncome = filterDataByPeriod(income, selectedPeriod);
  const totalIncome = filteredIncome.reduce((sum, item) => sum + item.amount, 0);
  const avgIncome = filteredIncome.length > 0 ? totalIncome / filteredIncome.length : 0;
  const entriesCount = filteredIncome.length;
  const topCategory = categoryChartData.length > 0 ? categoryChartData[0] : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, headerWithSafeArea, { backgroundColor: theme.colors.background.primary }]}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Analytics</Text>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.light }]}>
          <Filter size={20} color={theme.colors.primary[500]} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
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

          {/* Time Period Selector */}
          <View style={styles.periodSelector}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.periodButtons}
            >
              {(['week', 'month', '3months', '6months', 'year'] as TimePeriod[]).map(period => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    {
                      backgroundColor: theme.colors.background.secondary,
                      borderColor: theme.colors.border.light,
                    },
                    selectedPeriod === period && {
                      backgroundColor: theme.colors.primary[500],
                      borderColor: theme.colors.primary[500],
                    }
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    { color: theme.colors.text.secondary },
                    selectedPeriod === period && { color: '#FFFFFF' }
                  ]}>
                    {getPeriodLabel(period)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard
                title="Total Income"
                value={`$${totalIncome.toLocaleString()}`}
                subtitle={getPeriodLabel(selectedPeriod)}
                icon={<DollarSign size={24} color="#FFFFFF" />}
                colors={[theme.colors.primary[500], theme.colors.primary[600]]}
                delay={0}
              />
              <StatCard
                title="Entries"
                value={entriesCount.toString()}
                subtitle="Total Records"
                icon={<Activity size={24} color="#FFFFFF" />}
                colors={[theme.colors.success[500], theme.colors.success[600]]}
                delay={100}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                title="Average"
                value={`$${Math.round(avgIncome).toLocaleString()}`}
                subtitle="Per Entry"
                icon={<TrendingUp size={24} color="#FFFFFF" />}
                colors={[theme.colors.warning[500], theme.colors.warning[600]]}
                delay={200}
              />
              <StatCard
                title="Top Category"
                value={topCategory?.name || 'N/A'}
                subtitle={topCategory ? `$${topCategory.amount.toLocaleString()}` : 'No data'}
                icon={<PieChartIcon size={24} color="#FFFFFF" />}
                colors={[theme.colors.secondary[500], theme.colors.secondary[600]]}
                delay={300}
              />
            </View>
          </View>

          {/* AI Pattern Analysis */}
          {aiInsight && (
            <View style={styles.section}>
              <ChartCard
                title="AI Insights"
                icon={<Brain size={20} color={theme.colors.primary[500]} />}
                delay={400}
              >
                <View style={[styles.insightCard, {
                  backgroundColor: theme.colors.primary[50],
                  borderColor: theme.colors.primary[200],
                }]}>
                  <Text style={[styles.insightText, { color: theme.colors.primary[700] }]}>
                    {aiInsight}
                  </Text>
                </View>
              </ChartCard>
            </View>
          )}

          {/* Income Trend Chart */}
          <View style={styles.section}>
            <ChartCard
              title="Income Trend"
              icon={<TrendingUp size={20} color={theme.colors.primary[500]} />}
              delay={500}
            >
              {incomeChartData.labels.length > 0 ? (
                <LineChart
                  data={incomeChartData}
                  width={screenWidth - 64}
                  height={220}
                  yAxisLabel="$"
                  yAxisSuffix=""
                  yAxisInterval={1}
                  chartConfig={{
                    backgroundColor: theme.colors.background.secondary,
                    backgroundGradientFrom: theme.colors.background.secondary,
                    backgroundGradientTo: theme.colors.background.secondary,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                    labelColor: (opacity = 1) => theme.colors.text.tertiary,
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: theme.colors.primary[500],
                    },
                  }}
                  bezier
                  style={styles.chart}
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <Info size={32} color={theme.colors.text.tertiary} />
                  <Text style={[styles.noDataText, { color: theme.colors.text.secondary }]}>
                    No data available for the selected period
                  </Text>
                </View>
              )}
            </ChartCard>
          </View>

          {/* Category Breakdown */}
          {categoryChartData.length > 0 && (
            <View style={styles.section}>
              <ChartCard
                title="Category Breakdown"
                icon={<PieChartIcon size={20} color={theme.colors.primary[500]} />}
                delay={600}
              >
                <PieChart
                  data={categoryChartData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={{
                    backgroundColor: theme.colors.background.secondary,
                    backgroundGradientFrom: theme.colors.background.secondary,
                    backgroundGradientTo: theme.colors.background.secondary,
                    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                  }}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  center={[10, 50]}
                  absolute
                />
              </ChartCard>
            </View>
          )}

          {/* Category Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BarChart3 size={20} color={theme.colors.primary[500]} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Category Details</Text>
            </View>
            {categoryChartData.length > 0 ? (
              categoryChartData.map((category, index) => (
                <View
                  key={index}
                >
                  <View style={[styles.categoryRow, { backgroundColor: theme.colors.background.secondary }]}>
                    <View style={styles.categoryInfo}>
                      <View
                        style={[
                          styles.categoryColorDot,
                          { backgroundColor: category.color }
                        ]}
                      />
                      <Text style={[styles.categoryName, { color: theme.colors.text.primary }]}>
                        {category.name}
                      </Text>
                    </View>

                    <View style={styles.categoryAmount}>
                      <Text style={[styles.categoryValue, { color: theme.colors.text.primary }]}>
                        ${category.amount.toLocaleString()}
                      </Text>
                      <Text style={[styles.categoryPercentage, { color: theme.colors.text.secondary }]}>
                        {Math.round((category.amount / totalIncome) * 100)}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={[styles.noDataContainer, { backgroundColor: theme.colors.background.secondary }]}>
                <BarChart3 size={32} color={theme.colors.text.tertiary} />
                <Text style={[styles.noDataText, { color: theme.colors.text.secondary }]}>
                  No category data available for the selected period
                </Text>
              </View>
            )}
          </View>

          {/* Income Patterns */}
          {loadingPatterns ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Brain size={20} color={theme.colors.primary[500]} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Income Patterns</Text>
              </View>
              <LoadingSpinner />
            </View>
          ) : patterns.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Brain size={20} color={theme.colors.primary[500]} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Income Patterns</Text>
              </View>
              {patterns.slice(0, 3).map((pattern, index) => (
                <View
                  key={index}
                >
                  <View style={[styles.patternCard, { backgroundColor: theme.colors.background.secondary }]}>
                    <View style={styles.patternHeader}>
                      <Text style={[styles.patternPeriod, { color: theme.colors.text.primary }]}>
                        {pattern.period}
                      </Text>
                      <View style={[
                        styles.trendBadge,
                        {
                          backgroundColor: pattern.trend === 'up' ? theme.colors.success[100] :
                                         pattern.trend === 'down' ? theme.colors.error[100] :
                                         theme.colors.background.tertiary
                        }
                      ]}>
                        <Text style={[
                          styles.trendText,
                          {
                            color: pattern.trend === 'up' ? theme.colors.success[700] :
                                   pattern.trend === 'down' ? theme.colors.error[700] :
                                   theme.colors.text.secondary
                          }
                        ]}>
                          {pattern.trend.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.patternAmount, { color: theme.colors.text.primary }]}>
                      ${pattern.amount.toLocaleString()}
                    </Text>

                    {pattern.prediction && (
                      <Text style={[styles.patternPrediction, { color: theme.colors.primary[600] }]}>
                        Predicted: ${pattern.prediction.toLocaleString()}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  filterButton: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  periodSelector: {
    paddingHorizontal: 0,
    marginBottom: 24,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 0,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statCardGradient: {
    padding: 16,
    minHeight: 100,
  },
  statCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 6,
    marginRight: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
  },
  statSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  section: {
    paddingHorizontal: 0,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  insightCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chartContainer: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryPercentage: {
    fontSize: 12,
    marginTop: 2,
  },
  patternCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patternPeriod: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  patternAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  patternPrediction: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
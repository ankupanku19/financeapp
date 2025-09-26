import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeArea } from '@/constants/SafeArea';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AddIncomeSheet } from '@/components/AddIncomeSheet';
import { AnimatedIncomeStats } from '@/components/AnimatedIncomeStats';
import { Income } from '@/types/api';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Tag,
  MoreVertical,
  TrendingUp,
  ArrowUp,
  Wallet,
  PieChart,
  Activity
} from 'lucide-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function IncomeScreen() {
  const {
    income,
    categories,
    isLoadingIncome,
    refreshIncome,
    deleteIncome
  } = useApp();
  const { theme } = useTheme();
  const { headerWithSafeArea, contentWithSafeArea } = useSafeArea();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [addIncomeVisible, setAddIncomeVisible] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

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
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshIncome();
    setRefreshing(false);
  };

  const filteredIncome = income.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.categoryId._id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteIncome = (item: Income) => {
    Alert.alert(
      'Delete Income',
      `Are you sure you want to delete "${item.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteIncome(item._id)
        }
      ]
    );
  };

  const totalAmount = filteredIncome.reduce((sum, item) => sum + item.amount, 0);
  const thisMonthAmount = filteredIncome
    .filter(item => {
      const date = new Date(item.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() &&
             date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, item) => sum + item.amount, 0);

  const averageIncome = filteredIncome.length > 0 ? totalAmount / filteredIncome.length : 0;
  const transactionCount = filteredIncome.length;


  const TransactionCard = ({ item, index }: { item: Income; index: number }) => {
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

    return (
      <Animated.View
        style={[
          styles.transactionCard,
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
          style={styles.transactionCardContent}
          activeOpacity={0.9}
        >
          <View style={styles.transactionHeader}>
            <View style={styles.transactionInfo}>
              <View style={styles.categoryIndicator}>
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: item.categoryId.color || theme.colors.primary[500] }
                  ]}
                />
                <Text style={[styles.categoryName, { color: theme.colors.text.secondary }]}>
                  {item.categoryId.name}
                </Text>
              </View>
              <Text style={[styles.transactionTitle, { color: theme.colors.text.primary }]}>
                {item.description}
              </Text>
            </View>
            <View style={styles.transactionActions}>
              <Text style={[styles.transactionAmount, { color: theme.colors.success[600] }]}>
                +${item.amount.toLocaleString()}
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteIncome(item)}
              >
                <MoreVertical size={16} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.transactionFooter}>
            <View style={styles.transactionMeta}>
              <Calendar size={12} color={theme.colors.text.secondary} />
              <Text style={[styles.metaText, { color: theme.colors.text.secondary }]}>
                {new Date(item.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: new Date(item.date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                })}
              </Text>
            </View>

            {item.tags.length > 0 && (
              <View style={styles.transactionTags}>
                {item.tags.slice(0, 2).map((tag, tagIndex) => (
                  <View
                    key={tagIndex}
                    style={[styles.tag, { backgroundColor: `${theme.colors.primary[500]}15` }]}
                  >
                    <Text style={[styles.tagText, { color: theme.colors.primary[600] }]}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          headerWithSafeArea,
          {
            backgroundColor: theme.colors.background.primary,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitle}>
            <Wallet size={28} color={theme.colors.primary[500]} />
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              Income Dashboard
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary[500] }]}
            onPress={() => setAddIncomeVisible(true)}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          {filteredIncome.length} transactions • ${totalAmount.toLocaleString()} total
        </Text>
      </Animated.View>

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
        {/* Animated Income Stats */}
        <Animated.View
          style={[
            styles.statsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <AnimatedIncomeStats
            stats={[
              {
                title: "This Month",
                value: `$${thisMonthAmount.toLocaleString()}`,
                subtitle: "Current period",
                icon: <TrendingUp size={20} color="#FFFFFF" />,
                gradientColors: [theme.colors.primary[400], theme.colors.primary[600]],
              },
              {
                title: "Total Income",
                value: `$${totalAmount.toLocaleString()}`,
                subtitle: "All time",
                icon: <DollarSign size={20} color="#FFFFFF" />,
                gradientColors: [theme.colors.success[400], theme.colors.success[600]],
              },
              {
                title: "Average",
                value: `$${Math.round(averageIncome).toLocaleString()}`,
                subtitle: "Per transaction",
                icon: <Activity size={20} color="#FFFFFF" />,
                gradientColors: [theme.colors.warning[400], theme.colors.warning[600]],
              },
              {
                title: "Transactions",
                value: transactionCount.toString(),
                subtitle: "Total count",
                icon: <PieChart size={20} color="#FFFFFF" />,
                gradientColors: [theme.colors.accent[400], theme.colors.accent[600]],
              },
            ]}
            autoRotate={true}
            rotateInterval={4000}
          />
        </Animated.View>


        {/* Search and Filters */}
        <Animated.View
          style={[
            styles.controlsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.searchContainer}>
            <View style={[styles.searchBox, { backgroundColor: theme.colors.background.primary }]}>
              <Search size={18} color={theme.colors.text.secondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text.primary }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search transactions..."
                placeholderTextColor={theme.colors.text.secondary}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={[styles.clearButton, { color: theme.colors.primary[500] }]}>
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: theme.colors.background.primary }]}
            >
              <Filter size={18} color={theme.colors.primary[500]} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && [styles.activeCategoryChip, { backgroundColor: theme.colors.primary[500] }],
                { backgroundColor: theme.colors.background.primary }
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[
                styles.categoryChipText,
                !selectedCategory && { color: '#FFFFFF' },
                { color: theme.colors.text.secondary }
              ]}>
                All
              </Text>
            </TouchableOpacity>

            {categories.map(category => (
              <TouchableOpacity
                key={category._id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category._id && [styles.activeCategoryChip, { backgroundColor: theme.colors.primary[500] }],
                  { backgroundColor: theme.colors.background.primary }
                ]}
                onPress={() => setSelectedCategory(category._id)}
              >
                <View
                  style={[
                    styles.categoryChipDot,
                    { backgroundColor: category.color }
                  ]}
                />
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category._id && { color: '#FFFFFF' },
                  { color: theme.colors.text.secondary }
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Transactions List */}
        <Animated.View
          style={[
            styles.transactionsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Recent Transactions
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
              {filteredIncome.length} items
            </Text>
          </View>

          {isLoadingIncome ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="large" />
            </View>
          ) : filteredIncome.length > 0 ? (
            <View style={styles.transactionsList}>
              {filteredIncome.map((item, index) => (
                <TransactionCard key={item._id} item={item} index={index} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: `${theme.colors.text.secondary}15` }]}>
                <DollarSign size={32} color={theme.colors.text.secondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                {searchQuery ? 'No matching transactions' : 'No income recorded yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Start by adding your first income transaction'
                }
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: theme.colors.primary[500] }]}
                  onPress={() => setAddIncomeVisible(true)}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.emptyButtonText}>Add Income</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>
      <AddIncomeSheet visible={addIncomeVisible} onClose={() => setAddIncomeVisible(false)} />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  statsSection: {
    marginBottom: 24,
  },
  controlsSection: {
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    marginHorizontal: -20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  activeCategoryChip: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  transactionsSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionCardContent: {
    padding: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  transactionActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  actionButton: {
    padding: 4,
    borderRadius: 8,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  transactionTags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
import React, { useState, useRef, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Bell, 
  Check, 
  Clock,
  Target,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Settings,
  Zap,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeArea } from '@/constants/SafeArea';
import { apiService } from '@/services/api';
import { NotificationPreferences } from '@/components/NotificationPreferences';

const { width: screenWidth } = Dimensions.get('window');

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  channels: {
    inApp: {
      sent: boolean;
      read: boolean;
      readAt?: string;
    };
  };
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const { headerWithSafeArea } = useSafeArea();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    loadNotifications();
    
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

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications(1, 50);
      if (response.notifications) {
        setNotifications(response.notifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === notificationId
            ? {
                ...notification,
                channels: {
                  ...notification.channels,
                  inApp: {
                    ...notification.channels.inApp,
                    read: true,
                    readAt: new Date().toISOString(),
                  },
                },
              }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          channels: {
            ...notification.channels,
            inApp: {
              ...notification.channels.inApp,
              read: true,
              readAt: new Date().toISOString(),
            },
          },
        }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'goal_achieved':
        return <Target size={20} color={theme.colors.primary[500]} />;
      case 'goal_milestone':
        return <Zap size={20} color={theme.colors.primary[500]} />;
      case 'income_added':
        return <DollarSign size={20} color={theme.colors.primary[500]} />;
      case 'savings_milestone':
        return <CheckCircle size={20} color={theme.colors.primary[500]} />;
      case 'security_alert':
        return <AlertTriangle size={20} color="#EF4444" />;
      case 'system':
        return <Settings size={20} color={theme.colors.primary[500]} />;
      default:
        return <Bell size={20} color={theme.colors.primary[500]} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const unreadCount = notifications.filter(n => !n.channels.inApp.read).length;

  const NotificationCard = ({ 
    children, 
    index = 0 
  }: { 
    children: React.ReactNode; 
    index?: number;
  }) => {
    const cardAnimValue = useRef(new Animated.Value(0)).current;

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

    return (
      <Animated.View
        style={[
          styles.notificationCard,
          { backgroundColor: theme.colors.background.primary },
          {
            opacity: cardAnimValue,
            transform: [
              {
                translateY: cardAnimValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    );
  };

  const NotificationRow = ({ 
    notification,
    onPress
  }: { 
    notification: Notification;
    onPress: () => void;
  }) => (
    <TouchableOpacity 
      style={styles.notificationRow} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.notificationLeft}>
        <View style={[styles.notificationIcon, { backgroundColor: theme.colors.primary[100] }]}>
          {getNotificationIcon(notification.type)}
        </View>
        <View style={styles.notificationText}>
          <Text style={[
            styles.notificationTitle, 
            { 
              color: theme.colors.text.primary,
              fontWeight: notification.channels.inApp.read ? '500' : '700',
            }
          ]}>
            {notification.title}
          </Text>
          <Text style={[styles.notificationMessage, { color: theme.colors.text.secondary }]}>
            {notification.message}
          </Text>
          <View style={styles.notificationTime}>
            <Clock size={12} color={theme.colors.text.tertiary} />
            <Text style={[styles.timeText, { color: theme.colors.text.tertiary }]}>
              {formatDate(notification.createdAt)}
            </Text>
          </View>
        </View>
      </View>
      {!notification.channels.inApp.read && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary[500], theme.colors.primary[600]]}
        style={[styles.header, headerWithSafeArea]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => setShowNotificationPreferences(true)} 
              style={styles.headerButton}
            >
              <Settings size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerIcon}>
              <Bell size={24} color="rgba(255,255,255,0.6)" />
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[500]}
          />
        }
      >
        {notifications.length === 0 ? (
          <Animated.View
            style={[
              styles.emptyState,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.emptyIconContainer}>
              <Bell size={48} color={theme.colors.text.secondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
              No notifications yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
              You'll see your notifications here when they arrive
            </Text>
          </Animated.View>
        ) : (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Bell size={18} color={theme.colors.text.secondary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Recent Notifications
              </Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                  <Check size={16} color={theme.colors.primary[500]} />
                </TouchableOpacity>
              )}
            </View>
            
            {notifications.map((notification, index) => (
              <NotificationCard key={notification._id} index={index}>
                <NotificationRow
                  notification={notification}
                  onPress={() => !notification.channels.inApp.read && markAsRead(notification._id)}
                />
              </NotificationCard>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* Notification Preferences Modal */}
      <NotificationPreferences
        visible={showNotificationPreferences}
        onClose={() => setShowNotificationPreferences(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  headerIcon: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  markAllButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  notificationCard: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 120,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
  },
});
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';
import { Bell, Check, CheckCheck, Settings, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';

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

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  visible,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      loadNotifications();
      loadUnreadCount();
      
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const loadNotifications = async (pageNum = 1, refresh = false) => {
    try {
      setLoading(true);
      
      const response = await apiService.get(`/notifications?page=${pageNum}&limit=20`);
      
      if (response.success) {
        const newNotifications = response.data.notifications;
        
        if (refresh || pageNum === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }
        
        setHasMore(newNotifications.length === 20);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await apiService.get('/notifications/unread-count');
      if (response.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiService.put(`/notifications/${notificationId}/read`);
      
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
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.put('/notifications/mark-all-read');
      
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
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications(1, true);
    loadUnreadCount();
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadNotifications(page + 1);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'goal_achieved':
        return '🎉';
      case 'goal_reminder':
        return '🎯';
      case 'expense_alert':
        return '💰';
      case 'security_alert':
        return '🔒';
      case 'bill_reminder':
        return '📅';
      case 'savings_milestone':
        return '💎';
      case 'income_added':
        return '💵';
      default:
        return '🔔';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#EF4444';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#6366F1';
      case 'low':
        return '#6B7280';
      default:
        return '#6366F1';
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

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Bell size={24} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.markAllButton}
                onPress={markAllAsRead}
              >
                <CheckCheck size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications List */}
        <ScrollView
          style={styles.notificationsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onScrollEndDrag={loadMore}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No notifications</Text>
              <Text style={styles.emptyStateText}>
                You're all caught up! New notifications will appear here.
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification._id}
                style={[
                  styles.notificationItem,
                  !notification.channels.inApp.read && styles.unreadItem,
                ]}
                onPress={() => markAsRead(notification._id)}
              >
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationIcon}>
                      {getNotificationIcon(notification.type)}
                    </Text>
                    <View style={styles.notificationInfo}>
                      <Text style={styles.notificationTitle}>
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatDate(notification.createdAt)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.priorityIndicator,
                        { backgroundColor: getPriorityColor(notification.priority) },
                      ]}
                    />
                  </View>
                  
                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                  
                  {!notification.channels.inApp.read && (
                    <View style={styles.unreadIndicator} />
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
          
          {loading && (
            <View style={styles.loadingMore}>
              <Text style={styles.loadingText}>Loading more...</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#6366F1',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButton: {
    padding: 8,
    marginRight: 8,
  },
  closeButton: {
    padding: 8,
  },
  notificationsList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  unreadItem: {
    backgroundColor: '#F8FAFC',
  },
  notificationContent: {
    position: 'relative',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginLeft: 36,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 0,
    left: -20,
    width: 4,
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

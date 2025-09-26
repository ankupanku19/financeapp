import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiService } from '@/services/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationData {
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

interface NotificationPreferences {
  channels: {
    email: {
      enabled: boolean;
      frequency: string;
      types: Record<string, boolean>;
    };
    push: {
      enabled: boolean;
      frequency: string;
      types: Record<string, boolean>;
    };
    inApp: {
      enabled: boolean;
      frequency: string;
      types: Record<string, boolean>;
    };
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const appStateListener = useRef<any>();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        registerDeviceToken(token);
      }
    });

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // Listen for app state changes
    appStateListener.current = AppState.addEventListener('change', handleAppStateChange);

    // Load initial data
    loadNotifications();
    loadUnreadCount();
    loadPreferences();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      if (appStateListener.current) {
        appStateListener.current.remove();
      }
    };
  }, []);

  const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    let token: string | null = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Constants.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  };

  const registerDeviceToken = async (token: string) => {
    try {
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      await apiService.registerDeviceToken(token, platform);
    } catch (error) {
      console.error('Error registering device token:', error);
    }
  };

  const handleNotificationReceived = (notification: Notifications.Notification) => {
    console.log('Notification received:', notification);
    
    // Update unread count
    setUnreadCount(prev => prev + 1);
    
    // Reload notifications if app is in foreground
    if (AppState.currentState === 'active') {
      loadNotifications();
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    console.log('Notification response:', response);
    
    const data = response.notification.request.content.data;
    
    // Handle navigation based on notification type
    if (data.screen) {
      // Navigate to specific screen
      // This would be handled by your navigation system
      console.log('Navigate to:', data.screen);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App came to foreground, refresh notifications
      loadNotifications();
      loadUnreadCount();
    }
  };

  const loadNotifications = async (page = 1, refresh = false) => {
    try {
      setLoading(true);
      
      const response = await apiService.getNotifications(page, 20);
      
      if (response.notifications) {
        const newNotifications = response.notifications;
        
        if (refresh || page === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await apiService.getUnreadCount();
      setUnreadCount(response.count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await apiService.getNotificationPreferences();
      setPreferences(response);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
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
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
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
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      const response = await apiService.updateNotificationPreferences(newPreferences);
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  const sendTestNotification = async (type: string, title: string, message: string) => {
    try {
      await apiService.sendTestNotification(type, title, message);
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  };

  const scheduleLocalNotification = async (
    title: string,
    body: string,
    data: any = {},
    trigger?: Notifications.NotificationTriggerInput
  ) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: trigger || null,
      });
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  };

  const cancelAllScheduledNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling scheduled notifications:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    preferences,
    loading,
    expoPushToken,
    loadNotifications,
    loadUnreadCount,
    loadPreferences,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    sendTestNotification,
    scheduleLocalNotification,
    cancelAllScheduledNotifications,
  };
};

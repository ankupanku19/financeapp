import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  Platform,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeArea } from '../../constants/SafeArea';

const { width: screenWidth } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onDismiss?: (id: string) => void;
  action?: {
    label: string;
    onPress: () => void;
  };
  persistent?: boolean;
  hapticFeedback?: boolean;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 4000,
  onDismiss,
  action,
  persistent = false,
  hapticFeedback = true,
}) => {
  const { theme } = useTheme();
  const { insets } = useSafeArea();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Haptic feedback
    if (hapticFeedback) {
      switch (type) {
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress animation
    if (!persistent) {
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      }).start();

      // Auto dismiss
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.(id);
    });
  };

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: theme.colors.success[50],
          borderColor: theme.colors.success[200],
          iconColor: theme.colors.success[500],
          titleColor: theme.colors.success[800],
          messageColor: theme.colors.success[600],
        };
      case 'error':
        return {
          backgroundColor: theme.colors.error[50],
          borderColor: theme.colors.error[200],
          iconColor: theme.colors.error[500],
          titleColor: theme.colors.error[800],
          messageColor: theme.colors.error[600],
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.warning[50],
          borderColor: theme.colors.warning[200],
          iconColor: theme.colors.warning[500],
          titleColor: theme.colors.warning[800],
          messageColor: theme.colors.warning[600],
        };
      case 'info':
        return {
          backgroundColor: theme.colors.primary[50],
          borderColor: theme.colors.primary[200],
          iconColor: theme.colors.primary[500],
          titleColor: theme.colors.primary[800],
          messageColor: theme.colors.primary[600],
        };
      default:
        return {
          backgroundColor: theme.colors.background.primary,
          borderColor: theme.colors.border.light,
          iconColor: theme.colors.text.secondary,
          titleColor: theme.colors.text.primary,
          messageColor: theme.colors.text.secondary,
        };
    }
  };

  const getIcon = () => {
    const iconSize = 20;
    const styles = getToastStyles();

    switch (type) {
      case 'success':
        return <CheckCircle size={iconSize} color={styles.iconColor} />;
      case 'error':
        return <XCircle size={iconSize} color={styles.iconColor} />;
      case 'warning':
        return <AlertTriangle size={iconSize} color={styles.iconColor} />;
      case 'info':
        return <Info size={iconSize} color={styles.iconColor} />;
      default:
        return <Info size={iconSize} color={styles.iconColor} />;
    }
  };

  const styles = getToastStyles();

  const containerStyle: ViewStyle = {
    position: 'absolute',
    top: insets.top + theme.spacing.md,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: styles.backgroundColor,
    borderWidth: 1,
    borderColor: styles.borderColor,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
    zIndex: 1000,
    elevation: 1000,
  };

  const progressBarStyle: ViewStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: styles.iconColor,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
  };

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ marginRight: theme.spacing.md, marginTop: 2 }}>
          {getIcon()}
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              color: styles.titleColor,
              marginBottom: message ? theme.spacing.xs : 0,
            }}
          >
            {title}
          </Text>

          {message && (
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: styles.messageColor,
                lineHeight: theme.typography.fontSize.sm * 1.4,
              }}
            >
              {message}
            </Text>
          )}

          {action && (
            <View style={{ marginTop: theme.spacing.sm }}>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: styles.iconColor,
                }}
                onPress={action.onPress}
              >
                {action.label}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={handleDismiss}
          style={{
            marginLeft: theme.spacing.sm,
            marginTop: -4,
            padding: theme.spacing.xs,
            borderRadius: theme.borderRadius.sm,
          }}
        >
          <X size={16} color={theme.colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {!persistent && (
        <Animated.View
          style={[
            progressBarStyle,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      )}
    </Animated.View>
  );
};
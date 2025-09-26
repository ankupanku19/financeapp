import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  ViewStyle,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { H3, BodyText, Caption } from './Typography';
import { responsive } from '../../constants/Design';

const { width: screenWidth } = Dimensions.get('window');

// Skeleton Item Component
interface SkeletonItemProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonItem: React.FC<SkeletonItemProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => {
      shimmerAnimation.stop();
    };
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width as number, width as number],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.neutral[200],
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateX: shimmerTranslate }],
        }}
      >
        <LinearGradient
          colors={[
            'transparent',
            theme.colors.white,
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            opacity: 0.5,
          }}
        />
      </Animated.View>
    </View>
  );
};

// Card Skeleton
interface SkeletonCardProps {
  showAvatar?: boolean;
  lines?: number;
  style?: ViewStyle;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showAvatar = false,
  lines = 3,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.background.primary,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.md,
          ...theme.shadows.sm,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md }}>
        {showAvatar && (
          <SkeletonItem
            width={40}
            height={40}
            borderRadius={20}
            style={{ marginRight: theme.spacing.md }}
          />
        )}
        <View style={{ flex: 1 }}>
          <SkeletonItem width="60%" height={20} style={{ marginBottom: theme.spacing.xs }} />
          <SkeletonItem width="40%" height={16} />
        </View>
      </View>

      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonItem
          key={index}
          width={index === lines - 1 ? '70%' : '100%'}
          height={16}
          style={{ marginBottom: theme.spacing.sm }}
        />
      ))}
    </View>
  );
};

// List Skeleton
interface SkeletonListProps {
  itemCount?: number;
  itemHeight?: number;
  showHeader?: boolean;
  style?: ViewStyle;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  itemCount = 5,
  itemHeight = 60,
  showHeader = true,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={style}>
      {showHeader && (
        <View style={{ marginBottom: theme.spacing.lg }}>
          <SkeletonItem width="50%" height={24} style={{ marginBottom: theme.spacing.sm }} />
          <SkeletonItem width="80%" height={16} />
        </View>
      )}

      {Array.from({ length: itemCount }).map((_, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.spacing.md,
            borderBottomWidth: index < itemCount - 1 ? 1 : 0,
            borderBottomColor: theme.colors.border.light,
          }}
        >
          <SkeletonItem
            width={40}
            height={40}
            borderRadius={20}
            style={{ marginRight: theme.spacing.md }}
          />
          <View style={{ flex: 1 }}>
            <SkeletonItem width="70%" height={18} style={{ marginBottom: theme.spacing.xs }} />
            <SkeletonItem width="50%" height={14} />
          </View>
          <SkeletonItem width={60} height={16} />
        </View>
      ))}
    </View>
  );
};

// Chart Skeleton
export const SkeletonChart: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.background.primary,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.lg,
          ...theme.shadows.sm,
        },
        style,
      ]}
    >
      <SkeletonItem width="40%" height={20} style={{ marginBottom: theme.spacing.lg }} />

      <View style={{ height: 200, justifyContent: 'flex-end' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: '100%' }}>
          {Array.from({ length: 7 }).map((_, index) => (
            <SkeletonItem
              key={index}
              width={responsive.width(30, 35, 40)}
              height={Math.random() * 150 + 50}
              style={{
                marginRight: index < 6 ? theme.spacing.sm : 0,
                borderRadius: theme.borderRadius.sm,
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

// Stats Skeleton
export const SkeletonStats: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { theme } = useTheme();

  return (
    <View style={style}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
        {Array.from({ length: 2 }).map((_, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              backgroundColor: theme.colors.background.primary,
              borderRadius: theme.borderRadius.xl,
              padding: theme.spacing.lg,
              marginRight: index === 0 ? theme.spacing.md : 0,
              ...theme.shadows.sm,
            }}
          >
            <SkeletonItem width={24} height={24} borderRadius={12} style={{ marginBottom: theme.spacing.md }} />
            <SkeletonItem width="60%" height={16} style={{ marginBottom: theme.spacing.xs }} />
            <SkeletonItem width="80%" height={24} />
          </View>
        ))}
      </View>

      <View
        style={{
          backgroundColor: theme.colors.background.primary,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.lg,
          ...theme.shadows.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md }}>
          <SkeletonItem width={32} height={32} borderRadius={16} style={{ marginRight: theme.spacing.md }} />
          <View style={{ flex: 1 }}>
            <SkeletonItem width="50%" height={18} style={{ marginBottom: theme.spacing.xs }} />
            <SkeletonItem width="90%" height={32} />
          </View>
        </View>
      </View>
    </View>
  );
};

// Full Page Loading
interface FullPageLoadingProps {
  message?: string;
  showLogo?: boolean;
}

export const FullPageLoading: React.FC<FullPageLoadingProps> = ({
  message = 'Loading...',
  showLogo = false,
}) => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background.primary,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing['2xl'],
        opacity: fadeAnim,
      }}
    >
      {showLogo && (
        <View
          style={{
            width: 80,
            height: 80,
            backgroundColor: theme.colors.primary[500],
            borderRadius: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: theme.spacing.xl,
          }}
        >
          <H3 style={{ color: theme.colors.white }}>FT</H3>
        </View>
      )}

      <ActivityIndicator
        size="large"
        color={theme.colors.primary[500]}
        style={{ marginBottom: theme.spacing.lg }}
      />

      <BodyText style={{ textAlign: 'center', color: theme.colors.text.secondary }}>
        {message}
      </BodyText>
    </Animated.View>
  );
};

// Inline Loading
interface InlineLoadingProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  style?: ViewStyle;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  size = 'medium',
  message,
  style,
}) => {
  const { theme } = useTheme();

  const getSize = () => {
    switch (size) {
      case 'small':
        return 'small' as const;
      case 'large':
        return 'large' as const;
      default:
        return 32;
    }
  };

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.lg,
        },
        style,
      ]}
    >
      <ActivityIndicator
        size={getSize()}
        color={theme.colors.primary[500]}
        style={{ marginRight: message ? theme.spacing.md : 0 }}
      />
      {message && (
        <Caption style={{ color: theme.colors.text.secondary }}>
          {message}
        </Caption>
      )}
    </View>
  );
};
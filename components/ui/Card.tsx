import React from 'react';
import {
  View,
  TouchableOpacity,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { H3, H4, BodyText, Caption } from './Typography';
import { responsive } from '../../constants/Design';

interface BaseCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

const BaseCard: React.FC<BaseCardProps> = ({
  children,
  style,
  padding = 'lg',
  shadow = 'md',
  borderRadius = 'xl',
  backgroundColor,
  borderColor,
  borderWidth,
}) => {
  const { theme } = useTheme();

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return responsive.spacing(theme.spacing.sm, theme.spacing.md, theme.spacing.md);
      case 'md':
        return responsive.spacing(theme.spacing.md, theme.spacing.lg, theme.spacing.lg);
      case 'lg':
        return responsive.spacing(theme.spacing.lg, theme.spacing.xl, theme.spacing.xl);
      case 'xl':
        return responsive.spacing(theme.spacing.xl, theme.spacing['2xl'], theme.spacing['2xl']);
      default:
        return responsive.spacing(theme.spacing.lg, theme.spacing.xl, theme.spacing.xl);
    }
  };

  const getShadow = () => {
    switch (shadow) {
      case 'none':
        return {};
      case 'sm':
        return theme.shadows.sm;
      case 'md':
        return theme.shadows.md;
      case 'lg':
        return theme.shadows.lg;
      case 'xl':
        return theme.shadows.xl;
      default:
        return theme.shadows.md;
    }
  };

  const getBorderRadius = () => {
    switch (borderRadius) {
      case 'sm':
        return theme.borderRadius.sm;
      case 'md':
        return theme.borderRadius.md;
      case 'lg':
        return theme.borderRadius.lg;
      case 'xl':
        return theme.borderRadius.xl;
      case '2xl':
        return theme.borderRadius['2xl'];
      default:
        return theme.borderRadius.xl;
    }
  };

  const cardStyle: ViewStyle = {
    backgroundColor: backgroundColor || theme.colors.background.primary,
    borderRadius: getBorderRadius(),
    padding: getPadding(),
    borderWidth: borderWidth || (theme.isDark ? 1 : 0),
    borderColor: borderColor || theme.colors.border.light,
    ...getShadow(),
  };

  return <View style={[cardStyle, style]}>{children}</View>;
};

// Basic Card
export const Card: React.FC<BaseCardProps> = (props) => {
  return <BaseCard {...props} />;
};

// Pressable Card
interface PressableCardProps extends BaseCardProps, Omit<TouchableOpacityProps, 'style'> {
  onPress?: () => void;
  activeOpacity?: number;
}

export const PressableCard: React.FC<PressableCardProps> = ({
  children,
  onPress,
  activeOpacity = 0.8,
  style,
  padding = 'lg',
  shadow = 'md',
  borderRadius = 'xl',
  backgroundColor,
  borderColor,
  borderWidth,
  ...props
}) => {
  const { theme } = useTheme();

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return responsive.spacing(theme.spacing.sm, theme.spacing.md, theme.spacing.md);
      case 'md':
        return responsive.spacing(theme.spacing.md, theme.spacing.lg, theme.spacing.lg);
      case 'lg':
        return responsive.spacing(theme.spacing.lg, theme.spacing.xl, theme.spacing.xl);
      case 'xl':
        return responsive.spacing(theme.spacing.xl, theme.spacing['2xl'], theme.spacing['2xl']);
      default:
        return responsive.spacing(theme.spacing.lg, theme.spacing.xl, theme.spacing.xl);
    }
  };

  const getShadow = () => {
    switch (shadow) {
      case 'none':
        return {};
      case 'sm':
        return theme.shadows.sm;
      case 'md':
        return theme.shadows.md;
      case 'lg':
        return theme.shadows.lg;
      case 'xl':
        return theme.shadows.xl;
      default:
        return theme.shadows.md;
    }
  };

  const getBorderRadius = () => {
    switch (borderRadius) {
      case 'sm':
        return theme.borderRadius.sm;
      case 'md':
        return theme.borderRadius.md;
      case 'lg':
        return theme.borderRadius.lg;
      case 'xl':
        return theme.borderRadius.xl;
      case '2xl':
        return theme.borderRadius['2xl'];
      default:
        return theme.borderRadius.xl;
    }
  };

  const cardStyle: ViewStyle = {
    backgroundColor: backgroundColor || theme.colors.background.primary,
    borderRadius: getBorderRadius(),
    padding: getPadding(),
    borderWidth: borderWidth || (theme.isDark ? 1 : 0),
    borderColor: borderColor || theme.colors.border.light,
    ...getShadow(),
  };

  return (
    <TouchableOpacity
      style={[cardStyle, style]}
      onPress={onPress}
      activeOpacity={activeOpacity}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};

// Stat Card
interface StatCardProps extends BaseCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  valueColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  valueColor,
  trend,
  trendValue,
  onPress,
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return theme.colors.success[500];
      case 'down':
        return theme.colors.error[500];
      case 'neutral':
      default:
        return theme.colors.text.tertiary;
    }
  };

  const CardComponent = onPress ? PressableCard : Card;

  return (
    <CardComponent
      onPress={onPress}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: responsive.height(80, 90, 100),
        },
        style,
      ]}
      {...props}
    >
      {icon && (
        <View
          style={{
            marginRight: theme.spacing.lg,
            width: responsive.width(40, 44, 48),
            height: responsive.width(40, 44, 48),
            borderRadius: theme.borderRadius.lg,
            backgroundColor: iconColor || theme.colors.primary[100],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Caption style={{ marginBottom: theme.spacing.xs }}>{title}</Caption>

        <H3
          style={{
            color: valueColor || theme.colors.text.primary,
            marginBottom: subtitle || trendValue ? theme.spacing.xs : 0,
          }}
        >
          {value}
        </H3>

        {(subtitle || trendValue) && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {subtitle && (
              <BodyText size="sm" style={{ flex: 1 }}>
                {subtitle}
              </BodyText>
            )}
            {trendValue && (
              <Caption style={{ color: getTrendColor() }}>
                {trend === 'up' ? '↗ ' : trend === 'down' ? '↘ ' : '→ '}
                {trendValue}
              </Caption>
            )}
          </View>
        )}
      </View>
    </CardComponent>
  );
};

// Info Card with Header
interface InfoCardProps extends BaseCardProps {
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  subtitle,
  headerAction,
  footer,
  children,
  style,
  ...props
}) => {
  const { theme } = useTheme();

  return (
    <Card style={style} {...props}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.lg,
        }}
      >
        <View style={{ flex: 1 }}>
          <H4 style={{ marginBottom: subtitle ? theme.spacing.xs : 0 }}>
            {title}
          </H4>
          {subtitle && <Caption>{subtitle}</Caption>}
        </View>
        {headerAction && <View>{headerAction}</View>}
      </View>

      {/* Content */}
      {children}

      {/* Footer */}
      {footer && (
        <View style={{ marginTop: theme.spacing.lg }}>
          {footer}
        </View>
      )}
    </Card>
  );
};

// Feature Card
interface FeatureCardProps extends PressableCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  badge,
  badgeColor,
  style,
  onPress,
  ...props
}) => {
  const { theme } = useTheme();

  return (
    <PressableCard
      onPress={onPress}
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: responsive.height(120, 140, 160),
          position: 'relative',
        },
        style,
      ]}
      {...props}
    >
      {badge && (
        <View
          style={{
            position: 'absolute',
            top: theme.spacing.md,
            right: theme.spacing.md,
            backgroundColor: badgeColor || theme.colors.accent[500],
            borderRadius: theme.borderRadius.full,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
          }}
        >
          <Caption style={{ color: theme.colors.white, fontSize: 10 }}>
            {badge}
          </Caption>
        </View>
      )}

      {icon && (
        <View style={{ marginBottom: theme.spacing.md }}>
          {icon}
        </View>
      )}

      <H4 style={{ textAlign: 'center', marginBottom: theme.spacing.sm }}>
        {title}
      </H4>

      <BodyText
        size="sm"
        style={{
          textAlign: 'center',
          color: theme.colors.text.tertiary,
        }}
      >
        {description}
      </BodyText>
    </PressableCard>
  );
};
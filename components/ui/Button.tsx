import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { BodyText } from './Typography';
import { responsive, ComponentSizes } from '../../constants/Design';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  onPress,
  ...props
}) => {
  const { theme } = useTheme();

  // Get size configuration
  const sizeConfig = ComponentSizes.button[size];

  // Get variant styles
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    const baseContainer: ViewStyle = {
      borderRadius: theme.borderRadius.lg,
      paddingVertical: sizeConfig.paddingVertical,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      minHeight: sizeConfig.minHeight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: fullWidth ? '100%' : undefined,
    };

    const baseText: TextStyle = {
      fontSize: sizeConfig.fontSize,
      fontWeight: theme.typography.fontWeight.semibold,
      lineHeight: sizeConfig.fontSize * theme.typography.lineHeight.normal,
    };

    switch (variant) {
      case 'primary':
        return {
          container: {
            ...baseContainer,
            backgroundColor: theme.colors.primary[500],
            ...theme.shadows.md,
          },
          text: {
            ...baseText,
            color: theme.colors.white,
          },
        };

      case 'secondary':
        return {
          container: {
            ...baseContainer,
            backgroundColor: theme.colors.secondary[500],
            ...theme.shadows.md,
          },
          text: {
            ...baseText,
            color: theme.colors.white,
          },
        };

      case 'outline':
        return {
          container: {
            ...baseContainer,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.colors.border.medium,
          },
          text: {
            ...baseText,
            color: theme.colors.text.primary,
          },
        };

      case 'ghost':
        return {
          container: {
            ...baseContainer,
            backgroundColor: 'transparent',
          },
          text: {
            ...baseText,
            color: theme.colors.primary[500],
          },
        };

      case 'danger':
        return {
          container: {
            ...baseContainer,
            backgroundColor: theme.colors.error[500],
            ...theme.shadows.md,
          },
          text: {
            ...baseText,
            color: theme.colors.white,
          },
        };

      case 'success':
        return {
          container: {
            ...baseContainer,
            backgroundColor: theme.colors.success[500],
            ...theme.shadows.md,
          },
          text: {
            ...baseText,
            color: theme.colors.white,
          },
        };

      case 'warning':
        return {
          container: {
            ...baseContainer,
            backgroundColor: theme.colors.warning[500],
            ...theme.shadows.md,
          },
          text: {
            ...baseText,
            color: theme.colors.white,
          },
        };

      default:
        return {
          container: baseContainer,
          text: baseText,
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Get disabled styles
  const getDisabledStyles = () => {
    if (variant === 'outline' || variant === 'ghost') {
      return {
        container: {
          borderColor: theme.colors.border.light,
          backgroundColor: theme.colors.background.tertiary,
        },
        text: {
          color: theme.colors.text.disabled,
        },
      };
    }

    return {
      container: {
        backgroundColor: theme.colors.neutral[300],
        ...theme.shadows.sm,
      },
      text: {
        color: theme.colors.text.disabled,
      },
    };
  };

  const disabledStyles = getDisabledStyles();
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle = [
    variantStyles.container,
    isDisabled && disabledStyles.container,
    style,
  ].filter(Boolean).reduce((acc, curr) => ({ ...acc, ...curr }), {});

  const finalTextStyle: TextStyle = [
    variantStyles.text,
    isDisabled && disabledStyles.text,
    textStyle,
  ].filter(Boolean).reduce((acc, curr) => ({ ...acc, ...curr }), {});

  const iconSize = responsive.width(16, 18, 20);
  const iconSpacing = theme.spacing.sm;

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.text.color}
        />
      ) : (
        <>
          {leftIcon && (
            <View style={{ marginRight: iconSpacing }}>
              {leftIcon}
            </View>
          )}

          <BodyText
            style={finalTextStyle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {children}
          </BodyText>

          {rightIcon && (
            <View style={{ marginLeft: iconSpacing }}>
              {rightIcon}
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

// Floating Action Button
interface FABProps extends Omit<TouchableOpacityProps, 'style'> {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'accent';
  style?: ViewStyle;
  loading?: boolean;
  disabled?: boolean;
}

export const FloatingActionButton: React.FC<FABProps> = ({
  icon,
  size = 'md',
  variant = 'primary',
  style,
  loading = false,
  disabled = false,
  onPress,
  ...props
}) => {
  const { theme } = useTheme();

  const getSize = () => {
    switch (size) {
      case 'sm':
        return responsive.width(40, 44, 48);
      case 'md':
        return responsive.width(56, 60, 64);
      case 'lg':
        return responsive.width(72, 76, 80);
      default:
        return responsive.width(56, 60, 64);
    }
  };

  const fabSize = getSize();

  const getVariantColor = () => {
    switch (variant) {
      case 'primary':
        return theme.colors.primary[500];
      case 'secondary':
        return theme.colors.secondary[500];
      case 'accent':
        return theme.colors.accent[500];
      default:
        return theme.colors.primary[500];
    }
  };

  const backgroundColor = getVariantColor();
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle = {
    width: fabSize,
    height: fabSize,
    borderRadius: fabSize / 2,
    backgroundColor: isDisabled ? theme.colors.neutral[300] : backgroundColor,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
    elevation: 6,
  };

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.white} />
      ) : (
        icon
      )}
    </TouchableOpacity>
  );
};

// Icon Button
interface IconButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  icon: React.ReactNode;
  size?: ButtonSize;
  variant?: 'ghost' | 'outline' | 'filled';
  style?: ViewStyle;
  loading?: boolean;
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'md',
  variant = 'ghost',
  style,
  loading = false,
  disabled = false,
  onPress,
  ...props
}) => {
  const { theme } = useTheme();

  const getButtonSize = () => {
    switch (size) {
      case 'sm':
        return responsive.width(32, 36, 40);
      case 'md':
        return responsive.width(40, 44, 48);
      case 'lg':
        return responsive.width(48, 52, 56);
      case 'xl':
        return responsive.width(56, 60, 64);
      default:
        return responsive.width(40, 44, 48);
    }
  };

  const buttonSize = getButtonSize();
  const isDisabled = disabled || loading;

  const getVariantStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      width: buttonSize,
      height: buttonSize,
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: isDisabled ? theme.colors.neutral[200] : theme.colors.primary[500],
          ...theme.shadows.sm,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isDisabled ? theme.colors.border.light : theme.colors.border.medium,
        };
      case 'ghost':
      default:
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
    }
  };

  return (
    <TouchableOpacity
      style={[getVariantStyles(), style]}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'filled' ? theme.colors.white : theme.colors.primary[500]}
        />
      ) : (
        icon
      )}
    </TouchableOpacity>
  );
};
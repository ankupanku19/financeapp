import React from 'react';
import { Text, TextStyle, TextProps } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { responsive } from '../../constants/Design';

interface BaseTextProps extends TextProps {
  children: React.ReactNode;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  style?: TextStyle;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

const BaseText: React.FC<BaseTextProps & { defaultStyle: TextStyle }> = ({
  children,
  color,
  align = 'left',
  weight,
  style,
  defaultStyle,
  numberOfLines,
  ellipsizeMode,
  ...props
}) => {
  const { theme } = useTheme();

  const textStyle: TextStyle = {
    ...defaultStyle,
    color: color || defaultStyle.color || theme.colors.text.primary,
    textAlign: align,
    fontWeight: weight ? theme.typography.fontWeight[weight] : defaultStyle.fontWeight,
    fontFamily: weight ? theme.typography.fontFamily[weight] : theme.typography.fontFamily.regular,
  };

  return (
    <Text
      style={[textStyle, style]}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      allowFontScaling={false}
      {...props}
    >
      {children}
    </Text>
  );
};

// Heading components
interface HeadingProps extends BaseTextProps {}

export const H1: React.FC<HeadingProps> = (props) => {
  const { theme } = useTheme();
  const defaultStyle: TextStyle = {
    fontSize: responsive.fontSize(theme.typography.fontSize['3xl'], theme.typography.fontSize['4xl'], theme.typography.fontSize['5xl']),
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: responsive.fontSize(
      theme.typography.fontSize['3xl'] * theme.typography.lineHeight.tight,
      theme.typography.fontSize['4xl'] * theme.typography.lineHeight.tight,
      theme.typography.fontSize['5xl'] * theme.typography.lineHeight.tight
    ),
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  };
  return <BaseText defaultStyle={defaultStyle} {...props} />;
};

export const H2: React.FC<HeadingProps> = (props) => {
  const { theme } = useTheme();
  const defaultStyle: TextStyle = {
    fontSize: responsive.fontSize(theme.typography.fontSize['2xl'], theme.typography.fontSize['3xl'], theme.typography.fontSize['4xl']),
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: responsive.fontSize(
      theme.typography.fontSize['2xl'] * theme.typography.lineHeight.tight,
      theme.typography.fontSize['3xl'] * theme.typography.lineHeight.tight,
      theme.typography.fontSize['4xl'] * theme.typography.lineHeight.tight
    ),
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  };
  return <BaseText defaultStyle={defaultStyle} {...props} />;
};

export const H3: React.FC<HeadingProps> = (props) => {
  const { theme } = useTheme();
  const defaultStyle: TextStyle = {
    fontSize: responsive.fontSize(theme.typography.fontSize.xl, theme.typography.fontSize['2xl'], theme.typography.fontSize['3xl']),
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: responsive.fontSize(
      theme.typography.fontSize.xl * theme.typography.lineHeight.normal,
      theme.typography.fontSize['2xl'] * theme.typography.lineHeight.normal,
      theme.typography.fontSize['3xl'] * theme.typography.lineHeight.normal
    ),
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  };
  return <BaseText defaultStyle={defaultStyle} {...props} />;
};

export const H4: React.FC<HeadingProps> = (props) => {
  const { theme } = useTheme();
  const defaultStyle: TextStyle = {
    fontSize: responsive.fontSize(theme.typography.fontSize.lg, theme.typography.fontSize.xl, theme.typography.fontSize['2xl']),
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: responsive.fontSize(
      theme.typography.fontSize.lg * theme.typography.lineHeight.normal,
      theme.typography.fontSize.xl * theme.typography.lineHeight.normal,
      theme.typography.fontSize['2xl'] * theme.typography.lineHeight.normal
    ),
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  };
  return <BaseText defaultStyle={defaultStyle} {...props} />;
};

// Body text components
interface BodyProps extends BaseTextProps {
  size?: 'sm' | 'base' | 'lg';
}

export const BodyText: React.FC<BodyProps> = ({ size = 'base', ...props }) => {
  const { theme } = useTheme();

  const fontSize = {
    sm: responsive.fontSize(theme.typography.fontSize.sm, theme.typography.fontSize.sm, theme.typography.fontSize.base),
    base: responsive.fontSize(theme.typography.fontSize.base, theme.typography.fontSize.base, theme.typography.fontSize.lg),
    lg: responsive.fontSize(theme.typography.fontSize.lg, theme.typography.fontSize.lg, theme.typography.fontSize.xl),
  }[size];

  const defaultStyle: TextStyle = {
    fontSize,
    fontWeight: theme.typography.fontWeight.normal,
    lineHeight: fontSize * theme.typography.lineHeight.normal,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  };
  return <BaseText defaultStyle={defaultStyle} {...props} />;
};

export const Caption: React.FC<BaseTextProps> = (props) => {
  const { theme } = useTheme();
  const defaultStyle: TextStyle = {
    fontSize: responsive.fontSize(theme.typography.fontSize.xs, theme.typography.fontSize.sm, theme.typography.fontSize.sm),
    fontWeight: theme.typography.fontWeight.normal,
    lineHeight: responsive.fontSize(
      theme.typography.fontSize.xs * theme.typography.lineHeight.normal,
      theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
      theme.typography.fontSize.sm * theme.typography.lineHeight.normal
    ),
    color: theme.colors.text.tertiary,
  };
  return <BaseText defaultStyle={defaultStyle} {...props} />;
};

export const Label: React.FC<BaseTextProps> = (props) => {
  const { theme } = useTheme();
  const defaultStyle: TextStyle = {
    fontSize: responsive.fontSize(theme.typography.fontSize.sm, theme.typography.fontSize.base, theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.medium,
    lineHeight: responsive.fontSize(
      theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
      theme.typography.fontSize.base * theme.typography.lineHeight.normal,
      theme.typography.fontSize.base * theme.typography.lineHeight.normal
    ),
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  };
  return <BaseText defaultStyle={defaultStyle} {...props} />;
};

// Specialized text components
export const ErrorText: React.FC<BaseTextProps> = (props) => {
  const { theme } = useTheme();
  const defaultStyle: TextStyle = {
    fontSize: responsive.fontSize(theme.typography.fontSize.sm, theme.typography.fontSize.sm, theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.error[500],
    marginTop: theme.spacing.xs,
  };
  return <BaseText defaultStyle={defaultStyle} {...props} />;
};

export const SuccessText: React.FC<BaseTextProps> = (props) => {
  const { theme } = useTheme();
  const defaultStyle: TextStyle = {
    fontSize: responsive.fontSize(theme.typography.fontSize.sm, theme.typography.fontSize.sm, theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.success[500],
    marginTop: theme.spacing.xs,
  };
  return <BaseText defaultStyle={defaultStyle} {...props} />;
};

export const WarningText: React.FC<BaseTextProps> = (props) => {
  const { theme } = useTheme();
  const defaultStyle: TextStyle = {
    fontSize: responsive.fontSize(theme.typography.fontSize.sm, theme.typography.fontSize.sm, theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.warning[500],
    marginTop: theme.spacing.xs,
  };
  return <BaseText defaultStyle={defaultStyle} {...props} />;
};

// Price/Money display component
interface PriceTextProps extends BaseTextProps {
  amount: number;
  currency?: string;
  size?: 'sm' | 'base' | 'lg' | 'xl';
  showCurrency?: boolean;
}

export const PriceText: React.FC<PriceTextProps> = ({
  amount,
  currency = 'USD',
  size = 'base',
  showCurrency = true,
  ...props
}) => {
  const { theme } = useTheme();

  const fontSize = {
    sm: responsive.fontSize(theme.typography.fontSize.sm, theme.typography.fontSize.base, theme.typography.fontSize.base),
    base: responsive.fontSize(theme.typography.fontSize.lg, theme.typography.fontSize.xl, theme.typography.fontSize.xl),
    lg: responsive.fontSize(theme.typography.fontSize.xl, theme.typography.fontSize['2xl'], theme.typography.fontSize['2xl']),
    xl: responsive.fontSize(theme.typography.fontSize['2xl'], theme.typography.fontSize['3xl'], theme.typography.fontSize['4xl']),
  }[size];

  const defaultStyle: TextStyle = {
    fontSize,
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: fontSize * theme.typography.lineHeight.tight,
    color: theme.colors.primary[500],
  };

  const formatAmount = (value: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: showCurrency ? 'currency' : 'decimal',
      currency: currency,
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(Math.abs(value));

    return value < 0 ? `-${formatted}` : formatted;
  };

  return (
    <BaseText defaultStyle={defaultStyle} {...props}>
      {formatAmount(amount)}
    </BaseText>
  );
};
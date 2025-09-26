import React from 'react';
import { View, ViewStyle } from 'react-native';
import {
  Inbox,
  PlusCircle,
  Search,
  AlertCircle,
  Wifi,
  WifiOff,
  Target,
  DollarSign,
  PiggyBank,
  BarChart3,
  Calendar
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { H3, BodyText } from './Typography';
import { Button } from './Button';
import { responsive } from '../../constants/Design';

export type EmptyStateType =
  | 'general'
  | 'search'
  | 'network'
  | 'error'
  | 'income'
  | 'goals'
  | 'savings'
  | 'analytics'
  | 'transactions';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'general',
  title,
  message,
  icon,
  action,
  secondaryAction,
  style,
}) => {
  const { theme } = useTheme();

  const getDefaultContent = () => {
    switch (type) {
      case 'income':
        return {
          icon: <DollarSign size={64} color={theme.colors.primary[300]} />,
          title: 'No Income Recorded',
          message: 'Start tracking your income to see insights and manage your finances better.',
          action: {
            label: 'Add First Income',
            variant: 'primary' as const,
          },
        };

      case 'goals':
        return {
          icon: <Target size={64} color={theme.colors.secondary[300]} />,
          title: 'No Goals Set',
          message: 'Set your first financial goal and start working towards achieving it.',
          action: {
            label: 'Create Goal',
            variant: 'primary' as const,
          },
        };

      case 'savings':
        return {
          icon: <PiggyBank size={64} color={theme.colors.success[300]} />,
          title: 'No Savings Yet',
          message: 'Start saving money to build your financial security and reach your goals.',
          action: {
            label: 'Add Savings',
            variant: 'primary' as const,
          },
        };

      case 'analytics':
        return {
          icon: <BarChart3 size={64} color={theme.colors.accent[300]} />,
          title: 'Not Enough Data',
          message: 'Add more income and expense data to see detailed analytics and insights.',
          action: {
            label: 'Add Data',
            variant: 'primary' as const,
          },
        };

      case 'transactions':
        return {
          icon: <Calendar size={64} color={theme.colors.primary[300]} />,
          title: 'No Transactions',
          message: 'Your transactions will appear here once you start adding income and expenses.',
          action: {
            label: 'Add Transaction',
            variant: 'primary' as const,
          },
        };

      case 'search':
        return {
          icon: <Search size={64} color={theme.colors.text.tertiary} />,
          title: 'No Results Found',
          message: 'Try adjusting your search terms or filters to find what you\'re looking for.',
        };

      case 'network':
        return {
          icon: <WifiOff size={64} color={theme.colors.error[400]} />,
          title: 'Connection Problem',
          message: 'Please check your internet connection and try again.',
          action: {
            label: 'Retry',
            variant: 'outline' as const,
          },
        };

      case 'error':
        return {
          icon: <AlertCircle size={64} color={theme.colors.error[400]} />,
          title: 'Something Went Wrong',
          message: 'We encountered an error loading your data. Please try again.',
          action: {
            label: 'Try Again',
            variant: 'outline' as const,
          },
        };

      default:
        return {
          icon: <Inbox size={64} color={theme.colors.text.tertiary} />,
          title: 'Nothing Here Yet',
          message: 'This area is empty. Start by adding some content.',
          action: {
            label: 'Get Started',
            variant: 'primary' as const,
          },
        };
    }
  };

  const defaultContent = getDefaultContent();
  const displayIcon = icon || defaultContent.icon;
  const displayTitle = title || defaultContent.title;
  const displayMessage = message || defaultContent.message;
  const displayAction = action || defaultContent.action;

  return (
    <View
      style={[
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: responsive.spacing(theme.spacing['3xl'], theme.spacing['4xl'], theme.spacing['5xl']),
          minHeight: 300,
        },
        style,
      ]}
    >
      {/* Icon */}
      <View style={{ marginBottom: theme.spacing.xl }}>
        {displayIcon}
      </View>

      {/* Title */}
      <H3
        style={{
          textAlign: 'center',
          marginBottom: theme.spacing.md,
          color: theme.colors.text.primary,
        }}
      >
        {displayTitle}
      </H3>

      {/* Message */}
      <BodyText
        style={{
          textAlign: 'center',
          marginBottom: theme.spacing.xl,
          color: theme.colors.text.secondary,
          maxWidth: responsive.width(280, 400, 500),
          lineHeight: responsive.fontSize(20, 22, 24),
        }}
      >
        {displayMessage}
      </BodyText>

      {/* Actions */}
      {displayAction && (
        <View style={{ width: '100%', maxWidth: responsive.width(250, 300, 350) }}>
          <Button
            variant={displayAction.variant || 'primary'}
            onPress={displayAction.onPress}
            fullWidth
            style={{ marginBottom: secondaryAction ? theme.spacing.md : 0 }}
          >
            {displayAction.label}
          </Button>

          {secondaryAction && (
            <Button
              variant="ghost"
              onPress={secondaryAction.onPress}
              fullWidth
            >
              {secondaryAction.label}
            </Button>
          )}
        </View>
      )}
    </View>
  );
};

// Specialized empty states
export const IncomeEmptyState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="income" {...props} />
);

export const GoalsEmptyState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="goals" {...props} />
);

export const SavingsEmptyState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="savings" {...props} />
);

export const AnalyticsEmptyState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="analytics" {...props} />
);

export const SearchEmptyState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="search" {...props} />
);

export const NetworkEmptyState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="network" {...props} />
);

export const ErrorEmptyState: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="error" {...props} />
);
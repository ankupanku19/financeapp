import React, { Component, ReactNode, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react-native';
import { H2, BodyText } from './Typography';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Haptic feedback for errors
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to crash reporting service (e.g., Sentry)
    // Sentry.captureException(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    // Navigate to home screen
    // This would typically use your navigation system
    console.log('Navigate to home');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <AlertTriangle size={64} color="#EF4444" style={styles.icon} />

            <H2 style={styles.title}>Oops! Something went wrong</H2>

            <BodyText style={styles.message}>
              We're sorry, but something unexpected happened. Our team has been notified and is working on a fix.
            </BodyText>

            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>{this.state.error.toString()}</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={this.handleRetry}
                style={[styles.button, styles.retryButton]}
              >
                <RefreshCw size={18} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={this.handleGoHome}
                style={[styles.button, styles.homeButton]}
              >
                <Home size={18} color="#6366F1" style={styles.buttonIcon} />
                <Text style={[styles.buttonText, styles.homeButtonText]}>Go Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#111827',
  },
  message: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#6B7280',
    lineHeight: 24,
  },
  debugContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#991B1B',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minHeight: 48,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  retryButton: {
    backgroundColor: '#6366F1',
    marginBottom: 12,
  },
  homeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  homeButtonText: {
    color: '#6366F1',
  },
});

// Hook for functional components

export const useErrorHandler = () => {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
};
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { FullPageLoading } from '@/components/ui/LoadingStates';
import SplashScreen from '@/components/SplashScreen';
import WelcomeScreen from '@/components/WelcomeScreen';

function AppNavigator() {
  const { theme } = useTheme();
  const { hasSeenSplash, hasSeenWelcome, markSplashComplete, markWelcomeComplete } = useOnboarding();

  // Show splash screen if not seen
  if (!hasSeenSplash) {
    return <SplashScreen onAnimationComplete={markSplashComplete} />;
  }

  // Show welcome screen if not seen
  if (!hasSeenWelcome) {
    return <WelcomeScreen onGetStarted={markWelcomeComplete} />;
  }

  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar
        style={theme.isDark ? "light" : "dark"}
        backgroundColor={theme.colors.background.primary}
        translucent={false}
      />
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  const isReady = useFrameworkReady();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Root Error Boundary:', error, errorInfo);
            // Log to crash reporting service
          }}
        >
          <ThemeProvider>
            <ToastProvider>
              <OnboardingProvider>
                <AuthProvider>
                  <AppProvider>
                    {!isReady ? (
                      <FullPageLoading message="Initializing app..." showLogo={true} />
                    ) : (
                      <AppNavigator />
                    )}
                  </AppProvider>
                </AuthProvider>
              </OnboardingProvider>
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
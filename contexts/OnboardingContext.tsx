import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingContextType {
  hasSeenSplash: boolean;
  hasSeenWelcome: boolean;
  markSplashComplete: () => void;
  markWelcomeComplete: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const SPLASH_KEY = 'has_seen_splash';
const WELCOME_KEY = 'has_seen_welcome';

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [hasSeenSplash, setHasSeenSplash] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOnboardingState();
  }, []);

  const loadOnboardingState = async () => {
    try {
      const [splashSeen, welcomeSeen] = await Promise.all([
        AsyncStorage.getItem(SPLASH_KEY),
        AsyncStorage.getItem(WELCOME_KEY),
      ]);

      setHasSeenSplash(splashSeen === 'true');
      setHasSeenWelcome(welcomeSeen === 'true');
    } catch (error) {
      console.error('Error loading onboarding state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markSplashComplete = async () => {
    try {
      await AsyncStorage.setItem(SPLASH_KEY, 'true');
      setHasSeenSplash(true);
    } catch (error) {
      console.error('Error marking splash complete:', error);
    }
  };

  const markWelcomeComplete = async () => {
    try {
      await AsyncStorage.setItem(WELCOME_KEY, 'true');
      setHasSeenWelcome(true);
    } catch (error) {
      console.error('Error marking welcome complete:', error);
    }
  };

  const resetOnboarding = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(SPLASH_KEY),
        AsyncStorage.removeItem(WELCOME_KEY),
      ]);
      setHasSeenSplash(false);
      setHasSeenWelcome(false);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  const value: OnboardingContextType = {
    hasSeenSplash,
    hasSeenWelcome,
    markSplashComplete,
    markWelcomeComplete,
    resetOnboarding,
  };

  if (isLoading) {
    return null; // Or a loading component
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

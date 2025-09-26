import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export default function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  useEffect(() => {
    // Complete splash screen after 2 seconds
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.content}>
        {/* Simple Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>💰</Text>
        </View>

        {/* App Name */}
        <Text style={styles.appName}>Finance Tracker</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>Take control of your finances</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoEmoji: {
    fontSize: 64,
    textAlign: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '400',
  },
});

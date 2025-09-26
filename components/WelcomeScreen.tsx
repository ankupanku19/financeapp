import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const doodleAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Main content animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered doodle animations
    const doodleDelays = [0, 200, 400, 600, 800];
    doodleAnimations.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(doodleDelays[index]),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [fadeAnim, slideAnim, doodleAnimations]);

  const renderDoodle = (index: number, emoji: string, position: { x: number; y: number }) => {
    const scale = doodleAnimations[index].interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.8, 1.2, 0.8],
    });

    const rotate = doodleAnimations[index].interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.doodle,
          {
            left: position.x,
            top: position.y,
            transform: [{ scale }, { rotate }],
          },
        ]}
      >
        <Text style={styles.doodleEmoji}>{emoji}</Text>
      </Animated.View>
    );
  };

  const doodles = [
    { emoji: '📊', position: { x: width * 0.1, y: height * 0.15 } },
    { emoji: '💡', position: { x: width * 0.8, y: height * 0.2 } },
    { emoji: '🎯', position: { x: width * 0.15, y: height * 0.7 } },
    { emoji: '📈', position: { x: width * 0.75, y: height * 0.65 } },
    { emoji: '💎', position: { x: width * 0.5, y: height * 0.1 } },
  ];

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background.primary}
      />
      <LinearGradient
        colors={[
          theme.colors.background.primary,
          theme.colors.background.secondary,
          theme.colors.primary.light,
        ]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Animated Doodles */}
        {doodles.map((doodle, index) =>
          renderDoodle(index, doodle.emoji, doodle.position)
        )}

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Welcome Text */}
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              Welcome to Finance Tracker! 🎉
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              Your journey to financial freedom starts here
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>📱</Text>
              <Text style={[styles.featureText, { color: theme.colors.text.primary }]}>
                Track your income & expenses
              </Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>🎯</Text>
              <Text style={[styles.featureText, { color: theme.colors.text.primary }]}>
                Set and achieve financial goals
              </Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>📊</Text>
              <Text style={[styles.featureText, { color: theme.colors.text.primary }]}>
                Get AI-powered insights
              </Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>🔔</Text>
              <Text style={[styles.featureText, { color: theme.colors.text.primary }]}>
                Smart notifications & reminders
              </Text>
            </View>
          </View>

          {/* Get Started Button */}
          <TouchableOpacity
            style={[styles.getStartedButton, { backgroundColor: theme.colors.primary.main }]}
            onPress={onGetStarted}
            activeOpacity={0.8}
          >
            <Text style={[styles.getStartedText, { color: theme.colors.text.inverse }]}>
              Get Started
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doodle: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doodleEmoji: {
    fontSize: 40,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
    width: '100%',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '300',
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 50,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
    fontWeight: '400',
  },
  getStartedButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

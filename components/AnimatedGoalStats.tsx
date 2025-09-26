import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface StatData {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  gradientColors: [string, string];
}

interface AnimatedGoalStatsProps {
  stats: StatData[];
  autoAnimate?: boolean;
  animateInterval?: number;
}

export const AnimatedGoalStats: React.FC<AnimatedGoalStatsProps> = ({
  stats,
  autoAnimate = true,
  animateInterval = 3000,
}) => {
  const { theme } = useTheme();
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values for each card
  const cardAnimations = useRef(
    stats.map(() => ({
      scale: new Animated.Value(1),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(1),
      rotate: new Animated.Value(0),
    }))
  ).current;

  // Wave animation value
  const waveAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!stats || stats.length === 0) return;
    
    // Initial entrance animation
    startEntranceAnimation();
    
    if (autoAnimate) {
      startWaveAnimation();
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [stats, autoAnimate, animateInterval]);

  const startEntranceAnimation = () => {
    // Staggered entrance animation for all cards
    stats.forEach((_, index) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(cardAnimations[index].scale, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(cardAnimations[index].opacity, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(cardAnimations[index].translateY, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }, index * 150);
    });
  };

  const startWaveAnimation = () => {
    const createWave = () => {
      // Create a wave effect across all cards
      stats.forEach((_, index) => {
        setTimeout(() => {
          Animated.sequence([
            Animated.parallel([
              Animated.spring(cardAnimations[index].scale, {
                toValue: 1.05,
                tension: 300,
                friction: 10,
                useNativeDriver: true,
              }),
              Animated.timing(cardAnimations[index].rotate, {
                toValue: 1,
                duration: 200,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.spring(cardAnimations[index].scale, {
                toValue: 1,
                tension: 300,
                friction: 10,
                useNativeDriver: true,
              }),
              Animated.timing(cardAnimations[index].rotate, {
                toValue: 0,
                duration: 200,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        }, index * 100);
      });
    };

    // Start the wave animation
    createWave();
    
    // Repeat the wave animation
    animationRef.current = setInterval(() => {
      createWave();
    }, animateInterval);
  };

  const handleCardPress = (index: number) => {
    // Individual card press animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(cardAnimations[index].scale, {
          toValue: 0.95,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(cardAnimations[index].rotate, {
          toValue: 2,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(cardAnimations[index].scale, {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(cardAnimations[index].rotate, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  if (stats.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.cardsGrid}>
        {stats.map((stat, index) => {
          const rotateInterpolate = cardAnimations[index].rotate.interpolate({
            inputRange: [0, 1, 2],
            outputRange: ['0deg', '2deg', '4deg'],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.cardWrapper,
                {
                  opacity: cardAnimations[index].opacity,
                  transform: [
                    { scale: cardAnimations[index].scale },
                    { translateY: cardAnimations[index].translateY },
                    { rotate: rotateInterpolate },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => handleCardPress(index)}
                activeOpacity={0.9}
                style={styles.cardTouchable}
              >
                <LinearGradient
                  colors={stat.gradientColors}
                  style={styles.card}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <View style={styles.iconContainer}>
                        {stat.icon}
                      </View>
                      <Text style={styles.cardTitle}>{stat.title}</Text>
                    </View>
                    <Text style={styles.cardValue}>{stat.value}</Text>
                    <Text style={styles.cardSubtitle}>{stat.subtitle}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 0,
  },
  cardWrapper: {
    width: (screenWidth - 64) / 2, // Two cards per row with gaps
    height: 120,
  },
  cardTouchable: {
    width: '100%',
    height: '100%',
  },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
  },
});

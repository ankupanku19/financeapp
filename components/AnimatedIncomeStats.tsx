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

interface AnimatedIncomeStatsProps {
  stats: StatData[];
  autoRotate?: boolean;
  rotateInterval?: number;
}

export const AnimatedIncomeStats: React.FC<AnimatedIncomeStatsProps> = ({
  stats = [],
  autoRotate = true,
  rotateInterval = 3000,
}) => {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values for each stat card
  const cardAnimations = useRef(
    (stats || []).map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(30),
      scale: new Animated.Value(0.85),
    }))
  ).current;

  // Wave animation for the active card
  const waveAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!stats || stats.length === 0) return;
    
    // Initialize first card as active
    animateToActive(0);
    startWaveAnimation();
    
    if (autoRotate && stats.length > 1) {
      startAutoRotate();
    }

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
      }
    };
  }, [stats, autoRotate, rotateInterval]);

  useEffect(() => {
    animateToActive(activeIndex);
  }, [activeIndex]);

  const startAutoRotate = () => {
    autoRotateRef.current = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % stats.length);
    }, rotateInterval);
  };

  const stopAutoRotate = () => {
    if (autoRotateRef.current) {
      clearInterval(autoRotateRef.current);
      autoRotateRef.current = null;
    }
  };

  const resumeAutoRotate = () => {
    if (autoRotate && stats.length > 1 && !autoRotateRef.current) {
      setTimeout(() => {
        startAutoRotate();
      }, 2000);
    }
  };

  const animateToActive = (index: number) => {
    // First, hide all cards
    stats.forEach((_, i) => {
      if (i !== index) {
        Animated.parallel([
          Animated.timing(cardAnimations[i].opacity, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(cardAnimations[i].scale, {
            toValue: 0.85,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(cardAnimations[i].translateY, {
            toValue: 30,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
      }
    });

    // Then animate the active card jumping from back to front
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(cardAnimations[index].opacity, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(cardAnimations[index].scale, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(cardAnimations[index].translateY, {
          toValue: 0,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 100);
  };

  const startWaveAnimation = () => {
    const wave = () => {
      Animated.sequence([
        Animated.timing(waveAnimation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnimation, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => wave());
    };
    wave();
  };

  const handleCardPress = (index: number) => {
    if (index === activeIndex) return;
    
    stopAutoRotate();
    setActiveIndex(index);
    resumeAutoRotate();
  };

  const getCardStyle = (index: number) => {
    const isActive = index === activeIndex;

    return {
      opacity: cardAnimations[index].opacity,
      transform: [
        { translateY: cardAnimations[index].translateY },
        { scale: cardAnimations[index].scale },
      ],
      zIndex: isActive ? 10 : 1,
    };
  };

  const getWaveStyle = () => {
    const translateX = waveAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [-screenWidth, screenWidth],
    });

    return {
      transform: [{ translateX }],
    };
  };

  if (stats.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.cardsContainer}>
        {stats.map((stat, index) => {
          const isActive = index === activeIndex;
          
          return (
            <Animated.View
              key={index}
              style={[styles.cardWrapper, getCardStyle(index)]}
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
                  {/* Wave effect for active card */}
                  {isActive && (
                    <Animated.View style={[styles.waveOverlay, getWaveStyle()]}>
                      <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.2)', 'transparent']}
                        style={styles.wave}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    </Animated.View>
                  )}

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

      {/* Navigation Dots */}
      <View style={styles.dotsContainer}>
        {stats.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === activeIndex
                  ? theme.colors.primary[500] || '#6366F1'
                  : theme.colors.text.tertiary || '#9CA3AF',
                transform: [{ scale: index === activeIndex ? 1.2 : 1 }],
              },
            ]}
            onPress={() => handleCardPress(index)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  cardsContainer: {
    width: screenWidth - 40,
    height: 120,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  cardWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
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
  waveOverlay: {
    position: 'absolute',
    top: 0,
    left: -screenWidth,
    right: -screenWidth,
    bottom: 0,
    zIndex: 1,
  },
  wave: {
    flex: 1,
    width: screenWidth * 2,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s ease',
  },
});

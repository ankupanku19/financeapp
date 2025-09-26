import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  gradientColors: [string, string];
}

interface AnimatedStatCardsProps {
  cards: StatCard[];
  autoplay?: boolean;
}

export const AnimatedStatCards: React.FC<AnimatedStatCardsProps> = ({
  cards,
  autoplay = false,
}) => {
  const { theme } = useTheme();
  const [active, setActive] = useState(0);

  const handleNext = () => {
    setActive((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const isActive = (index: number) => {
    return index === active;
  };

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(handleNext, 5000);
      return () => clearInterval(interval);
    }
  }, [autoplay]);

  const randomRotateY = () => {
    return Math.floor(Math.random() * 21) - 10;
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {/* Cards Stack */}
        <View style={styles.cardsContainer}>
          <View style={styles.cardsStack}>
            {cards.map((card, index) => {
              const isCurrentActive = isActive(index);
              const isNext = (active + 1) % cards.length === index;
              const isPrev = (active - 1 + cards.length) % cards.length === index;
              const isVisible = isCurrentActive || isNext || isPrev;
              
              const animatedOpacity = new Animated.Value(
                isCurrentActive ? 1 : isVisible ? 0.6 : 0
              );
              const animatedScale = new Animated.Value(
                isCurrentActive ? 1 : isVisible ? 0.9 : 0.8
              );
              
              Animated.parallel([
                Animated.timing(animatedOpacity, {
                  toValue: isCurrentActive ? 1 : isVisible ? 0.6 : 0,
                  duration: 400,
                  useNativeDriver: true,
                }),
                Animated.timing(animatedScale, {
                  toValue: isCurrentActive ? 1 : isVisible ? 0.9 : 0.8,
                  duration: 400,
                  useNativeDriver: true,
                }),
              ]).start();

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.cardWrapper,
                    {
                      opacity: animatedOpacity,
                      transform: [{ scale: animatedScale }],
                      zIndex: isCurrentActive ? 40 : isVisible ? 20 : cards.length + 2 - index,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={card.gradientColors}
                    style={styles.card}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                          {card.icon}
                        </View>
                        <Text style={styles.cardTitle}>{card.title}</Text>
                      </View>
                      
                      <View style={styles.cardBody}>
                        <Text style={styles.cardValue}>{card.value}</Text>
                        <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Content Side */}
        <View style={styles.contentContainer}>
          <View style={styles.textContent}>
            <Text style={[styles.activeTitle, { color: theme.colors.text.primary }]}>
              {cards[active]?.title}
            </Text>
            <Text style={[styles.activeSubtitle, { color: theme.colors.text.secondary }]}>
              {cards[active]?.subtitle}
            </Text>
            <Text style={[styles.activeValue, { color: theme.colors.text.primary }]}>
              {cards[active]?.value}
            </Text>
          </View>
          
          <View style={styles.navigationContainer}>
            <View style={styles.navigation}>
              <TouchableOpacity
                style={[styles.navButton, { backgroundColor: theme.colors.background.secondary }]}
                onPress={handlePrev}
              >
                <ChevronLeft size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, { backgroundColor: theme.colors.background.secondary }]}
                onPress={handleNext}
              >
                <ChevronRight size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dotsContainer}>
              {cards.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: index === active 
                        ? theme.colors.primary[500] || '#6366F1'
                        : theme.colors.text.tertiary || '#9CA3AF',
                    },
                  ]}
                  onPress={() => setActive(index)}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: screenWidth,
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontFamily: 'System',
  },
  grid: {
    position: 'relative',
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
  },
  cardsContainer: {
    flex: 1.2,
  },
  cardsStack: {
    position: 'relative',
    height: 180,
    width: '100%',
  },
  cardWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    height: '100%',
    width: '100%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  cardBody: {
    alignItems: 'flex-start',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  contentContainer: {
    flex: 0.8,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingLeft: 16,
  },
  textContent: {
    marginBottom: 24,
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activeSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  activeValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  navigationContainer: {
    alignItems: 'center',
  },
  navigation: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  navButton: {
    height: 28,
    width: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
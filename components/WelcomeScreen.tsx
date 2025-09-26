import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.content}>
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>
            Your journey to financial freedom starts here
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>📱</Text>
            <Text style={styles.featureText}>Track income & expenses</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>🎯</Text>
            <Text style={styles.featureText}>Set financial goals</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>📊</Text>
            <Text style={styles.featureText}>AI-powered insights</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>🔔</Text>
            <Text style={styles.featureText}>Smart notifications</Text>
          </View>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={onGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 26,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 60,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
    fontWeight: '500',
  },
  getStartedButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#007AFF',
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
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});

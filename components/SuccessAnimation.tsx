import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle } from 'lucide-react-native';

interface SuccessAnimationProps {
  visible: boolean;
  message: string;
  onComplete: () => void;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  visible,
  message,
  onComplete,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const checkScaleAnim = useRef(new Animated.Value(0)).current;
  const messageOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset all animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      checkScaleAnim.setValue(0);
      messageOpacityAnim.setValue(0);

      // Start the animation sequence
      Animated.sequence([
        // Initial scale and opacity
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // Check mark animation
        Animated.timing(checkScaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Message fade in
        Animated.timing(messageOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 2 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Background Circle */}
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.backgroundCircle}
          >
            {/* Check Mark */}
            <Animated.View
              style={[
                styles.checkContainer,
                {
                  transform: [{ scale: checkScaleAnim }],
                },
              ]}
            >
              <CheckCircle size={60} color="#FFFFFF" />
            </Animated.View>
          </LinearGradient>

          {/* Success Message */}
          <Animated.View
            style={[
              styles.messageContainer,
              {
                opacity: messageOpacityAnim,
              },
            ]}
          >
            <Text style={styles.message}>{message}</Text>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  checkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

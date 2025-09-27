import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail, RefreshCw, Check } from 'lucide-react-native';
import { useToast } from '@/contexts/ToastContext';

const { width: screenWidth } = Dimensions.get('window');

export default function OTPVerificationScreen() {
  const { email, flow } = useLocalSearchParams<{ email: string; flow: string }>();
  const toast = useToast();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOTPChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://financeapp-77na.onrender.com/api'}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: otpString, flow }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed');
      }

      // Show success state
      setIsVerified(true);
      setIsLoading(false);

      // Wait a moment to show the success state, then navigate
      setTimeout(() => {
        if (flow === 'register') {
          console.log('OTP Verified - Full response:', data);
          console.log('OTP Verified - Navigating with tempToken:', data.data?.tempToken ? 'Present' : 'Missing');
          router.push({
            pathname: '/(auth)/complete-profile',
            params: { email, tempToken: data.data?.tempToken }
          });
        } else {
          // Handle other flows like password reset
          router.push('/(tabs)');
        }
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || 'Verification failed. Please try again.');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setIsResending(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://financeapp-77na.onrender.com/api'}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, flow }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }

      toast.success('A new verification code has been sent to your email');
      
      // Reset timer
      setTimer(60);
      setCanResend(false);
      
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {/* Icon and Title */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.iconGradient}
          >
            <Mail size={32} color="#FFFFFF" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit verification code to{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
              ]}
              value={digit}
              onChangeText={(value) => handleOTPChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, (isLoading || isVerified) && styles.disabledButton]}
          onPress={handleVerifyOTP}
          disabled={isLoading || isVerified}
        >
          <LinearGradient
            colors={
              isVerified 
                ? ['#10B981', '#059669'] 
                : isLoading 
                  ? ['#9CA3AF', '#9CA3AF'] 
                  : ['#6366F1', '#8B5CF6']
            }
            style={styles.buttonGradient}
          >
            {isVerified ? (
              <View style={styles.successContainer}>
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.verifyButtonText}>Verified!</Text>
              </View>
            ) : isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={[styles.verifyButtonText, { marginLeft: 8 }]}>Verifying...</Text>
              </View>
            ) : (
              <Text style={styles.verifyButtonText}>Verify Code</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Resend Section */}
        <View style={styles.resendSection}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          
          {canResend ? (
            <TouchableOpacity 
              onPress={handleResendOTP}
              disabled={isResending}
              style={styles.resendButton}
            >
              <View style={styles.resendButtonContent}>
                {isResending ? (
                  <ActivityIndicator size="small" color="#6366F1" />
                ) : (
                  <RefreshCw size={16} color="#6366F1" />
                )}
                <Text style={styles.resendButtonText}>
                  {isResending ? 'Sending...' : 'Resend Code'}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>
              Resend in {formatTime(timer)}
            </Text>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF', // Match login/register background
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  email: {
    fontWeight: '600',
    color: '#6366F1',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 40,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: screenWidth < 375 ? 12 : screenWidth < 414 ? 14 : 16,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  otpInputFilled: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  verifyButton: {
    width: '100%',
    borderRadius: screenWidth < 375 ? 16 : screenWidth < 414 ? 18 : 20,
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#6366F1',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  disabledButton: {
    shadowOpacity: 0.1,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendSection: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
});

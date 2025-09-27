import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function RegisterScreen() {
  const { register, isLoading } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [hasValidationFailed, setHasValidationFailed] = useState(false);

  // Enhanced animation values for sophisticated micro-interactions
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonShimmer = useRef(new Animated.Value(-1)).current;
  const emailFocusAnim = useRef(new Animated.Value(0)).current;
  const passwordFocusAnim = useRef(new Animated.Value(0)).current;
  const confirmPasswordFocusAnim = useRef(new Animated.Value(0)).current;
  const errorShakeAnim = useRef(new Animated.Value(0)).current;

  // Responsive design calculations
  const getResponsiveValues = () => {
    if (screenWidth < 375) {
      return {
        titleSize: 28,
        subtitleSize: 14,
        inputPadding: 14,
        spacing: 16,
        borderRadius: 12,
      };
    } else if (screenWidth < 414) {
      return {
        titleSize: 32,
        subtitleSize: 16,
        inputPadding: 16,
        spacing: 20,
        borderRadius: 14,
      };
    } else {
      return {
        titleSize: 36,
        subtitleSize: 18,
        inputPadding: 18,
        spacing: 24,
        borderRadius: 16,
      };
    }
  };

  const responsive = getResponsiveValues();

  // Initialize label positions based on existing values
  useEffect(() => {
    if (email.length > 0) {
      emailFocusAnim.setValue(1);
    }
    if (password.length > 0) {
      passwordFocusAnim.setValue(1);
    }
    if (confirmPassword.length > 0) {
      confirmPasswordFocusAnim.setValue(1);
    }
  }, []);

  useEffect(() => {
    // Sophisticated entrance animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
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
      ]),
    ]).start();

    // Slower diagonal shimmer animation when not loading
    const shimmerAnimation = Animated.loop(
      Animated.timing(buttonShimmer, {
        toValue: 1,
        duration: 3500, // Slower
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );

    if (!isLoading) {
      shimmerAnimation.start();
    }

    return () => shimmerAnimation.stop();
  }, [isLoading]);

  // Enhanced form validation with error animations
  const validateForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);

    // Show toast for errors instead of inline display
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      setHasValidationFailed(true); // Mark that validation has failed

      // Shake animation for errors
      Animated.sequence([
        Animated.timing(errorShakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(errorShakeAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(errorShakeAnim, {
          toValue: 5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(errorShakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      setHasValidationFailed(false); // Reset validation failed state
    }

    return Object.keys(newErrors).length === 0;
  };

  // Enhanced input focus animations
  const handleInputFocus = (inputType: 'email' | 'password' | 'confirmPassword') => {
    setFocusedInput(inputType);
    let animValue;
    switch (inputType) {
      case 'email':
        animValue = emailFocusAnim;
        break;
      case 'password':
        animValue = passwordFocusAnim;
        break;
      case 'confirmPassword':
        animValue = confirmPasswordFocusAnim;
        break;
    }

    Animated.timing(animValue, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const handleInputBlur = (inputType: 'email' | 'password' | 'confirmPassword') => {
    setFocusedInput(null);
    let animValue;
    let hasValue;
    switch (inputType) {
      case 'email':
        animValue = emailFocusAnim;
        hasValue = email.length > 0;
        break;
      case 'password':
        animValue = passwordFocusAnim;
        hasValue = password.length > 0;
        break;
      case 'confirmPassword':
        animValue = confirmPasswordFocusAnim;
        hasValue = confirmPassword.length > 0;
        break;
    }

    // Only animate down if there's no value
    if (!hasValue) {
      Animated.timing(animValue, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    // Sophisticated button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.96,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 100,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await register(email, password);
      toast.success('Account Created! Welcome!');
      router.replace('/(tabs)');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.');
    }
  };

  // Rocket-themed Animated Doodle (similar to login but different character)
  const RocketDoodle = () => {
    const floatAnim = useRef(new Animated.Value(0)).current;
    const blinkAnim = useRef(new Animated.Value(1)).current;
    const particle1 = useRef(new Animated.Value(0)).current;
    const particle2 = useRef(new Animated.Value(0)).current;
    const particle3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      // Floating animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Blinking animation
      Animated.loop(
        Animated.sequence([
          Animated.delay(2000),
          Animated.timing(blinkAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Particle animations
      [particle1, particle2, particle3].forEach((particle, index) => {
        Animated.loop(
          Animated.timing(particle, {
            toValue: 1,
            duration: 4000 + index * 500,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start();
      });
    }, []);

    const translateY = floatAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -15],
    });

    return (
      <View style={styles.doodleContainer}>
        {/* Floating particles */}
        <Animated.View
          style={[
            styles.particle,
            styles.particle1,
            {
              transform: [
                {
                  translateY: particle1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, -20],
                  }),
                },
                {
                  translateX: particle1.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 15, -5],
                  }),
                },
              ],
              opacity: particle1.interpolate({
                inputRange: [0, 0.2, 0.8, 1],
                outputRange: [0, 1, 1, 0],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            styles.particle2,
            {
              transform: [
                {
                  translateY: particle2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [80, -30],
                  }),
                },
                {
                  translateX: particle2.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, -10, 20],
                  }),
                },
              ],
              opacity: particle2.interpolate({
                inputRange: [0, 0.3, 0.7, 1],
                outputRange: [0, 1, 1, 0],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            styles.particle3,
            {
              transform: [
                {
                  translateY: particle3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [90, -25],
                  }),
                },
                {
                  translateX: particle3.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, -20, 10],
                  }),
                },
              ],
              opacity: particle3.interpolate({
                inputRange: [0, 0.4, 0.6, 1],
                outputRange: [0, 1, 1, 0],
              }),
            },
          ]}
        />

        {/* Main character - Rocket */}
        <Animated.View
          style={[
            styles.character,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Rocket body */}
          <View style={styles.rocketBody}>
            {/* Window */}
            <Animated.View style={[styles.window, { scaleY: blinkAnim }]} />
            {/* Fins */}
            <View style={styles.fin1} />
            <View style={styles.fin2} />
          </View>
          {/* Rocket tip */}
          <View style={styles.rocketTip} />
          {/* Flame */}
          <View style={styles.flame} />
        </Animated.View>
      </View>
    );
  };

  // Enhanced Loading Spinner
  const CustomLoadingSpinner = () => {
    const spinValue = useRef(new Animated.Value(0)).current;
    const pulseValue = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.loop(
          Animated.timing(spinValue, {
            toValue: 1,
            duration: 1200,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseValue, {
              toValue: 1.1,
              duration: 600,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(pulseValue, {
              toValue: 1,
              duration: 600,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }, []);

    const spin = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View
        style={{
          width: 22,
          height: 22,
          borderWidth: 2.5,
          borderColor: 'rgba(255, 255, 255, 0.3)',
          borderTopColor: '#FFFFFF',
          borderRightColor: '#FFFFFF',
          borderRadius: 11,
          transform: [{ rotate: spin }, { scale: pulseValue }],
        }}
      />
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                  { translateX: errorShakeAnim },
                ],
              },
            ]}
          >
            {/* Creative Header with Animated Doodle */}
            <View style={styles.header}>
              <RocketDoodle />
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { fontSize: responsive.titleSize }]}>
                  Start Your Journey
                </Text>
                <View style={styles.titleUnderline} />
              </View>
              <Text style={[styles.subtitle, { fontSize: responsive.subtitleSize }]}>
                Create your account and take control of your finances
              </Text>
            </View>

            {/* Enhanced Form */}
            <View style={styles.form}>
              {/* Email Input with Floating Label */}
              <Animated.View
                style={[
                  styles.inputGroup,
                  {
                    borderColor: (hasValidationFailed && errors.email)
                      ? '#EF4444'
                      : emailFocusAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['#E5E7EB', '#6366F1'],
                        }),
                    borderWidth: (hasValidationFailed && errors.email)
                      ? 2
                      : emailFocusAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 2],
                        }),
                    backgroundColor: (hasValidationFailed && errors.email)
                      ? '#FEF2F2'
                      : emailFocusAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['#FFFFFF', '#FAFBFF'],
                        }),
                  }
                ]}
              >
                <Animated.Text
                  style={[
                    styles.floatingLabel,
                    {
                      fontSize: emailFocusAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [16, 12],
                      }),
                      top: emailFocusAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [responsive.inputPadding, -8],
                      }),
                      color: emailFocusAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['#9CA3AF', '#6366F1'],
                      }),
                    }
                  ]}
                >
                  Email Address
                </Animated.Text>
                <TextInput
                  style={[
                    styles.modernInput,
                    {
                      paddingVertical: responsive.inputPadding,
                      fontSize: responsive.subtitleSize,
                    },
                  ]}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: undefined }));
                    }
                    if (hasValidationFailed) {
                      setHasValidationFailed(false);
                    }
                  }}
                  onFocus={() => handleInputFocus('email')}
                  onBlur={() => handleInputBlur('email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  selectionColor="#6366F1"
                />
              </Animated.View>

              {/* Password Input with Toggle */}
              <Animated.View
                style={[
                  styles.inputGroup,
                  {
                    borderColor: (hasValidationFailed && errors.password)
                      ? '#EF4444'
                      : passwordFocusAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['#E5E7EB', '#6366F1'],
                        }),
                    borderWidth: (hasValidationFailed && errors.password)
                      ? 2
                      : passwordFocusAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 2],
                        }),
                    backgroundColor: (hasValidationFailed && errors.password)
                      ? '#FEF2F2'
                      : passwordFocusAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['#FFFFFF', '#FAFBFF'],
                        }),
                  }
                ]}
              >
                <Animated.Text
                  style={[
                    styles.floatingLabel,
                    {
                      fontSize: passwordFocusAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [16, 12],
                      }),
                      top: passwordFocusAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [responsive.inputPadding, -8],
                      }),
                      color: passwordFocusAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['#9CA3AF', '#6366F1'],
                      }),
                    }
                  ]}
                >
                  Password
                </Animated.Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.modernInput,
                      styles.passwordInput,
                      {
                        paddingVertical: responsive.inputPadding,
                        fontSize: responsive.subtitleSize,
                      },
                    ]}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) {
                        setErrors(prev => ({ ...prev, password: undefined }));
                      }
                      if (hasValidationFailed) {
                        setHasValidationFailed(false);
                      }
                    }}
                    onFocus={() => handleInputFocus('password')}
                    onBlur={() => handleInputBlur('password')}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    selectionColor="#6366F1"
                  />
                  {/* Custom Password Toggle */}
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.toggleContainer}>
                      <Text style={styles.toggleText}>
                        {showPassword ? 'HIDE' : 'SHOW'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Confirm Password Input with Toggle */}
              <Animated.View
                style={[
                  styles.inputGroup,
                  {
                    borderColor: (hasValidationFailed && errors.confirmPassword)
                      ? '#EF4444'
                      : confirmPasswordFocusAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['#E5E7EB', '#6366F1'],
                        }),
                    borderWidth: (hasValidationFailed && errors.confirmPassword)
                      ? 2
                      : confirmPasswordFocusAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 2],
                        }),
                    backgroundColor: (hasValidationFailed && errors.confirmPassword)
                      ? '#FEF2F2'
                      : confirmPasswordFocusAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['#FFFFFF', '#FAFBFF'],
                        }),
                  }
                ]}
              >
                <Animated.Text
                  style={[
                    styles.floatingLabel,
                    {
                      fontSize: confirmPasswordFocusAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [16, 12],
                      }),
                      top: confirmPasswordFocusAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [responsive.inputPadding, -8],
                      }),
                      color: confirmPasswordFocusAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['#9CA3AF', '#6366F1'],
                      }),
                    }
                  ]}
                >
                  Confirm Password
                </Animated.Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.modernInput,
                      styles.passwordInput,
                      {
                        paddingVertical: responsive.inputPadding,
                        fontSize: responsive.subtitleSize,
                      },
                    ]}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword) {
                        setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                      }
                      if (hasValidationFailed) {
                        setHasValidationFailed(false);
                      }
                    }}
                    onFocus={() => handleInputFocus('confirmPassword')}
                    onBlur={() => handleInputBlur('confirmPassword')}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
                    selectionColor="#6366F1"
                  />
                  {/* Custom Password Toggle */}
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.toggleContainer}>
                      <Text style={styles.toggleText}>
                        {showConfirmPassword ? 'HIDE' : 'SHOW'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Enhanced Button with Shimmer */}
              <Animated.View
                style={{
                  transform: [{ scale: buttonScale }],
                  marginTop: responsive.spacing,
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.registerButton,
                    {
                      borderRadius: responsive.borderRadius,
                      paddingVertical: responsive.inputPadding,
                    },
                    isLoading && styles.disabledButton,
                  ]}
                  onPress={handleRegister}
                  disabled={isLoading}
                  activeOpacity={0.9}
                >
                  {/* Enhanced Diagonal Shimmer Effect */}
                  {!isLoading && (
                    <Animated.View
                      style={[
                        styles.shimmer,
                        {
                          transform: [
                            {
                              translateX: buttonShimmer.interpolate({
                                inputRange: [-1, 1],
                                outputRange: [-screenWidth * 1.5, screenWidth * 1.5],
                              }),
                            },
                            {
                              translateY: buttonShimmer.interpolate({
                                inputRange: [-1, 1],
                                outputRange: [-50, 50],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  )}

                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <CustomLoadingSpinner />
                      <Text style={[styles.registerButtonText, { marginLeft: 12 }]}>
                        Creating Account...
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.registerButtonText, { fontSize: responsive.subtitleSize }]}>
                      Create Account
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign Up Button */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={() => toast.info('Google authentication coming soon!')}
                activeOpacity={0.9}
              >
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>
            </View>

            {/* Enhanced Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { fontSize: responsive.subtitleSize - 2 }]}>
                Already have an account?{' '}
              </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={[styles.linkText, { fontSize: responsive.subtitleSize - 2 }]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

// Creative, unique styles with perfect border radius consistency (matching login)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF', // Softer background
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: screenWidth < 375 ? 16 : screenWidth < 414 ? 20 : 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: screenHeight < 700 ? 24 : screenHeight < 800 ? 32 : 40,
  },

  // Animated Doodle Character Styles
  doodleContainer: {
    height: 120,
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  character: {
    alignItems: 'center',
  },
  rocketBody: {
    width: 40,
    height: 60,
    backgroundColor: '#6366F1',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  window: {
    width: 16,
    height: 16,
    backgroundColor: '#E0E7FF',
    borderRadius: 8,
    position: 'absolute',
    top: 15,
  },
  fin1: {
    position: 'absolute',
    left: -8,
    bottom: 5,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderBottomColor: '#4F46E5',
  },
  fin2: {
    position: 'absolute',
    right: -8,
    bottom: 5,
    width: 0,
    height: 0,
    borderLeftWidth: 0,
    borderRightWidth: 8,
    borderBottomWidth: 20,
    borderRightColor: 'transparent',
    borderBottomColor: '#4F46E5',
  },
  rocketTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#6366F1',
    position: 'absolute',
    top: -30,
  },
  flame: {
    position: 'absolute',
    bottom: -20,
    width: 20,
    height: 20,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  particle1: {
    backgroundColor: '#FF6B9D',
    left: 20,
  },
  particle2: {
    backgroundColor: '#4ECDC4',
    right: 25,
  },
  particle3: {
    backgroundColor: '#FFE66D',
    left: 70,
  },

  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 8,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  titleUnderline: {
    width: 50,
    height: 4,
    backgroundColor: '#6366F1',
    borderRadius: 2,
    marginTop: 6,
  },
  subtitle: {
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: screenWidth < 375 ? 16 : screenWidth < 414 ? 18 : 20, // Match container
    position: 'relative',
    shadowColor: '#6366F1',
    shadowRadius: 12,
    shadowOpacity: 0.08,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  floatingLabel: {
    position: 'absolute',
    left: 16,
    backgroundColor: '#FAFBFF',
    paddingHorizontal: 4,
    fontWeight: '600',
    zIndex: 1,
  },
  modernInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
    paddingHorizontal: 20,
    color: '#1E293B',
    fontWeight: '600',
    letterSpacing: -0.2,
    borderRadius: screenWidth < 375 ? 16 : screenWidth < 414 ? 18 : 20, // Match container
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 70,
  },
  passwordToggle: {
    position: 'absolute',
    right: 20,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  toggleContainer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  toggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 1,
  },
  registerButton: {
    backgroundColor: '#6366F1',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    borderRadius: screenWidth < 375 ? 16 : screenWidth < 414 ? 18 : 20, // Match input
  },
  shimmer: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: 120,
    height: 120,
    borderRadius: 60,
    transform: [{ rotate: '45deg' }],
  },
  disabledButton: {
    opacity: 0.6,
    shadowOpacity: 0.15,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Divider Styles
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },

  // Google Button Styles
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: screenWidth < 375 ? 16 : screenWidth < 414 ? 18 : 20,
    paddingVertical: screenWidth < 375 ? 14 : screenWidth < 414 ? 16 : 18,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#6366F1',
    shadowRadius: 8,
    shadowOpacity: 0.05,
    elevation: 3,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  googleButtonText: {
    color: '#374151',
    fontSize: screenWidth < 375 ? 15 : screenWidth < 414 ? 16 : 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  linkText: {
    color: '#6366F1',
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
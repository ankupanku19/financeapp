import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, User, Camera, RefreshCw } from 'lucide-react-native';

const AVATAR_OPTIONS = [
  { id: 'avatar1', url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Felix&backgroundColor=b6e3f4' },
  { id: 'avatar2', url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka&backgroundColor=c0aede' },
  { id: 'avatar3', url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Bob&backgroundColor=d1d4f9' },
  { id: 'avatar4', url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Alice&backgroundColor=fecaca' },
  { id: 'avatar5', url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Charlie&backgroundColor=fed7aa' },
  { id: 'avatar6', url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Diana&backgroundColor=86efac' },
];

export default function AvatarSetupScreen() {
  const { tempToken } = useLocalSearchParams<{ tempToken: string }>();

  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Select first avatar by default
    setSelectedAvatar(AVATAR_OPTIONS[0].id);
  }, []);

  const handleContinue = async () => {
    if (!selectedAvatar) {
      Alert.alert('Please select an avatar');
      return;
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (!tempToken) {
      Alert.alert('Error', 'No authentication token found. Please try again.');
      return;
    }

    try {
      setIsLoading(true);

      const selectedAvatarData = AVATAR_OPTIONS.find(a => a.id === selectedAvatar);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://financeapp-77na.onrender.com/api'}/auth/set-avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`,
        },
        body: JSON.stringify({
          avatarUrl: selectedAvatarData?.url,
          avatarType: 'generated',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set avatar');
      }

      // Navigate to finance questions
      router.push({
        pathname: '/(auth)/finance-questions',
        params: { tempToken: data.data?.tempToken }
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to set avatar');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const colors = ['b6e3f4', 'c0aede', 'd1d4f9', 'fecaca', 'fed7aa', '86efac'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    return {
      id: `avatar_${randomSeed}`,
      url: `https://api.dicebear.com/7.x/avataaars/png?seed=${randomSeed}&backgroundColor=${randomColor}`
    };
  };

  const handleGenerateNew = () => {
    const newAvatar = generateNewAvatar();
    // Replace the last avatar with the new one
    AVATAR_OPTIONS[AVATAR_OPTIONS.length - 1] = newAvatar;
    setSelectedAvatar(newAvatar.id);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Avatar</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
          <Text style={styles.title}>Pick your avatar</Text>
          <Text style={styles.subtitle}>
            Choose an avatar that represents you
          </Text>

          {/* Avatar Grid */}
          <View style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((avatar) => (
              <TouchableOpacity
                key={avatar.id}
                style={[
                  styles.avatarOption,
                  selectedAvatar === avatar.id && styles.avatarOptionSelected,
                ]}
                onPress={() => setSelectedAvatar(avatar.id)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: avatar.url }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
                {selectedAvatar === avatar.id && (
                  <View style={styles.selectedIndicator}>
                    <User size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Generate New Button */}
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateNew}
            activeOpacity={0.7}
          >
            <RefreshCw size={20} color="#6366F1" />
            <Text style={styles.generateButtonText}>Generate New</Text>
          </TouchableOpacity>

          {/* Continue Button */}
          <Animated.View
            style={{
              transform: [{ scale: buttonScale }],
            }}
          >
            <TouchableOpacity
              style={[styles.continueButton, isLoading && styles.disabledButton]}
              onPress={handleContinue}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={[styles.continueButtonText, { marginLeft: 8 }]}>Setting Avatar...</Text>
                </View>
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  avatarOption: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarOptionSelected: {
    borderColor: '#6366F1',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  continueButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
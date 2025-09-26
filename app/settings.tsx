import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  Switch,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeArea } from '@/constants/SafeArea';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { Moon, Sun, Monitor, Bell, ChevronRight, ArrowLeft, Settings as SettingsIcon, Globe, Palette, Save } from 'lucide-react-native';
import { apiService } from '@/services/api';

const { width: screenWidth } = Dimensions.get('window');

export default function SettingsScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { headerWithSafeArea } = useSafeArea();
  const { user } = useAuth();
  
  // State
  const [currency, setCurrency] = useState(user?.preferences?.currency || 'USD');
  const [language, setLanguage] = useState(user?.preferences?.language || 'en');
  const [timezone, setTimezone] = useState(user?.preferences?.timezone || 'UTC');
  const [saving, setSaving] = useState(false);

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
  }, []);

  const saveSettings = async () => {
    try {
      setSaving(true);
      const preferences = {
        currency,
        language,
        timezone,
        notifications: {
          email: emailNotif,
          push: pushNotif,
          weekly_summary: weeklySummary,
          goal_reminders: goalReminders,
          budget_alerts: budgetAlerts,
        },
      };
      await apiService.updatePreferences(preferences);
      Alert.alert('Success', 'Settings saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'dark':
        return <Moon size={20} color="#FFFFFF" />;
      case 'light':
        return <Sun size={20} color="#FFFFFF" />;
      case 'system':
      default:
        return <Monitor size={20} color="#FFFFFF" />;
    }
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'dark':
        return 'Dark';
      case 'light':
        return 'Light';
      case 'system':
      default:
        return 'System';
    }
  };

  const cycleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light';
    setThemeMode(next as any);
  };

  const SettingCard = ({ 
    children, 
    index = 0 
  }: { 
    children: React.ReactNode; 
    index?: number;
  }) => {
    const cardAnimValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const timer = setTimeout(() => {
        Animated.timing(cardAnimValue, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      }, index * 100);

      return () => clearTimeout(timer);
    }, [index]);

    return (
      <Animated.View
        style={[
          styles.settingCard,
          { backgroundColor: theme.colors.background.primary },
          {
            opacity: cardAnimValue,
            transform: [
              {
                translateY: cardAnimValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    );
  };

  const SettingRow = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    subtitle?: string; 
    onPress?: () => void; 
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={styles.settingRow} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: theme.colors.primary[100] }]}>
          {React.cloneElement(icon as React.ReactElement, {
            size: 20,
            color: theme.colors.primary[600],
          })}
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: theme.colors.text.secondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightComponent || (onPress && (
        <ChevronRight size={16} color={theme.colors.text.tertiary} />
      ))}
    </TouchableOpacity>
  );

  const InputField = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder 
  }: { 
    label: string; 
    value: string; 
    onChangeText: (text: string) => void; 
    placeholder: string;
  }) => (
    <View style={styles.inputField}>
      <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={[
          styles.textInput,
          {
            backgroundColor: theme.colors.background.secondary,
            borderColor: theme.colors.neutral[300],
            color: theme.colors.text.primary,
          }
        ]}
        placeholderTextColor={theme.colors.text.tertiary}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary[500], theme.colors.primary[600]]}
        style={[styles.header, headerWithSafeArea]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Customize your experience</Text>
          </View>
          <View style={styles.headerIcon}>
            <SettingsIcon size={24} color="rgba(255,255,255,0.6)" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Palette size={18} color={theme.colors.text.secondary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Appearance
            </Text>
          </View>
          
          <SettingCard index={0}>
            <SettingRow
              icon={getThemeIcon()}
              title="Theme"
              subtitle={`Currently using ${getThemeLabel().toLowerCase()} theme`}
              onPress={cycleTheme}
            />
          </SettingCard>
        </Animated.View>

        {/* Preferences Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Globe size={18} color={theme.colors.text.secondary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Preferences
            </Text>
          </View>
          
          <SettingCard index={1}>
            <View style={styles.cardContent}>
              <InputField
                label="Currency"
                value={currency}
                onChangeText={setCurrency}
                placeholder="USD"
              />
              <InputField
                label="Language"
                value={language}
                onChangeText={setLanguage}
                placeholder="en"
              />
              <InputField
                label="Timezone"
                value={timezone}
                onChangeText={setTimezone}
                placeholder="UTC"
              />
            </View>
          </SettingCard>
        </Animated.View>


        {/* Save Button */}
        <Animated.View
          style={[
            styles.saveSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: theme.colors.primary[500] }
            ]}
            onPress={saveSettings}
            disabled={saving}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.colors.primary[500], theme.colors.primary[600]]}
              style={styles.saveButtonGradient}
            >
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  settingCard: {
    borderRadius: 16,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    padding: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputField: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  saveSection: {
    marginTop: 8,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
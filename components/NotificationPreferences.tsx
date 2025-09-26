import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { ArrowLeft, Bell, Mail, Smartphone, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';

interface NotificationPreferencesProps {
  visible: boolean;
  onClose: () => void;
}

interface Preferences {
  channels: {
    email: {
      enabled: boolean;
      frequency: string;
      types: Record<string, boolean>;
    };
    push: {
      enabled: boolean;
      frequency: string;
      types: Record<string, boolean>;
    };
    inApp: {
      enabled: boolean;
      frequency: string;
      types: Record<string, boolean>;
    };
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
}

const NOTIFICATION_TYPES = [
  { key: 'goal_reminder', label: 'Goal Reminders', icon: '🎯' },
  { key: 'goal_achieved', label: 'Goal Achieved', icon: '🎉' },
  { key: 'goal_milestone', label: 'Goal Milestones', icon: '📊' },
  { key: 'income_added', label: 'Income Added', icon: '💵' },
  { key: 'expense_alert', label: 'Expense Alerts', icon: '💰' },
  { key: 'savings_milestone', label: 'Savings Milestones', icon: '💎' },
  { key: 'bill_reminder', label: 'Bill Reminders', icon: '📅' },
  { key: 'security_alert', label: 'Security Alerts', icon: '🔒' },
  { key: 'account_update', label: 'Account Updates', icon: '⚙️' },
  { key: 'marketing', label: 'Marketing', icon: '📢' },
  { key: 'system', label: 'System Notifications', icon: '🔧' },
];

const FREQUENCY_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'daily', label: 'Daily Digest' },
  { value: 'weekly', label: 'Weekly Digest' },
  { value: 'never', label: 'Never' },
];

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  visible,
  onClose,
}) => {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPreferences();
    }
  }, [visible]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotificationPreferences();
      setPreferences(response);
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      await apiService.updateNotificationPreferences(preferences);
      Alert.alert('Success', 'Notification preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const updateChannelEnabled = (channel: string, enabled: boolean) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      channels: {
        ...preferences.channels,
        [channel]: {
          ...preferences.channels[channel as keyof typeof preferences.channels],
          enabled,
        },
      },
    });
  };

  const updateChannelFrequency = (channel: string, frequency: string) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      channels: {
        ...preferences.channels,
        [channel]: {
          ...preferences.channels[channel as keyof typeof preferences.channels],
          frequency,
        },
      },
    });
  };

  const updateTypeEnabled = (channel: string, type: string, enabled: boolean) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      channels: {
        ...preferences.channels,
        [channel]: {
          ...preferences.channels[channel as keyof typeof preferences.channels],
          types: {
            ...preferences.channels[channel as keyof typeof preferences.channels].types,
            [type]: enabled,
          },
        },
      },
    });
  };

  const updateQuietHours = (field: string, value: any) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      quietHours: {
        ...preferences.quietHours,
        [field]: value,
      },
    });
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail size={20} color="#6366F1" />;
      case 'push':
        return <Smartphone size={20} color="#6366F1" />;
      case 'inApp':
        return <Bell size={20} color="#6366F1" />;
      default:
        return <Bell size={20} color="#6366F1" />;
    }
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'email':
        return 'Email Notifications';
      case 'push':
        return 'Push Notifications';
      case 'inApp':
        return 'In-App Notifications';
      default:
        return 'Notifications';
    }
  };

  if (!visible || !preferences) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={savePreferences}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={styles.content}>
          {/* Channel Settings */}
          {Object.keys(preferences.channels).map((channel) => (
            <View key={channel} style={styles.channelSection}>
              <View style={styles.channelHeader}>
                {getChannelIcon(channel)}
                <Text style={styles.channelTitle}>
                  {getChannelLabel(channel)}
                </Text>
                <Switch
                  value={preferences.channels[channel as keyof typeof preferences.channels].enabled}
                  onValueChange={(enabled) => updateChannelEnabled(channel, enabled)}
                  trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {preferences.channels[channel as keyof typeof preferences.channels].enabled && (
                <>
                  {/* Frequency Selection */}
                  <View style={styles.frequencySection}>
                    <Text style={styles.frequencyLabel}>Frequency</Text>
                    <View style={styles.frequencyOptions}>
                      {FREQUENCY_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.frequencyOption,
                            preferences.channels[channel as keyof typeof preferences.channels].frequency === option.value &&
                            styles.frequencyOptionActive,
                          ]}
                          onPress={() => updateChannelFrequency(channel, option.value)}
                        >
                          <Text
                            style={[
                              styles.frequencyOptionText,
                              preferences.channels[channel as keyof typeof preferences.channels].frequency === option.value &&
                              styles.frequencyOptionTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Notification Types */}
                  <View style={styles.typesSection}>
                    <Text style={styles.typesLabel}>Notification Types</Text>
                    {NOTIFICATION_TYPES.map((type) => (
                      <View key={type.key} style={styles.typeItem}>
                        <Text style={styles.typeIcon}>{type.icon}</Text>
                        <Text style={styles.typeLabel}>{type.label}</Text>
                        <Switch
                          value={
                            preferences.channels[channel as keyof typeof preferences.channels].types[type.key] !== false
                          }
                          onValueChange={(enabled) => updateTypeEnabled(channel, type.key, enabled)}
                          trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
                          thumbColor="#FFFFFF"
                        />
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          ))}

          {/* Quiet Hours */}
          <View style={styles.quietHoursSection}>
            <View style={styles.quietHoursHeader}>
              <Clock size={20} color="#6366F1" />
              <Text style={styles.quietHoursTitle}>Quiet Hours</Text>
              <Switch
                value={preferences.quietHours.enabled}
                onValueChange={(enabled) => updateQuietHours('enabled', enabled)}
                trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {preferences.quietHours.enabled && (
              <View style={styles.quietHoursContent}>
                <Text style={styles.quietHoursDescription}>
                  No notifications will be sent during these hours
                </Text>
                
                <View style={styles.timeInputs}>
                  <View style={styles.timeInput}>
                    <Text style={styles.timeLabel}>Start</Text>
                    <TouchableOpacity style={styles.timeButton}>
                      <Text style={styles.timeText}>{preferences.quietHours.start}</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.timeInput}>
                    <Text style={styles.timeLabel}>End</Text>
                    <TouchableOpacity style={styles.timeButton}>
                      <Text style={styles.timeText}>{preferences.quietHours.end}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  channelSection: {
    marginTop: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  channelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  frequencySection: {
    marginBottom: 20,
  },
  frequencyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  frequencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  frequencyOptionActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  frequencyOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  frequencyOptionTextActive: {
    color: '#FFFFFF',
  },
  typesSection: {
    marginTop: 8,
  },
  typesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  typeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  typeLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  quietHoursSection: {
    marginTop: 24,
    paddingBottom: 24,
  },
  quietHoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quietHoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  quietHoursContent: {
    marginTop: 8,
  },
  quietHoursDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  timeInputs: {
    flexDirection: 'row',
    gap: 16,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeText: {
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
  },
});

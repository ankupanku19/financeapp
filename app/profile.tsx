import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeArea } from '@/constants/SafeArea';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit3,
  Camera,
  Shield,
  Key,
  Bell,
  Globe,
  Heart,
  Star,
  Award,
  TrendingUp,
  Target,
  DollarSign,
  LogOut,
  Trash2,
} from 'lucide-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { headerWithSafeArea } = useSafeArea();
  
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Profile stats animation
  const statsAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

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

    // Staggered stats animation
    statsAnimations.forEach((anim, index) => {
      setTimeout(() => {
        Animated.spring(anim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }, 800 + index * 150);
    });
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Handle account deletion
            Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
          },
        },
      ]
    );
  };

  const ProfileStat = ({ icon, value, label, index }: { icon: React.ReactNode; value: string; label: string; index: number }) => (
    <Animated.View
      style={[
        styles.statCard,
        { backgroundColor: theme.colors.background.primary },
        {
          opacity: statsAnimations[index],
          transform: [
            {
              scale: statsAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
            {
              translateY: statsAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: theme.colors.primary[500] }]}>
        {icon}
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>{label}</Text>
    </Animated.View>
  );

  const ProfileOption = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true, 
    danger = false 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    subtitle?: string; 
    onPress: () => void; 
    showArrow?: boolean; 
    danger?: boolean;
  }) => (
    <TouchableOpacity 
      style={[styles.profileOption, { backgroundColor: theme.colors.background.primary }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.optionLeft}>
        <View style={[
          styles.optionIcon, 
          { 
            backgroundColor: danger 
              ? theme.colors.error[100] 
              : theme.colors.primary[100] 
          }
        ]}>
          {React.cloneElement(icon as React.ReactElement, {
            size: 20,
            color: danger ? theme.colors.error[600] : theme.colors.primary[600],
          })}
        </View>
        <View style={styles.optionText}>
          <Text style={[
            styles.optionTitle, 
            { 
              color: danger ? theme.colors.error[600] : theme.colors.text.primary 
            }
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.optionSubtitle, { color: theme.colors.text.secondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {showArrow && (
        <ArrowLeft 
          size={16} 
          color={theme.colors.text.tertiary} 
          style={{ transform: [{ rotate: '180deg' }] }} 
        />
      )}
    </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.editButton}>
            <Edit3 size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Animated.View
          style={[
            styles.profileCard,
            { backgroundColor: theme.colors.background.primary },
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {user?.avatar?.url ? (
                <Image 
                  source={{ uri: user.avatar.url }} 
                  style={styles.avatar}
                  defaultSource={require('@/assets/images/icon.png')}
                />
              ) : (
                <LinearGradient
                  colors={[theme.colors.primary[400], theme.colors.primary[600]]}
                  style={styles.avatar}
                >
                  <User size={40} color="#FFFFFF" />
                </LinearGradient>
              )}
              <TouchableOpacity style={styles.cameraButton}>
                <Camera size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.colors.text.primary }]}>
                {user?.name || 'John Doe'}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.colors.text.secondary }]}>
                {user?.email || 'john.doe@example.com'}
              </Text>
              <View style={styles.profileBadge}>
                <Star size={12} color={theme.colors.warning[500]} />
                <Text style={[styles.badgeText, { color: theme.colors.warning[600] }]}>
                  Premium Member
                </Text>
              </View>
            </View>
          </View>

          {/* Profile Stats */}
          <View style={styles.profileStats}>
            <ProfileStat
              icon={<Target size={20} color="#FFFFFF" />}
              value="12"
              label="Goals"
              index={0}
            />
            <ProfileStat
              icon={<TrendingUp size={20} color="#FFFFFF" />}
              value="8"
              label="Completed"
              index={1}
            />
            <ProfileStat
              icon={<DollarSign size={20} color="#FFFFFF" />}
              value="$24.5K"
              label="Saved"
              index={2}
            />
          </View>
        </Animated.View>

        {/* Personal Information */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Personal Information
          </Text>
          
          <ProfileOption
            icon={<User />}
            title="Edit Profile"
            subtitle="Update your personal details"
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon!')}
          />
          
          <ProfileOption
            icon={<Mail />}
            title="Email Address"
            subtitle={user?.email || 'john.doe@example.com'}
            onPress={() => Alert.alert('Coming Soon', 'Email editing will be available soon!')}
          />
          
          <ProfileOption
            icon={<Phone />}
            title="Phone Number"
            subtitle="Add your phone number"
            onPress={() => Alert.alert('Coming Soon', 'Phone number editing will be available soon!')}
          />
          
          <ProfileOption
            icon={<MapPin />}
            title="Location"
            subtitle="Set your location"
            onPress={() => Alert.alert('Coming Soon', 'Location editing will be available soon!')}
          />
          
          <ProfileOption
            icon={<Calendar />}
            title="Date of Birth"
            subtitle="Add your birthday"
            onPress={() => Alert.alert('Coming Soon', 'Birthday editing will be available soon!')}
          />
        </Animated.View>

        {/* Security & Privacy */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Security & Privacy
          </Text>
          
          <ProfileOption
            icon={<Shield />}
            title="Privacy Settings"
            subtitle="Manage your privacy preferences"
            onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon!')}
          />
          
          <ProfileOption
            icon={<Key />}
            title="Change Password"
            subtitle="Update your account password"
            onPress={() => Alert.alert('Coming Soon', 'Password change will be available soon!')}
          />
          
          <ProfileOption
            icon={<Bell />}
            title="Notification Preferences"
            subtitle="Customize your notifications"
            onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon!')}
          />
        </Animated.View>

        {/* Preferences */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Preferences
          </Text>
          
          <ProfileOption
            icon={<Globe />}
            title="Language & Region"
            subtitle="English (US)"
            onPress={() => Alert.alert('Coming Soon', 'Language settings will be available soon!')}
          />
          
          <ProfileOption
            icon={<Heart />}
            title="Support & Feedback"
            subtitle="Get help or share feedback"
            onPress={() => Alert.alert('Coming Soon', 'Support will be available soon!')}
          />
          
          <ProfileOption
            icon={<Award />}
            title="Achievements"
            subtitle="View your milestones"
            onPress={() => Alert.alert('Coming Soon', 'Achievements will be available soon!')}
          />
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Account Actions
          </Text>
          
          <ProfileOption
            icon={<LogOut />}
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            showArrow={false}
            danger={true}
          />
          
          <ProfileOption
            icon={<Trash2 />}
            title="Delete Account"
            subtitle="Permanently delete your account"
            onPress={handleDeleteAccount}
            showArrow={false}
            danger={true}
          />
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
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
  profileCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  profileStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    borderRadius: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
});

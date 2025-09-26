import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, StatusBar } from 'react-native';
import { isTablet, Spacing } from './Design';

// Safe area hook with enhanced functionality
export const useSafeArea = () => {
  const insets = useSafeAreaInsets();

  // Enhanced safe area values with minimum padding
  const safeArea = {
    top: Math.max(insets.top, Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0),
    bottom: Math.max(insets.bottom, isTablet ? Spacing.lg : Spacing.md),
    left: Math.max(insets.left, Spacing.md),
    right: Math.max(insets.right, Spacing.md),
  };

  // Container styles with safe areas
  const containerWithSafeArea = {
    paddingTop: safeArea.top + Spacing.lg,
    paddingBottom: safeArea.bottom,
    paddingLeft: safeArea.left,
    paddingRight: safeArea.right,
  };

  // Header styles with safe area top
  const headerWithSafeArea = {
    paddingTop: safeArea.top + Spacing.md,
    paddingLeft: safeArea.left + Spacing.lg,
    paddingRight: safeArea.right + Spacing.lg,
    paddingBottom: Spacing.lg,
  };

  // Content styles with safe area (no top for screens with headers)
  const contentWithSafeArea = {
    paddingLeft: safeArea.left + Spacing.lg,
    paddingRight: safeArea.right + Spacing.lg,
    paddingBottom: safeArea.bottom + Spacing.md,
  };

  // Tab bar styles with safe area bottom
  const tabBarWithSafeArea = {
    paddingBottom: safeArea.bottom,
    paddingLeft: safeArea.left,
    paddingRight: safeArea.right,
  };

  // Modal styles with safe areas
  const modalWithSafeArea = {
    paddingTop: safeArea.top + Spacing.xl,
    paddingBottom: safeArea.bottom + Spacing.xl,
    paddingLeft: safeArea.left + Spacing.lg,
    paddingRight: safeArea.right + Spacing.lg,
  };

  // Floating action button positioning
  const fabPosition = {
    bottom: safeArea.bottom + Spacing['3xl'] + (Platform.OS === 'ios' ? 20 : 16),
    right: safeArea.right + Spacing.lg,
  };

  return {
    insets: safeArea,
    containerWithSafeArea,
    headerWithSafeArea,
    contentWithSafeArea,
    tabBarWithSafeArea,
    modalWithSafeArea,
    fabPosition,
  };
};

// Safe area style helpers
export const SafeAreaStyles = {
  // Full screen safe area container
  fullScreen: {
    flex: 1,
    paddingTop: Platform.select({
      ios: 0,
      android: StatusBar.currentHeight || 0,
    }),
  },

  // Screen container with horizontal safe area
  screenContainer: {
    flex: 1,
    paddingHorizontal: isTablet ? Spacing['2xl'] : Spacing.lg,
  },

  // Header container
  headerContainer: {
    paddingHorizontal: isTablet ? Spacing['2xl'] : Spacing.lg,
    paddingVertical: Spacing.lg,
  },

  // Content container
  contentContainer: {
    flex: 1,
    paddingHorizontal: isTablet ? Spacing['2xl'] : Spacing.lg,
  },

  // Bottom container (for buttons, etc.)
  bottomContainer: {
    paddingHorizontal: isTablet ? Spacing['2xl'] : Spacing.lg,
    paddingBottom: Platform.select({
      ios: Spacing.xl,
      android: Spacing.lg,
    }),
  },
};

// Safe area padding helpers
export const getSafeAreaPadding = (
  side: 'top' | 'bottom' | 'left' | 'right' | 'horizontal' | 'vertical' | 'all',
  additionalPadding = 0
) => {
  const insets = useSafeAreaInsets();

  const basePadding = {
    top: Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0),
    bottom: Math.max(insets.bottom, Spacing.md),
    left: Math.max(insets.left, Spacing.md),
    right: Math.max(insets.right, Spacing.md),
  };

  switch (side) {
    case 'top':
      return { paddingTop: basePadding.top + additionalPadding };
    case 'bottom':
      return { paddingBottom: basePadding.bottom + additionalPadding };
    case 'left':
      return { paddingLeft: basePadding.left + additionalPadding };
    case 'right':
      return { paddingRight: basePadding.right + additionalPadding };
    case 'horizontal':
      return {
        paddingLeft: basePadding.left + additionalPadding,
        paddingRight: basePadding.right + additionalPadding,
      };
    case 'vertical':
      return {
        paddingTop: basePadding.top + additionalPadding,
        paddingBottom: basePadding.bottom + additionalPadding,
      };
    case 'all':
      return {
        paddingTop: basePadding.top + additionalPadding,
        paddingBottom: basePadding.bottom + additionalPadding,
        paddingLeft: basePadding.left + additionalPadding,
        paddingRight: basePadding.right + additionalPadding,
      };
    default:
      return {};
  }
};
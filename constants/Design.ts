import { Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Breakpoints for responsive design
export const Breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

// Check device type
export const isTablet = screenWidth >= Breakpoints.tablet;
export const isDesktop = screenWidth >= Breakpoints.desktop;
export const isMobile = screenWidth < Breakpoints.tablet;

// Screen dimensions
export const Screen = {
  width: screenWidth,
  height: screenHeight,
  isSmallDevice: screenWidth < 375,
  isLargeDevice: screenWidth > 414,
} as const;

// Color system - Production-level color palette
export const Colors = {
  // Primary colors
  primary: {
    50: '#F0F4FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // Main primary
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
    950: '#1E1B4B',
  },

  // Secondary colors
  secondary: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E', // Main secondary
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },

  // Accent colors
  accent: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Main accent
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    950: '#451A03',
  },

  // Error colors
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // Main error
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },

  // Warning colors
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Main warning
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    950: '#451A03',
  },

  // Success colors
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E', // Main success
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },

  // Neutral colors
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },

  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
  },

  // Text colors
  text: {
    primary: '#111827',
    secondary: '#4B5563',
    tertiary: '#6B7280',
    inverse: '#FFFFFF',
    disabled: '#9CA3AF',
  },

  // Border colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },

  // Special colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Typography system
export const Typography = {
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto_medium',
      default: 'System',
    }),
    semibold: Platform.select({
      ios: 'System',
      android: 'Roboto_bold',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto_bold',
      default: 'System',
    }),
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

// Spacing system based on 4px grid
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '7xl': 80,
  '8xl': 96,
  '9xl': 128,
} as const;

// Border radius
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
} as const;

// Shadows
export const Shadows = {
  sm: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Animation durations
export const Animation = {
  fast: 150,
  normal: 250,
  slow: 350,
  slowest: 500,
} as const;

// Z-index values
export const ZIndex = {
  behind: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  overlay: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

// Component sizes
export const ComponentSizes = {
  button: {
    sm: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      fontSize: Typography.fontSize.sm,
      minHeight: 32,
    },
    md: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      fontSize: Typography.fontSize.base,
      minHeight: 40,
    },
    lg: {
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      fontSize: Typography.fontSize.lg,
      minHeight: 48,
    },
    xl: {
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing['2xl'],
      fontSize: Typography.fontSize.xl,
      minHeight: 56,
    },
  },
  input: {
    sm: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      fontSize: Typography.fontSize.sm,
      minHeight: 32,
    },
    md: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      fontSize: Typography.fontSize.base,
      minHeight: 40,
    },
    lg: {
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      fontSize: Typography.fontSize.lg,
      minHeight: 48,
    },
  },
} as const;

// Layout constants
export const Layout = {
  container: {
    paddingHorizontal: isTablet ? Spacing['4xl'] : Spacing['2xl'],
    maxWidth: isDesktop ? 1200 : '100%',
  },
  section: {
    marginBottom: Spacing['3xl'],
  },
  card: {
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.background.primary,
    ...Shadows.md,
  },
  tabBar: {
    height: Platform.select({
      ios: 80,
      android: 64,
      default: 64,
    }),
  },
} as const;

// Responsive helper functions
export const responsive = {
  width: (mobile: number, tablet?: number, desktop?: number) => {
    if (isDesktop && desktop !== undefined) return desktop;
    if (isTablet && tablet !== undefined) return tablet;
    return mobile;
  },

  height: (mobile: number, tablet?: number, desktop?: number) => {
    if (isDesktop && desktop !== undefined) return desktop;
    if (isTablet && tablet !== undefined) return tablet;
    return mobile;
  },

  fontSize: (mobile: number, tablet?: number, desktop?: number) => {
    if (isDesktop && desktop !== undefined) return desktop;
    if (isTablet && tablet !== undefined) return tablet;
    return mobile;
  },

  spacing: (mobile: number, tablet?: number, desktop?: number) => {
    if (isDesktop && desktop !== undefined) return desktop;
    if (isTablet && tablet !== undefined) return tablet;
    return mobile;
  },
};
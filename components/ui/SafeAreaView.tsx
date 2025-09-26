import React from 'react';
import { SafeAreaView as RNSafeAreaView, View, ViewStyle } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeArea } from '../../constants/SafeArea';

interface SafeAreaViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  mode?: 'padding' | 'margin';
  testID?: string;
}

export const SafeAreaView: React.FC<SafeAreaViewProps> = ({
  children,
  style,
  edges = ['top', 'bottom', 'left', 'right'],
  mode = 'padding',
  testID,
}) => {
  const { theme } = useTheme();
  const { insets } = useSafeArea();

  const safeAreaStyle: ViewStyle = {};

  edges.forEach(edge => {
    const property = mode === 'padding' ? `padding${edge.charAt(0).toUpperCase() + edge.slice(1)}` : `margin${edge.charAt(0).toUpperCase() + edge.slice(1)}`;
    (safeAreaStyle as any)[property] = insets[edge as keyof typeof insets];
  });

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: theme.colors.background.primary,
        },
        safeAreaStyle,
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
};

// Screen container with proper safe area handling
interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  includeTabBar?: boolean;
  includeHeader?: boolean;
  testID?: string;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  includeTabBar = false,
  includeHeader = false,
  testID,
}) => {
  const { theme } = useTheme();
  const { containerWithSafeArea, contentWithSafeArea, headerWithSafeArea } = useSafeArea();

  const containerStyle = includeHeader ? headerWithSafeArea : contentWithSafeArea;

  return (
    <SafeAreaView
      edges={includeTabBar ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']}
      style={[
        {
          backgroundColor: theme.colors.background.primary,
        },
        style,
      ]}
      testID={testID}
    >
      <View style={[{ flex: 1 }, containerStyle]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

// Modal container with safe area
interface ModalContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export const ModalContainer: React.FC<ModalContainerProps> = ({
  children,
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const { modalWithSafeArea } = useSafeArea();

  return (
    <SafeAreaView
      style={[
        {
          backgroundColor: theme.colors.background.primary,
          borderTopLeftRadius: theme.borderRadius['2xl'],
          borderTopRightRadius: theme.borderRadius['2xl'],
          ...theme.shadows.xl,
        },
        modalWithSafeArea,
        style,
      ]}
      testID={testID}
    >
      {children}
    </SafeAreaView>
  );
};

// Header container
interface HeaderContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  testID?: string;
}

export const HeaderContainer: React.FC<HeaderContainerProps> = ({
  children,
  style,
  backgroundColor,
  testID,
}) => {
  const { theme } = useTheme();
  const { headerWithSafeArea } = useSafeArea();

  return (
    <View
      style={[
        {
          backgroundColor: backgroundColor || theme.colors.background.primary,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
        },
        headerWithSafeArea,
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
};
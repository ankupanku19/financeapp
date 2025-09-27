import React, { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Platform } from 'react-native';
import { LayoutDashboard as Home, DollarSign, PiggyBank, Target, ChartBar as BarChart3 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeArea } from '@/constants/SafeArea';
import { responsive } from '@/constants/Design';

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const { tabBarWithSafeArea } = useSafeArea();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  // Show loading or nothing while checking auth to prevent flash
  if (isLoading || !isAuthenticated) {
    return null;
  }

  const iconSize = responsive.width(20, 22, 24);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.background.primary,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.light,
          paddingTop: responsive.spacing(theme.spacing.sm, theme.spacing.md, theme.spacing.md),
          paddingBottom: tabBarWithSafeArea.paddingBottom + theme.spacing.sm,
          paddingLeft: tabBarWithSafeArea.paddingLeft,
          paddingRight: tabBarWithSafeArea.paddingRight,
          height: responsive.height(
            70 + tabBarWithSafeArea.paddingBottom,
            80 + tabBarWithSafeArea.paddingBottom,
            90 + tabBarWithSafeArea.paddingBottom
          ),
          ...theme.shadows.sm,
        },
        tabBarLabelStyle: {
          fontSize: responsive.fontSize(
            theme.typography.fontSize.xs,
            theme.typography.fontSize.sm,
            theme.typography.fontSize.sm
          ),
          fontWeight: theme.typography.fontWeight.semibold,
          fontFamily: theme.typography.fontFamily.medium,
          marginTop: theme.spacing.xs,
        },
        tabBarItemStyle: {
          paddingVertical: theme.spacing.xs,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <Home size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="income"
        options={{
          title: 'Income',
          tabBarIcon: ({ size, color }) => (
            <DollarSign size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="savings"
        options={{
          title: 'Savings',
          tabBarIcon: ({ size, color }) => (
            <PiggyBank size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ size, color }) => (
            <Target size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={iconSize} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
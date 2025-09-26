import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, Animated, Easing, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeArea } from '@/constants/SafeArea';
import { H3, H4, BodyText, Label, Caption } from '@/components/ui/Typography';
import { Button, IconButton } from '@/components/ui/Button';
import { Card, PressableCard } from '@/components/ui/Card';
import { useApp } from '@/contexts/AppContext';
import { X, Target, Calendar, DollarSign, Tag, AlertCircle } from 'lucide-react-native';

interface AddGoalSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const AddGoalSheet: React.FC<AddGoalSheetProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { contentWithSafeArea } = useSafeArea();
  const { addGoal } = useApp();

  const translateY = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.95)).current;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('emergency');
  const [priority, setPriority] = useState('medium');
  const [saving, setSaving] = useState(false);

  const goalCategories = [
    'emergency',
    'vacation',
    'car',
    'house',
    'education',
    'retirement',
    'investment',
    'debt_payoff',
    'wedding',
    'health',
    'technology',
    'other'
  ];

  const priorities = ['low', 'medium', 'high', 'urgent'];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 20,
          stiffness: 300,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1,
          damping: 15,
          stiffness: 200,
          useNativeDriver: true,
        })
      ]).start();
      
      // Set default target date to 1 year from now
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      setTargetDate(oneYearFromNow.toISOString().split('T')[0]);
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 600,
          duration: 250,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 0.95,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTargetAmount('');
    setTargetDate('');
    setCategory('emergency');
    setPriority('medium');
  };

  const isValid = !!title && !!targetAmount && !!targetDate &&
                  !Number.isNaN(parseFloat(targetAmount)) && parseFloat(targetAmount) > 0 &&
                  new Date(targetDate) > new Date();

  const handleSubmit = async () => {
    try {
      if (!isValid) return;
      setSaving(true);
      await addGoal({
        title,
        description: description || undefined,
        targetAmount: parseFloat(targetAmount),
        targetDate,
        category,
        priority,
        status: 'active',
        currency: 'USD',
      } as any);
      setSaving(false);
      resetForm();
      onClose();
    } catch (e) {
      setSaving(false);
      console.error('Add goal failed:', e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={{ 
        flex: 1, 
        backgroundColor: backdropOpacity.interpolate({ 
          inputRange: [0, 1], 
          outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)'] 
        }), 
        justifyContent: 'flex-end' 
      }}>
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1 }} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View
            style={{
              transform: [{ translateY }, { scale: scaleAnimation }],
            }}
          >
            <View
              style={{
                backgroundColor: theme.colors.background.primary,
                borderTopLeftRadius: theme.borderRadius['3xl'],
                borderTopRightRadius: theme.borderRadius['3xl'],
                paddingTop: theme.spacing.md,
                paddingHorizontal: theme.spacing.xl,
                borderTopWidth: theme.isDark ? 1 : 0,
                borderColor: theme.colors.border.light,
                minHeight: Dimensions.get('window').height * 0.7,
                ...theme.shadows.xl,
              }}
            >
              {/* Compact Handle bar */}
              <View style={{ alignItems: 'center', marginBottom: theme.spacing.sm }}>
                <View style={{ 
                  width: 40, 
                  height: 4, 
                  borderRadius: 999, 
                  backgroundColor: theme.colors.neutral[200],
                  opacity: theme.isDark ? 0.3 : 0.5
                }} />
              </View>

              {/* Compact Header */}
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: theme.spacing.md 
              }}>
                <H4 style={{ 
                  marginBottom: 0,
                  color: theme.colors.text.primary,
                  fontWeight: theme.typography.fontWeight.bold
                }}>
                  Create Goal
                </H4>
                <IconButton
                  icon={<X size={18} color={theme.colors.text.secondary} />}
                  onPress={onClose}
                  variant="ghost"
                  size="sm"
                />
              </View>

              {/* Content Area */}
              <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                  {/* Title Field */}
                  <View style={{ marginBottom: theme.spacing.sm }}>
                    <Label style={{ 
                      marginBottom: theme.spacing.xs,
                      color: theme.colors.text.secondary,
                      fontWeight: theme.typography.fontWeight.medium,
                      fontSize: 14
                    }}>
                      Goal Title
                    </Label>
                    
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.colors.background.secondary,
                      borderWidth: 1,
                      borderColor: theme.colors.border.light,
                      borderRadius: theme.borderRadius.md,
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                      minHeight: 40,
                    }}>
                      <Target size={16} color={theme.colors.text.tertiary} style={{ marginRight: theme.spacing.xs }} />
                      
                      <TextInput
                        placeholder="e.g., Emergency Fund, New Car"
                        placeholderTextColor={theme.colors.text.tertiary}
                        value={title}
                        onChangeText={setTitle}
                        maxLength={100}
                        style={{
                          flex: 1,
                          color: theme.colors.text.primary,
                          fontSize: 14,
                          fontWeight: '600',
                        }}
                      />
                    </View>
                  </View>

                  {/* Target Amount Field */}
                  <View style={{ marginBottom: theme.spacing.sm }}>
                    <Label style={{ 
                      marginBottom: theme.spacing.xs,
                      color: theme.colors.text.secondary,
                      fontWeight: theme.typography.fontWeight.medium,
                      fontSize: 14
                    }}>
                      Target Amount
                    </Label>
                    
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.colors.background.secondary,
                      borderWidth: 1,
                      borderColor: theme.colors.border.light,
                      borderRadius: theme.borderRadius.md,
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                      minHeight: 40,
                    }}>
                      <DollarSign size={16} color={theme.colors.text.tertiary} style={{ marginRight: theme.spacing.xs }} />
                      
                      <TextInput
                        placeholder="0.00"
                        placeholderTextColor={theme.colors.text.tertiary}
                        value={targetAmount}
                        onChangeText={setTargetAmount}
                        keyboardType="decimal-pad"
                        style={{
                          flex: 1,
                          color: theme.colors.text.primary,
                          fontSize: 14,
                          fontWeight: '600',
                        }}
                      />
                    </View>
                  </View>

                  {/* Target Date Field */}
                  <View style={{ marginBottom: theme.spacing.sm }}>
                    <Label style={{ 
                      marginBottom: theme.spacing.xs,
                      color: theme.colors.text.secondary,
                      fontWeight: theme.typography.fontWeight.medium,
                      fontSize: 14
                    }}>
                      Target Date
                    </Label>
                    
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.colors.background.secondary,
                      borderWidth: 1,
                      borderColor: theme.colors.border.light,
                      borderRadius: theme.borderRadius.md,
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                      minHeight: 40,
                    }}>
                      <Calendar size={16} color={theme.colors.text.tertiary} style={{ marginRight: theme.spacing.xs }} />
                      
                      <TextInput
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={theme.colors.text.tertiary}
                        value={targetDate}
                        onChangeText={setTargetDate}
                        style={{
                          flex: 1,
                          color: theme.colors.text.primary,
                          fontSize: 14,
                          fontWeight: '400',
                        }}
                      />
                    </View>
                  </View>

                  {/* Category Selection */}
                  <View style={{ marginBottom: theme.spacing.sm }}>
                    <Label style={{ 
                      marginBottom: theme.spacing.xs,
                      color: theme.colors.text.secondary,
                      fontWeight: theme.typography.fontWeight.medium,
                      fontSize: 14
                    }}>
                      Category
                    </Label>
                    
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false} 
                      contentContainerStyle={{ paddingRight: theme.spacing.md }}
                    >
                      <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
                        {goalCategories.map((cat) => (
                          <PressableCard
                            key={cat}
                            onPress={() => setCategory(cat)}
                            padding="xs"
                            shadow={category === cat ? 'sm' : 'none'}
                            borderRadius="md"
                            style={{
                              backgroundColor: category === cat 
                                ? theme.colors.primary[50] 
                                : theme.colors.background.secondary,
                              borderColor: category === cat 
                                ? theme.colors.primary[300] 
                                : theme.colors.border.light,
                              borderWidth: category === cat ? 2 : 1,
                              minWidth: 70,
                              alignItems: 'center',
                            }}
                          >
                            <BodyText style={{ 
                              fontSize: 12,
                              fontWeight: category === cat ? '600' : '400',
                              color: category === cat 
                                ? theme.colors.primary[700] 
                                : theme.colors.text.primary,
                              textAlign: 'center'
                            }}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
                            </BodyText>
                          </PressableCard>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Priority Selection */}
                  <View style={{ marginBottom: theme.spacing.sm }}>
                    <Label style={{ 
                      marginBottom: theme.spacing.xs,
                      color: theme.colors.text.secondary,
                      fontWeight: theme.typography.fontWeight.medium,
                      fontSize: 14
                    }}>
                      Priority
                    </Label>
                    
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false} 
                      contentContainerStyle={{ paddingRight: theme.spacing.md }}
                    >
                      <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
                        {priorities.map((prio) => (
                          <PressableCard
                            key={prio}
                            onPress={() => setPriority(prio)}
                            padding="xs"
                            shadow={priority === prio ? 'sm' : 'none'}
                            borderRadius="md"
                            style={{
                              backgroundColor: priority === prio 
                                ? theme.colors.primary[50] 
                                : theme.colors.background.secondary,
                              borderColor: priority === prio 
                                ? theme.colors.primary[300] 
                                : theme.colors.border.light,
                              borderWidth: priority === prio ? 2 : 1,
                              minWidth: 70,
                              alignItems: 'center',
                            }}
                          >
                            <BodyText style={{ 
                              fontSize: 12,
                              fontWeight: priority === prio ? '600' : '400',
                              color: priority === prio 
                                ? theme.colors.primary[700] 
                                : theme.colors.text.primary,
                              textAlign: 'center'
                            }}>
                              {prio.charAt(0).toUpperCase() + prio.slice(1)}
                            </BodyText>
                          </PressableCard>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Description Field */}
                  <View style={{ marginBottom: theme.spacing.sm }}>
                    <Label style={{ 
                      marginBottom: theme.spacing.xs,
                      color: theme.colors.text.secondary,
                      fontWeight: theme.typography.fontWeight.medium,
                      fontSize: 14
                    }}>
                      Description (Optional)
                    </Label>
                    
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.colors.background.secondary,
                      borderWidth: 1,
                      borderColor: theme.colors.border.light,
                      borderRadius: theme.borderRadius.md,
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                      minHeight: 40,
                    }}>
                      <Tag size={16} color={theme.colors.text.tertiary} style={{ marginRight: theme.spacing.xs }} />
                      
                      <TextInput
                        placeholder="Add notes about this goal"
                        placeholderTextColor={theme.colors.text.tertiary}
                        value={description}
                        onChangeText={setDescription}
                        maxLength={500}
                        style={{
                          flex: 1,
                          color: theme.colors.text.primary,
                          fontSize: 14,
                          fontWeight: '400',
                        }}
                      />
                    </View>
                  </View>
              </ScrollView>

              {/* Footer Button */}
              <View style={{ 
                paddingBottom: contentWithSafeArea.paddingBottom + theme.spacing.md,
                paddingTop: theme.spacing.md,
                borderTopWidth: theme.isDark ? 1 : 0,
                borderColor: theme.colors.border.light,
              }}>
                <Button
                  variant="primary"
                  fullWidth
                  loading={saving}
                  disabled={!isValid}
                  onPress={handleSubmit}
                  size="md"
                  style={{
                    borderRadius: theme.borderRadius.lg,
                  }}
                >
                  {saving ? 'Creating...' : 'Create Goal'}
                </Button>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

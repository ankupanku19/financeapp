import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, Animated, Easing, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeArea } from '@/constants/SafeArea';
import { H3, H4, BodyText, Label, Caption } from '@/components/ui/Typography';
import { Button, IconButton } from '@/components/ui/Button';
import { Card, PressableCard } from '@/components/ui/Card';
import { useApp } from '@/contexts/AppContext';
import { X, PiggyBank, Calendar, Building2, Tag, Target } from 'lucide-react-native';

interface AddSavingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const AddSavingsSheet: React.FC<AddSavingsSheetProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { contentWithSafeArea } = useSafeArea();
  const { addSavings, goals } = useApp();

  const translateY = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.95)).current;

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [date, setDate] = useState<string>(new Date().toISOString());
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('general');
  const [saving, setSaving] = useState(false);

  const savingsCategories = [
    'emergency',
    'vacation', 
    'car',
    'house',
    'education',
    'retirement',
    'investment',
    'general',
    'other'
  ];

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
    setAmount('');
    setDescription('');
    setSource('');
    setDate(new Date().toISOString());
    setCategory('general');
    setSelectedGoal(null);
  };

  const isValid = !!amount && !!description && 
                  !Number.isNaN(parseFloat(amount)) && parseFloat(amount) > 0;

  const handleSubmit = async () => {
    try {
      if (!isValid) return;
      setSaving(true);
      await addSavings({
        amount: parseFloat(amount),
        description,
        goalId: selectedGoal?._id || undefined,
        date,
        source: source || undefined,
        category,
        type: 'manual',
        currency: 'USD',
      } as any);
      setSaving(false);
      resetForm();
      onClose();
    } catch (e) {
      setSaving(false);
      console.error('Add savings failed:', e);
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
                minHeight: Dimensions.get('window').height * 0.6,
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
                  Add Savings
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
                  {/* Amount Field */}
                  <View style={{ marginBottom: theme.spacing.sm }}>
                    <Label style={{ 
                      marginBottom: theme.spacing.xs,
                      color: theme.colors.text.secondary,
                      fontWeight: theme.typography.fontWeight.medium,
                      fontSize: 14
                    }}>
                      Amount
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
                      <PiggyBank size={16} color={theme.colors.text.tertiary} style={{ marginRight: theme.spacing.xs }} />
                      
                      <TextInput
                        placeholder="0.00"
                        placeholderTextColor={theme.colors.text.tertiary}
                        value={amount}
                        onChangeText={setAmount}
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

                  {/* Description Field */}
                  <View style={{ marginBottom: theme.spacing.sm }}>
                    <Label style={{ 
                      marginBottom: theme.spacing.xs,
                      color: theme.colors.text.secondary,
                      fontWeight: theme.typography.fontWeight.medium,
                      fontSize: 14
                    }}>
                      Description
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
                        placeholder="e.g., Emergency fund, Vacation savings"
                        placeholderTextColor={theme.colors.text.tertiary}
                        value={description}
                        onChangeText={setDescription}
                        maxLength={200}
                        style={{
                          flex: 1,
                          color: theme.colors.text.primary,
                          fontSize: 14,
                          fontWeight: '400',
                        }}
                      />
                    </View>
                  </View>

                  {/* Goal Selection */}
                  <View style={{ marginBottom: theme.spacing.sm }}>
                    <Label style={{ 
                      marginBottom: theme.spacing.xs,
                      color: theme.colors.text.secondary,
                      fontWeight: theme.typography.fontWeight.medium,
                      fontSize: 14
                    }}>
                      Goal (Optional)
                    </Label>
                    
                    {selectedGoal && (
                      <View style={{
                        backgroundColor: theme.colors.primary[50],
                        borderRadius: theme.borderRadius.sm,
                        padding: theme.spacing.sm,
                        marginBottom: theme.spacing.xs,
                        borderLeftWidth: 3,
                        borderLeftColor: theme.colors.primary[500],
                      }}>
                        <BodyText style={{
                          fontSize: 12,
                          color: theme.colors.primary[700],
                          fontWeight: '600',
                        }}>
                          Adding to: {selectedGoal.title}
                        </BodyText>
                        <Caption style={{
                          fontSize: 11,
                          color: theme.colors.primary[600],
                          marginTop: 2,
                        }}>
                          Current: ${selectedGoal.currentAmount?.toLocaleString() || 0} / ${selectedGoal.targetAmount.toLocaleString()}
                        </Caption>
                      </View>
                    )}
                    
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false} 
                      contentContainerStyle={{ paddingRight: theme.spacing.md }}
                    >
                      <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
                        <PressableCard
                          onPress={() => setSelectedGoal(null)}
                          padding="xs"
                          shadow={!selectedGoal ? 'sm' : 'none'}
                          borderRadius="md"
                          style={{
                            backgroundColor: !selectedGoal 
                              ? theme.colors.primary[50] 
                              : theme.colors.background.secondary,
                            borderColor: !selectedGoal 
                              ? theme.colors.primary[300] 
                              : theme.colors.border.light,
                            borderWidth: !selectedGoal ? 2 : 1,
                            minWidth: 70,
                            alignItems: 'center',
                          }}
                        >
                          <BodyText style={{ 
                            fontSize: 12,
                            fontWeight: !selectedGoal ? '600' : '400',
                            color: !selectedGoal 
                              ? theme.colors.primary[700] 
                              : theme.colors.text.primary,
                            textAlign: 'center'
                          }}>
                            None
                          </BodyText>
                        </PressableCard>
                        
                        {(goals || []).map((goal) => (
                          <PressableCard
                            key={goal._id}
                            onPress={() => setSelectedGoal(goal)}
                            padding="xs"
                            shadow={selectedGoal?._id === goal._id ? 'sm' : 'none'}
                            borderRadius="md"
                            style={{
                              backgroundColor: selectedGoal?._id === goal._id 
                                ? theme.colors.primary[50] 
                                : theme.colors.background.secondary,
                              borderColor: selectedGoal?._id === goal._id 
                                ? theme.colors.primary[300] 
                                : theme.colors.border.light,
                              borderWidth: selectedGoal?._id === goal._id ? 2 : 1,
                              minWidth: 70,
                              alignItems: 'center',
                            }}
                          >
                            <BodyText style={{ 
                              fontSize: 12,
                              fontWeight: selectedGoal?._id === goal._id ? '600' : '400',
                              color: selectedGoal?._id === goal._id 
                                ? theme.colors.primary[700] 
                                : theme.colors.text.primary,
                              textAlign: 'center'
                            }}>
                              {goal.title}
                            </BodyText>
                          </PressableCard>
                        ))}
                      </View>
                    </ScrollView>
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
                        {savingsCategories.map((cat) => (
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
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </BodyText>
                          </PressableCard>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Source Field */}
                  <View style={{ marginBottom: theme.spacing.sm }}>
                    <Label style={{ 
                      marginBottom: theme.spacing.xs,
                      color: theme.colors.text.secondary,
                      fontWeight: theme.typography.fontWeight.medium,
                      fontSize: 14
                    }}>
                      Source (Optional)
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
                      <Building2 size={16} color={theme.colors.text.tertiary} style={{ marginRight: theme.spacing.xs }} />
                      
                      <TextInput
                        placeholder="e.g., Bank account, Cash, Investment"
                        placeholderTextColor={theme.colors.text.tertiary}
                        value={source}
                        onChangeText={setSource}
                        maxLength={100}
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
                  {saving ? 'Adding...' : 'Add Savings'}
                </Button>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

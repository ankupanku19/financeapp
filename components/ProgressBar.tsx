import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  current: number;
  target: number;
  currency?: string;
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  showLabels?: boolean;
  showPercentage?: boolean;
}

export function ProgressBar({
  current,
  target,
  currency = '$',
  height = 8,
  backgroundColor = '#E5E7EB',
  progressColor = '#10B981',
  showLabels = true,
  showPercentage = true,
}: ProgressBarProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  
  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toLocaleString()}`;
  };

  return (
    <View style={styles.container}>
      {showLabels && (
        <View style={styles.labels}>
          <Text style={styles.currentLabel}>
            {formatCurrency(current)}
          </Text>
          <Text style={styles.targetLabel}>
            {formatCurrency(target)}
          </Text>
        </View>
      )}
      
      <View style={[styles.progressBar, { height, backgroundColor }]}>
        <View
          style={[
            styles.progress,
            {
              width: `${percentage}%`,
              backgroundColor: progressColor,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
      
      {showPercentage && (
        <Text style={styles.percentage}>
          {Math.round(percentage)}% complete
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  currentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  targetLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBar: {
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progress: {
    height: '100%',
    minWidth: 2,
  },
  percentage: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
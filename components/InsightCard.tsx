import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AIInsight } from '@/types/api';
import { TrendingUp, TriangleAlert as AlertTriangle, Lightbulb, Trophy, ChevronRight } from 'lucide-react-native';

interface InsightCardProps {
  insight: AIInsight;
  onPress?: () => void;
}

const getIcon = (type: AIInsight['type']) => {
  switch (type) {
    case 'trend':
      return <TrendingUp size={20} color="#6366F1" />;
    case 'warning':
      return <AlertTriangle size={20} color="#EF4444" />;
    case 'recommendation':
      return <Lightbulb size={20} color="#F59E0B" />;
    case 'achievement':
      return <Trophy size={20} color="#10B981" />;
    default:
      return <Lightbulb size={20} color="#6366F1" />;
  }
};

const getCardStyle = (type: AIInsight['type']) => {
  switch (type) {
    case 'trend':
      return { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' };
    case 'warning':
      return { backgroundColor: '#FEF2F2', borderColor: '#FECACA' };
    case 'recommendation':
      return { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' };
    case 'achievement':
      return { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' };
    default:
      return { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' };
  }
};

export function InsightCard({ insight, onPress }: InsightCardProps) {
  const cardStyle = getCardStyle(insight.type);
  const icon = getIcon(insight.type);

  return (
    <TouchableOpacity
      style={[styles.card, cardStyle]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{insight.title}</Text>
          <Text style={styles.confidence}>
            {Math.round(insight.confidence * 100)}% confidence
          </Text>
        </View>
        {onPress && (
          <ChevronRight size={16} color="#9CA3AF" />
        )}
      </View>
      
      <Text style={styles.description}>{insight.description}</Text>
      
      {insight.actionable && (
        <View style={styles.actionBadge}>
          <Text style={styles.actionText}>Action Required</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  confidence: {
    fontSize: 12,
    color: '#6B7280',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  actionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#6366F1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
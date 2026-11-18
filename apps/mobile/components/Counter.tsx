import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing } from '@/constants/theme';

interface CounterProps {
  current: number; // 1-based
  total: number;
}

export function Counter({ current, total }: CounterProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        <Text style={styles.current}>{current}</Text>
        {' of '}
        <Text style={styles.total}>{total}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  current: {
    color: Colors.accent,
    fontWeight: '700',
  },
  total: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

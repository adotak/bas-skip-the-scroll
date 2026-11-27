import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

interface CounterProps {
  current: number; // 1-based
  total: number;
  savedIndices?: number[]; // 0-based indices of saved cards
  onSelectIndex?: (index: number) => void;
}

export function Counter({
  current,
  total,
  savedIndices = [],
  onSelectIndex,
}: CounterProps) {
  const segments = Array.from({ length: total }, (_, i) => i);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.text}>
          <Text style={styles.current}>{current}</Text>
          {' of '}
          <Text style={styles.total}>{total}</Text>
        </Text>
        <Text style={styles.finiteTag}>
          {current === total ? '✦ Final card in deck' : `${total - current} left · Finite deck`}
        </Text>
      </View>

      {/* Segmented finite progress pills */}
      <View style={styles.segmentsRow}>
        {segments.map((idx) => {
          const isCurrent = idx === current - 1;
          const isPast = idx < current - 1;
          const isSaved = savedIndices.includes(idx);

          return (
            <Pressable
              key={idx}
              onPress={() => onSelectIndex?.(idx)}
              style={[
                styles.segment,
                isPast && styles.segmentPast,
                isCurrent && styles.segmentCurrent,
                isSaved && styles.segmentSaved,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Go to card ${idx + 1} of ${total}`}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  current: {
    color: Colors.accent,
    fontWeight: '800',
    fontSize: FontSize.lg,
  },
  total: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  finiteTag: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 5,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceLight,
  },
  segmentPast: {
    backgroundColor: Colors.accentSoft,
  },
  segmentCurrent: {
    backgroundColor: Colors.accent,
  },
  segmentSaved: {
    borderWidth: 1,
    borderColor: Colors.warning,
  },
});

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

interface CounterProps {
  current: number; // 1-based
  total: number;
  savedIndices?: number[]; // 0-based indices of saved cards
  onSelectIndex?: (index: number) => void;
}

/**
 * Styled after UI.html `.breadcrumb-filters [data-count]` and `.box-score`:
 * - Clean 1px solid #222 count box
 * - High-contrast segmented step indicators (#222 active, #AAEEC4 completed, #FA5D29 saved)
 */
export const Counter = memo(function Counter({
  current,
  total,
  savedIndices = [],
  onSelectIndex,
}: CounterProps) {
  const segments = Array.from({ length: total }, (_, i) => i);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.counterGroup}>
          <Text style={styles.eyebrow}>CARD</Text>
          <View style={styles.countBox}>
            <Text style={styles.text}>
              <Text style={styles.current}>{current}</Text>
              {' of '}
              <Text style={styles.total}>{total}</Text>
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.finiteBadge,
            current === total && styles.finiteBadgeFinal,
          ]}
        >
          <Text style={styles.finiteTag}>
            {current === total ? 'FINAL CARD IN DECK' : `${total - current} LEFT · FINITE`}
          </Text>
        </View>
      </View>

      {/* Segmented finite progress bar */}
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
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  counterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrow: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  countBox: {
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: Colors.surface,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  current: {
    color: Colors.text,
    fontWeight: '800',
  },
  total: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  finiteBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  finiteBadgeFinal: {
    backgroundColor: Colors.lemon,
  },
  finiteTag: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: Radius.xs,
    backgroundColor: Colors.surfaceLight,
  },
  segmentPast: {
    backgroundColor: Colors.mint,         // #AAEEC4
  },
  segmentCurrent: {
    backgroundColor: Colors.surfaceDark,  // #222222
  },
  segmentSaved: {
    backgroundColor: Colors.vermilion,    // #FA5D29
  },
});

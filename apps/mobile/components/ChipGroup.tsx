import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';

interface ChipGroupProps<T extends string | number> {
  options: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
  /** Override display labels. Key = stringified option value. */
  labels?: Partial<Record<string, string>>;
  /** Suffix appended to each label, e.g. "min". */
  suffix?: string;
}

export function ChipGroup<T extends string | number>({
  options,
  selected,
  onSelect,
  labels,
  suffix,
}: ChipGroupProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const isActive = opt === selected;
        const baseLabel = labels?.[String(opt)] ?? String(opt);
        const display = suffix ? `${baseLabel} ${suffix}` : baseLabel;

        return (
          <Pressable
            key={String(opt)}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(opt)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {display}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
});

import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';

interface ChipGroupProps<T extends string | number> {
  options: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
  /** Override display labels. Key = stringified option value. */
  labels?: Partial<Record<string, string>>;
  /** Optional emoji or symbol icon prefix per option. */
  icons?: Partial<Record<string, string>>;
  /** Suffix appended to each label, e.g. "min". */
  suffix?: string;
}

/**
 * Modeled after UI.html `.nav-filters__container` (line 285) and `.nav-filters__item` (line 317):
 * - Container: `--nf-bg-1` (#EDEDED), padding 6px, border-radius 8px
 * - Item: height 42px, padding-inline 20px, `--nf-bg-2` (#F8F8F8), active `#222222` with white text
 */
function ChipGroupInner<T extends string | number>({
  options,
  selected,
  onSelect,
  labels,
  icons,
  suffix,
}: ChipGroupProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isActive = opt === selected;
        const baseLabel = labels?.[String(opt)] ?? String(opt);
        const icon = icons?.[String(opt)];
        const display = suffix ? `${baseLabel} ${suffix}` : baseLabel;

        return (
          <Pressable
            key={String(opt)}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(opt)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            {icon ? <Text style={styles.chipIcon}>{icon}</Text> : null}
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {display}
            </Text>
            {isActive && <View style={styles.activeDot} />}
          </Pressable>
        );
      })}
    </View>
  );
}

export const ChipGroup = memo(ChipGroupInner) as typeof ChipGroupInner;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 6,
    backgroundColor: Colors.surfaceLight, // --nf-bg-1: #EDEDED
    borderRadius: Radius.sm,              // --rounded-normal: 8px
  },
  chip: {
    flex: 1,
    minWidth: 74,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg,           // --nf-bg-2: #F8F8F8
  },
  chipActive: {
    backgroundColor: Colors.surfaceDark,  // #222222
  },
  chipIcon: {
    fontSize: FontSize.sm,
  },
  chipText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.lemon,        // --color-learn: #FFF083
  },
});

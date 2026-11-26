import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import type { Mode, TimeBox } from '@skip-the-scroll/shared';

interface LoadingDeckSkeletonProps {
  intent: string;
  mode: Mode;
  timeBox: TimeBox;
}

const PIPELINE_STEPS = [
  '01 · Normalising intent into high-precision queries…',
  '02 · Querying YouTube, Docs, Wikipedia & community sources…',
  '03 · Synthesising 3-bullet TL;DR takeaways & guardrails…',
];

export const LoadingDeckSkeleton = memo(function LoadingDeckSkeleton({
  intent,
  mode,
  timeBox,
}: LoadingDeckSkeletonProps) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx((prev) => (prev < PIPELINE_STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container} accessibilityLabel="Curating your intentional deck">
      <View style={styles.topRow}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            CURATING FINITE DECK · {mode.toUpperCase()} · {timeBox}M
          </Text>
        </View>
        <View style={styles.loaderBars}>
          <View style={[styles.loaderBar, { height: 18 }]} />
          <View style={[styles.loaderBar, { height: 12 }]} />
          <View style={[styles.loaderBar, { height: 22 }]} />
        </View>
      </View>

      <Text style={styles.intentTitle} numberOfLines={2}>
        “{intent}”
      </Text>

      {/* Pipeline stages */}
      <View style={styles.stepsBox}>
        {PIPELINE_STEPS.map((label, idx) => {
          const isDone = idx < stepIdx;
          const isCurrent = idx === stepIdx;
          return (
            <View key={label} style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  isDone && styles.stepDotDone,
                  isCurrent && styles.stepDotActive,
                ]}
              />
              <Text
                style={[
                  styles.stepText,
                  isCurrent && styles.stepTextActive,
                  isDone && styles.stepTextDone,
                ]}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Skeleton card preview */}
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonThumb} />
        <View style={styles.skeletonTitleLine} />
        <View style={[styles.skeletonTitleLine, { width: '65%' }]} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceDark, // #222222 (.card-directory-sp)
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerBadge: {
    backgroundColor: Colors.lemon, // #FFF083
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  headerBadgeText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  loaderBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loaderBar: {
    width: 4,
    backgroundColor: Colors.mint,
    borderRadius: 2,
  },
  intentTitle: {
    color: Colors.textInverse,
    fontSize: FontSize.xl,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  stepsBox: {
    gap: 8,
    marginBottom: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceDarkBorder,
  },
  stepDotActive: {
    backgroundColor: Colors.lemon,
  },
  stepDotDone: {
    backgroundColor: Colors.mint,
  },
  stepText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    flex: 1,
  },
  stepTextActive: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  stepTextDone: {
    color: Colors.mint,
  },
  skeletonCard: {
    backgroundColor: Colors.surfaceDarkInner,
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  skeletonThumb: {
    height: 54,
    borderRadius: Radius.xs,
    backgroundColor: Colors.surfaceDarkBorder,
    marginBottom: Spacing.sm,
  },
  skeletonTitleLine: {
    width: '90%',
    height: 12,
    borderRadius: 3,
    backgroundColor: Colors.surfaceDarkBorder,
    marginBottom: 6,
  },
});

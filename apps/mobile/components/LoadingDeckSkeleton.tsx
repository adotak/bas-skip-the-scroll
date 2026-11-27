import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import type { Mode, TimeBox } from '@skip-the-scroll/shared';

interface LoadingDeckSkeletonProps {
  intent: string;
  mode: Mode;
  timeBox: TimeBox;
}

const PIPELINE_STEPS = [
  'Normalising your intent into high-precision queries…',
  'Searching YouTube, Docs, Wikipedia & community sources…',
  'Synthesising 3-bullet TL;DR takeaways & guardrails…',
];

export function LoadingDeckSkeleton({
  intent,
  mode,
  timeBox,
}: LoadingDeckSkeletonProps) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx((prev) => (prev < PIPELINE_STEPS.length - 1 ? prev + 1 : prev));
    }, 1300);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container} accessibilityLabel="Curating your intentional deck">
      <View style={styles.headerBadge}>
        <Text style={styles.headerBadgeText}>
          ✦  CURATING FINITE DECK  ·  {mode.toUpperCase()}  ·  {timeBox} MIN
        </Text>
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
              <Text
                style={[
                  styles.stepIcon,
                  isDone && styles.stepIconDone,
                  isCurrent && styles.stepIconActive,
                ]}
              >
                {isDone ? '✓' : isCurrent ? '◉' : '○'}
              </Text>
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
        <View style={styles.skeletonPill} />
        <View style={styles.skeletonTitleLine} />
        <View style={[styles.skeletonTitleLine, { width: '65%' }]} />
        <View style={styles.skeletonTldrBox}>
          <View style={styles.skeletonBulletLine} />
          <View style={[styles.skeletonBulletLine, { width: '88%' }]} />
          <View style={[styles.skeletonBulletLine, { width: '76%' }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    marginVertical: Spacing.md,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentDim,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    marginBottom: Spacing.sm,
  },
  headerBadgeText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  intentTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  stepsBox: {
    gap: Spacing.xs + 2,
    marginBottom: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepIcon: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    width: 18,
  },
  stepIconActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
  stepIconDone: {
    color: Colors.success,
    fontWeight: '700',
  },
  stepText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    flex: 1,
  },
  stepTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  stepTextDone: {
    color: Colors.textSecondary,
  },
  skeletonCard: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skeletonThumb: {
    height: 78,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceLight,
    marginBottom: Spacing.sm,
  },
  skeletonPill: {
    width: 80,
    height: 18,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceLight,
    marginBottom: Spacing.sm,
  },
  skeletonTitleLine: {
    width: '92%',
    height: 16,
    borderRadius: Radius.xs,
    backgroundColor: Colors.surfaceLight,
    marginBottom: Spacing.xs + 2,
  },
  skeletonTldrBox: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    gap: 6,
  },
  skeletonBulletLine: {
    width: '95%',
    height: 10,
    borderRadius: Radius.xs,
    backgroundColor: Colors.surfaceLight,
  },
});

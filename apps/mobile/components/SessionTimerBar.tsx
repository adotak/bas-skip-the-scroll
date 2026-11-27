import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import type { TimeBox } from '@skip-the-scroll/shared';

interface SessionTimerBarProps {
  timeboxMin: TimeBox;
  totalCardMinutes: number;
  onElapsedChange?: (elapsedSeconds: number) => void;
}

export function SessionTimerBar({
  timeboxMin,
  totalCardMinutes,
  onElapsedChange,
}: SessionTimerBarProps) {
  const totalSeconds = timeboxMin * 60;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        onElapsedChange?.(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, onElapsedChange]);

  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progressRatio = Math.min(1, elapsedSeconds / totalSeconds);
  const isTimeUp = remainingSeconds === 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <View style={styles.leftGroup}>
          <View style={[styles.dot, isPaused ? styles.dotPaused : isTimeUp ? styles.dotWarning : styles.dotActive]} />
          <Text style={styles.timerLabel}>
            {isTimeUp
              ? `Time-box complete (${timeboxMin}m)`
              : `${formatted} left in ${timeboxMin}m box`}
          </Text>
        </View>

        <View style={styles.rightGroup}>
          <Text style={styles.budgetText}>
            Deck: ~{totalCardMinutes}m read
          </Text>
          <Pressable
            onPress={() => setIsPaused((p) => !p)}
            style={styles.pauseBtn}
            accessibilityRole="button"
            accessibilityLabel={isPaused ? 'Resume timer' : 'Pause timer'}
          >
            <Text style={styles.pauseBtnText}>{isPaused ? '▶ Resume' : '❚❚ Pause'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Subtle progress bar */}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.round(progressRatio * 100)}%` },
            isTimeUp && styles.fillWarning,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: Colors.accent,
  },
  dotPaused: {
    backgroundColor: Colors.textMuted,
  },
  dotWarning: {
    backgroundColor: Colors.warning,
  },
  timerLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  budgetText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  pauseBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pauseBtnText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  track: {
    height: 3,
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
  },
  fillWarning: {
    backgroundColor: Colors.warning,
  },
});

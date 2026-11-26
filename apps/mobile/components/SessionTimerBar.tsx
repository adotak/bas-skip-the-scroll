import React, { useState, useEffect, memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import type { TimeBox } from '@skip-the-scroll/shared';

interface SessionTimerBarProps {
  timeboxMin: TimeBox;
  totalCardMinutes: number;
  onElapsedChange?: (elapsedSeconds: number) => void;
}

/**
 * Modeled on UI.html `.marquee-top` (#222222 bar with solid `.budget-tag--solid--yellow`
 * and `.budget-tag--solid--green` tags).
 * Memoized so its 1-second tick stays self-contained and never triggers sibling re-renders.
 */
export const SessionTimerBar = memo(function SessionTimerBar({
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
      <View style={styles.barSurface}>
        <View style={styles.row}>
          <View style={styles.leftGroup}>
            <View
              style={[
                styles.solidTag,
                isPaused
                  ? styles.solidTagPaused
                  : isTimeUp
                    ? styles.solidTagWarning
                    : styles.solidTagActive,
              ]}
            >
              <Text style={styles.solidTagText}>
                {isPaused ? 'PAUSED' : isTimeUp ? 'TIME UP' : formatted}
              </Text>
            </View>
            <Text style={styles.timerLabel}>
              {isTimeUp
                ? `${timeboxMin}m box finished`
                : `left in ${timeboxMin}m time-box`}
            </Text>
          </View>

          <View style={styles.rightGroup}>
            <View style={styles.budgetTagOutline}>
              <Text style={styles.budgetText}>~{totalCardMinutes}m deck</Text>
            </View>
            <Pressable
              onPress={() => setIsPaused((p) => !p)}
              style={styles.pauseBtn}
              accessibilityRole="button"
              accessibilityLabel={isPaused ? 'Resume timer' : 'Pause timer'}
            >
              <Text style={styles.pauseBtnText}>
                {isPaused ? '▶ Resume' : '❚❚ Pause'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom 3px progress track */}
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
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 4,
  },
  barSurface: {
    backgroundColor: Colors.surfaceDark, // #222222 (.marquee-top)
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 8,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  solidTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  solidTagActive: {
    backgroundColor: Colors.mint,        // --color-inspire: #AAEEC4
  },
  solidTagPaused: {
    backgroundColor: Colors.lemon,       // --color-learn: #FFF083
  },
  solidTagWarning: {
    backgroundColor: Colors.vermilion,   // --color-orange: #FA5D29
  },
  solidTagText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  timerLabel: {
    color: Colors.textInverse,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  budgetTagOutline: {
    borderWidth: 1,
    borderColor: Colors.surfaceDarkBorder,
    borderRadius: Radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  budgetText: {
    color: '#DEDEDE',
    fontSize: 10,
    fontWeight: '600',
  },
  pauseBtn: {
    backgroundColor: Colors.surfaceDarkInner,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  pauseBtnText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
  },
  track: {
    height: 3,
    backgroundColor: Colors.surfaceDarkInner,
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.mint,
  },
  fillWarning: {
    backgroundColor: Colors.vermilion,
  },
});

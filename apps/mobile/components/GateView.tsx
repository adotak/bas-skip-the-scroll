import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';

interface GateViewProps {
  targetApp?: string;
  initialPauseSeconds?: number;
  onLookUp: () => void;
  onTakeBreak: (minutes: number) => void;
  onNeverMind: () => void;
  onContinueAnyway: () => void;
}

export function GateView({
  targetApp = 'Instagram',
  initialPauseSeconds = 5,
  onLookUp,
  onTakeBreak,
  onNeverMind,
  onContinueAnyway,
}: GateViewProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialPauseSeconds);
  const isPauseActive = secondsLeft > 0;

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  return (
    <View style={styles.container}>
      {/* Countdown and breathing cue */}
      <View style={styles.centerBlock}>
        <Text style={styles.counter}>{isPauseActive ? secondsLeft : '✦'}</Text>
        <Text style={styles.breathingText}>
          {isPauseActive ? 'Take a breath...' : 'You are in control.'}
        </Text>

        <Text style={styles.question}>
          What did you open {targetApp} for?
        </Text>
      </View>

      {/* Options — revealed after breathing pause */}
      {isPauseActive ? (
        <View style={styles.pausePlaceholder}>
          <Text style={styles.pausePlaceholderText}>
            Pause active ({secondsLeft}s)
          </Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable style={styles.primaryAction} onPress={onLookUp}>
            <Text style={styles.primaryActionText}>🔍  Look something up</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryAction}
            onPress={() => onTakeBreak(5)}
          >
            <Text style={styles.secondaryActionText}>
              ⏱  Just a quick break (5 min)
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryAction} onPress={onNeverMind}>
            <Text style={styles.secondaryActionText}>✕  Never mind</Text>
          </Pressable>

          <Pressable
            style={styles.continueAnywayBtn}
            onPress={onContinueAnyway}
          >
            <Text style={styles.continueAnywayText}>
              Continue to {targetApp} anyway →
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'space-between',
    padding: Spacing.xl,
    paddingVertical: Spacing.xxl * 1.5,
  },
  centerBlock: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  counter: {
    color: Colors.accent,
    fontSize: 72,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  breathingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginBottom: Spacing.xl,
  },
  question: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: FontSize.xxl * 1.3,
  },
  pausePlaceholder: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  pausePlaceholderText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontStyle: 'italic',
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
  },
  primaryAction: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  primaryActionText: {
    color: Colors.bg,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  secondaryAction: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  continueAnywayBtn: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  continueAnywayText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textDecorationLine: 'underline',
  },
});

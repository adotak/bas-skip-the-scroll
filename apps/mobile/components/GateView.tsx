import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';

interface GateViewProps {
  targetApp?: string;
  initialPauseSeconds?: number;
  escalationLevel?: 1 | 2 | 3; // 1 = 5s, 2 = 10s, 3 = 15s
  onLookUp: () => void;
  onTakeBreak: (minutes: number) => void;
  onNeverMind: () => void;
  onContinueAnyway: () => void;
}

const BREAK_PRESETS = [2, 5, 10] as const;

export function GateView({
  targetApp = 'Instagram',
  initialPauseSeconds = 5,
  escalationLevel = 1,
  onLookUp,
  onTakeBreak,
  onNeverMind,
  onContinueAnyway,
}: GateViewProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialPauseSeconds);
  const [selectedBreakMin, setSelectedBreakMin] = useState<number>(5);
  const [confirmingBypass, setConfirmingBypass] = useState(false);
  const [showWhySheet, setShowWhySheet] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isPauseActive = secondsLeft > 0;

  useEffect(() => {
    setSecondsLeft(initialPauseSeconds);
  }, [initialPauseSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.18,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const breathingCue = isPauseActive
    ? secondsLeft % 4 >= 2
      ? 'Inhale slowly…'
      : 'Exhale gently…'
    : 'You are in control.';

  return (
    <View style={styles.container}>
      {/* Top Escalation & Transparency Bar */}
      <View style={styles.topRow}>
        <View style={styles.escalationBadge}>
          <Text style={styles.escalationText}>
            Pause Tier {escalationLevel}/3 ({initialPauseSeconds}s)
          </Text>
        </View>
        <Pressable
          onPress={() => setShowWhySheet((s) => !s)}
          style={styles.whyLinkBtn}
        >
          <Text style={styles.whyLinkText}>
            {showWhySheet ? 'Hide info' : 'Why am I seeing this?'}
          </Text>
        </Pressable>
      </View>

      {showWhySheet && (
        <View style={styles.whyCard}>
          <Text style={styles.whyCardTitle}>Friction, not imprisonment</Text>
          <Text style={styles.whyCardBody}>
            You enabled the Pause Gate for {targetApp}. Research shows a 5-second breathing pause breaks autopilot muscle memory. We never read content inside your apps, and you can adjust or disable this anytime in Gate Settings.
          </Text>
        </View>
      )}

      {/* Animated Breathing Orb & Question */}
      <View style={styles.centerBlock}>
        <View style={styles.orbOuterWrapper}>
          <Animated.View
            style={[
              styles.orbGlow,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
          <View style={styles.orbCore}>
            <Text style={styles.counter}>{isPauseActive ? secondsLeft : '✦'}</Text>
          </View>
        </View>

        <Text style={styles.breathingText}>{breathingCue}</Text>

        <Text style={styles.question}>
          What did you open {targetApp} for?
        </Text>
      </View>

      {/* Options — revealed after breathing pause */}
      {isPauseActive ? (
        <View style={styles.pausePlaceholder}>
          <Text style={styles.pausePlaceholderText}>
            Choices unlock in {secondsLeft}s — let the impulse settle
          </Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable style={styles.primaryAction} onPress={onLookUp}>
            <Text style={styles.primaryActionText}>
              🔍  Look something up with intent
            </Text>
            <Text style={styles.primaryActionSub}>
              Get a finite 5–10 card deck instead of an infinite feed
            </Text>
          </Pressable>

          {/* Time-boxed break selector */}
          <View style={styles.breakBox}>
            <View style={styles.breakPresetsRow}>
              {BREAK_PRESETS.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setSelectedBreakMin(m)}
                  style={[
                    styles.breakPresetChip,
                    selectedBreakMin === m && styles.breakPresetChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.breakPresetText,
                      selectedBreakMin === m && styles.breakPresetTextActive,
                    ]}
                  >
                    {m}m
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={styles.breakActionBtn}
              onPress={() => onTakeBreak(selectedBreakMin)}
            >
              <Text style={styles.secondaryActionText}>
                ⏱  Take a {selectedBreakMin} min time-boxed break
              </Text>
            </Pressable>
          </View>

          <Pressable style={styles.secondaryAction} onPress={onNeverMind}>
            <Text style={styles.secondaryActionText}>
              ✕  Never mind — close {targetApp}
            </Text>
          </Pressable>

          {/* Two-step deliberate "Continue anyway" per SPEC §4 */}
          {!confirmingBypass ? (
            <Pressable
              style={styles.continueAnywayBtn}
              onPress={() => setConfirmingBypass(true)}
            >
              <Text style={styles.continueAnywayText}>
                Continue to {targetApp} anyway →
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.confirmBypassBtn}
              onPress={onContinueAnyway}
            >
              <Text style={styles.confirmBypassText}>
                Tap again to confirm opening {targetApp} (logged in Insights)
              </Text>
            </Pressable>
          )}
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
    padding: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  escalationBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  escalationText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  whyLinkBtn: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
  },
  whyLinkText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  whyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    marginTop: Spacing.xs,
  },
  whyCardTitle: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: 4,
  },
  whyCardBody: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * 1.45,
  },
  centerBlock: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  orbOuterWrapper: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  orbGlow: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: Colors.accentDim,
    borderWidth: 1.5,
    borderColor: Colors.borderAccent,
  },
  orbCore: {
    width: 102,
    height: 102,
    borderRadius: 51,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    color: Colors.accent,
    fontSize: 44,
    fontWeight: '800',
  },
  breathingText: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '600',
    marginBottom: Spacing.md,
    letterSpacing: 0.4,
  },
  question: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: FontSize.xl * 1.3,
  },
  pausePlaceholder: {
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pausePlaceholderText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontStyle: 'italic',
  },
  actions: {
    width: '100%',
    gap: Spacing.sm + 2,
  },
  primaryAction: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  primaryActionText: {
    color: Colors.bg,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  primaryActionSub: {
    color: Colors.bg,
    opacity: 0.8,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  breakBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakPresetsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  breakPresetChip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgElevated,
  },
  breakPresetChipActive: {
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  breakPresetText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  breakPresetTextActive: {
    color: Colors.accent,
  },
  breakActionBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  secondaryAction: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  continueAnywayBtn: {
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    marginTop: 4,
  },
  continueAnywayText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textDecorationLine: 'underline',
  },
  confirmBypassBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    backgroundColor: Colors.warningDim,
    borderWidth: 1,
    borderColor: Colors.warning,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmBypassText: {
    color: Colors.warning,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});

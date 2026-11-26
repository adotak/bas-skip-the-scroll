import React, { useState, useEffect, useRef, memo } from 'react';
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

/**
 * Modeled after UI.html `.card-recommendation` (high-contrast #222222 editorial canvas,
 * `.budget-tag--solid--yellow` / `--green` pills, `.button--white`, `.button--outline--white`).
 */
export const GateView = memo(function GateView({
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
          toValue: 1.16,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.96,
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
      ? 'INHALE SLOWLY…'
      : 'EXHALE GENTLY…'
    : 'YOU ARE IN CONTROL.';

  return (
    <View style={styles.container}>
      {/* Top Escalation & Transparency Bar */}
      <View style={styles.topRow}>
        <View style={styles.escalationBadge}>
          <Text style={styles.escalationText}>
            PAUSE TIER 0{escalationLevel}/03 · {initialPauseSeconds}S
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
          <Text style={styles.whyCardTitle}>FRICTION, NOT IMPRISONMENT</Text>
          <Text style={styles.whyCardBody}>
            You enabled the Pause Gate for {targetApp}. A short breathing pause breaks autopilot muscle memory. We never read content inside your apps, and you can adjust or disable this anytime in Settings.
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
            <Text style={styles.counter}>{isPauseActive ? secondsLeft : 'W.'}</Text>
          </View>
        </View>

        <View style={styles.cuePill}>
          <Text style={styles.breathingText}>{breathingCue}</Text>
        </View>

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
              Get a finite 3–7 card deck instead of an infinite feed
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
                Tap again to confirm opening {targetApp} (counted in Insights)
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceDark, // #222222 editorial dark gate
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
    backgroundColor: Colors.surfaceDarkInner,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.surfaceDarkBorder,
  },
  escalationText: {
    color: Colors.lemon,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  whyLinkBtn: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
  },
  whyLinkText: {
    color: '#DEDEDE',
    fontSize: FontSize.xs,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  whyCard: {
    backgroundColor: Colors.surfaceDarkInner,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.mint,
    marginTop: Spacing.xs,
  },
  whyCardTitle: {
    color: Colors.mint,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  whyCardBody: {
    color: '#DEDEDE',
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * 1.45,
  },
  centerBlock: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  orbOuterWrapper: {
    width: 144,
    height: 144,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  orbGlow: {
    position: 'absolute',
    width: 134,
    height: 134,
    borderRadius: 67,
    backgroundColor: 'rgba(170, 238, 196, 0.16)',
    borderWidth: 1.5,
    borderColor: Colors.mint,
  },
  orbCore: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: Colors.lemon, // #FFF083
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    color: Colors.text,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
  },
  cuePill: {
    backgroundColor: Colors.surfaceDarkInner,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    marginBottom: Spacing.md,
  },
  breathingText: {
    color: Colors.mint,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  question: {
    color: Colors.textInverse,
    fontSize: FontSize.xxl,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: FontSize.xxl * 1.2,
    letterSpacing: -0.5,
  },
  pausePlaceholder: {
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceDarkInner,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceDarkBorder,
  },
  pausePlaceholderText: {
    color: '#DEDEDE',
    fontSize: FontSize.sm,
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
  },
  primaryAction: {
    backgroundColor: Colors.mint, // #AAEEC4
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  primaryActionText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  primaryActionSub: {
    color: Colors.text,
    opacity: 0.75,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  breakBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceDarkInner,
    borderRadius: Radius.sm,
    padding: 6,
    borderWidth: 1,
    borderColor: Colors.surfaceDarkBorder,
  },
  breakPresetsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  breakPresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Colors.surfaceDark,
  },
  breakPresetChipActive: {
    backgroundColor: Colors.lemon,
  },
  breakPresetText: {
    color: '#DEDEDE',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  breakPresetTextActive: {
    color: Colors.text,
  },
  breakActionBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: Colors.textInverse,
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
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.xs,
    backgroundColor: Colors.vermilion,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmBypassText: {
    color: Colors.textInverse,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
});

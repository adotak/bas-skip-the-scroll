import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import type { SessionOutcome } from '@skip-the-scroll/shared';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { getStoredSession } from '@/store/sessionStore';
import { logSessionEnd } from '@/store/storage';

export default function EndScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = getStoredSession(id ?? '');

  const handleOutcome = async (outcome: SessionOutcome) => {
    if (id) {
      await logSessionEnd(id, outcome);
    }
    // Both Done and Refine go back to Intent.
    // Refine clears state so the user starts fresh.
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Illustration area */}
        <Text style={styles.emoji}>✓</Text>
        <Text style={styles.title}>That's all.</Text>
        <Text style={styles.subtitle}>Did you get what you needed?</Text>

        {/* Session summary */}
        {session && (
          <Text style={styles.meta}>
            {session.cards.length} cards  ·  {session.mode}  ·  {session.timeboxMin} min
          </Text>
        )}

        {/* Outcome buttons */}
        <View style={styles.actions}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => handleOutcome('done')}
          >
            <Text style={styles.primaryButtonText}>✓  Done</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => handleOutcome('refine')}
          >
            <Text style={styles.secondaryButtonText}>↻  Refine my search</Text>
          </Pressable>

          <Pressable
            style={styles.tertiaryButton}
            onPress={() => handleOutcome('save')}
          >
            <Text style={styles.tertiaryButtonText}>↓  Save for later</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emoji: {
    fontSize: 56,
    color: Colors.accent,
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  meta: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.xxl,
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.bg,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  tertiaryButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  tertiaryButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    fontWeight: '500',
  },
});

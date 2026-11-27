import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import type { SessionOutcome } from '@skip-the-scroll/shared';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { getStoredSession } from '@/store/sessionStore';
import { logSessionEnd, saveCard, isCardSaved } from '@/store/storage';

export default function EndScreen() {
  const { id, takeaways, elapsed } = useLocalSearchParams<{
    id: string;
    takeaways?: string;
    elapsed?: string;
  }>();
  const session = getStoredSession(id ?? '');
  const takeawaysCount = Number(takeaways ?? 0) || 0;
  const elapsedSec = Number(elapsed ?? 0) || 0;

  const handleOutcome = async (outcome: SessionOutcome, refineQuery?: string) => {
    if (id) {
      await logSessionEnd(id, outcome, {
        checkedTakeawaysCount: takeawaysCount,
        elapsedSeconds: elapsedSec,
      });
    }

    if (outcome === 'save' && session) {
      for (const card of session.cards) {
        const already = await isCardSaved(card.id);
        if (!already) {
          await saveCard(card, session.intent);
        }
      }
    }

    if (outcome === 'refine') {
      const nextQuery = refineQuery ?? '';
      const prev = session?.intent ?? '';
      router.replace(
        `/?refine=${encodeURIComponent(nextQuery)}&prevIntent=${encodeURIComponent(prev)}`
      );
      return;
    }

    router.replace('/');
  };

  const suggestedRefinements = session?.meta?.suggestedRefinements ?? [];
  const elapsedMinDisplay =
    elapsedSec > 0 ? `${Math.max(1, Math.round(elapsedSec / 60))}m spent` : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Completion Crest */}
        <View style={styles.checkOrb}>
          <Text style={styles.emoji}>✓</Text>
        </View>

        <Text style={styles.title}>That's all.</Text>
        <Text style={styles.subtitle}>Did you get what you needed?</Text>

        {/* Session Summary Pill Row */}
        {session && (
          <View style={styles.summaryCard}>
            <Text style={styles.intentQuoted}>“{session.intent}”</Text>
            <Text style={styles.meta}>
              {session.cards.length} cards  ·  {session.mode}  ·  {session.timeboxMin} min
              {elapsedMinDisplay ? `  ·  ${elapsedMinDisplay}` : ''}
            </Text>

            {takeawaysCount > 0 && (
              <View style={styles.takeawayBadge}>
                <Text style={styles.takeawayBadgeText}>
                  ✦ {takeawaysCount} key takeaway{takeawaysCount === 1 ? '' : 's'} mastered
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Primary Outcome Buttons */}
        <View style={styles.actions}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => handleOutcome('done')}
          >
            <Text style={styles.primaryButtonText}>✓  Done — I got what I needed</Text>
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
            <Text style={styles.tertiaryButtonText}>★  Save deck for later</Text>
          </Pressable>
        </View>

        {/* Guided Smart Refinement Chips (Starts a fresh session with a sharper intent) */}
        {suggestedRefinements.length > 0 && (
          <View style={styles.refinementsBox}>
            <Text style={styles.refinementsTitle}>
              NEED TO GO DEEPER? START A FRESH REFINED SESSION:
            </Text>
            <View style={styles.refinementChips}>
              {suggestedRefinements.map((refQuery) => (
                <Pressable
                  key={refQuery}
                  style={styles.refinementChip}
                  onPress={() => handleOutcome('refine', refQuery)}
                >
                  <Text style={styles.refinementChipText}>↗  {refQuery}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  checkOrb: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.accentDim,
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emoji: {
    fontSize: 40,
    color: Colors.accent,
    fontWeight: '800',
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  summaryCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  intentQuoted: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  meta: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  takeawayBadge: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.accentDim,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  takeawayBadgeText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '700',
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
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: Colors.accent,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.md,
    alignItems: 'center',
    backgroundColor: Colors.accentDim,
  },
  secondaryButtonText: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  tertiaryButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  tertiaryButtonText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  refinementsBox: {
    width: '100%',
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  refinementsTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  refinementChips: {
    gap: Spacing.xs + 2,
  },
  refinementChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  refinementChipText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});

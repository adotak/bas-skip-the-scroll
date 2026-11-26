import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import type { SessionOutcome } from '@skip-the-scroll/shared';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { getStoredSession } from '@/store/sessionStore';
import { logSessionEnd, saveCard, isCardSaved } from '@/store/storage';

/**
 * Modeled directly on UI.html `.card-certificate` (line 7022):
 * - Top 10px solid award border (`#FFF083` / `#AAEEC4`)
 * - Editorial certificate header with `W.` monogram and date
 * - 1px solid horizontal rule dividers around the completed intent title
 */
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
        <View style={styles.certificateCard}>
          {/* Certificate Header (.card-certificate__header) */}
          <View style={styles.certHeader}>
            <Text style={styles.certMonogram}>W.</Text>
            <View style={styles.certMetaGroup}>
              <Text style={styles.certMetaText}>FINITE SESSION CERTIFICATE</Text>
              <View style={styles.mintBadge}>
                <Text style={styles.mintBadgeText}>COMPLETED ✓</Text>
              </View>
            </View>
          </View>

          <Text style={styles.title}>That's all.</Text>
          <Text style={styles.subtitle}>Did you get what you needed?</Text>

          {/* Session Summary (.card-certificate__title & .card-certificate__by) */}
          {session && (
            <View style={styles.certBody}>
              <Text style={styles.intentQuoted}>“{session.intent}”</Text>
              <Text style={styles.meta}>
                {session.cards.length} cards  ·  {session.mode}  ·  {session.timeboxMin} min
                {elapsedMinDisplay ? `  ·  ${elapsedMinDisplay}` : ''}
              </Text>

              {takeawaysCount > 0 && (
                <View style={styles.takeawayBadge}>
                  <Text style={styles.takeawayBadgeText}>
                    ✦ {takeawaysCount} KEY TAKEAWAY{takeawaysCount === 1 ? '' : 'S'} MASTERED
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Primary Outcome Buttons (.button & .button--outline) */}
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

        {/* Guided Smart Refinement Chips (.list-tags & .button--tag) */}
        {suggestedRefinements.length > 0 && (
          <View style={styles.refinementsBox}>
            <Text style={styles.refinementsTitle}>
              START A FRESH REFINED SESSION:
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
    padding: Spacing.lg,
  },
  certificateCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: Colors.surface, // #FFFFFF
    borderRadius: Radius.lg,
    borderTopWidth: 10,
    borderTopColor: Colors.mint,     // #AAEEC4 (.card-certificate)
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
  },
  certHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  certMonogram: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  certMetaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  certMetaText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  mintBadge: {
    backgroundColor: Colors.mint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  mintBadgeText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.hero,
    fontWeight: '900',
    letterSpacing: -1.2,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginBottom: Spacing.lg,
  },
  certBody: {
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  intentQuoted: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: 6,
  },
  meta: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  takeawayBadge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    backgroundColor: Colors.lemon,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  takeawayBadgeText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
  },
  primaryButton: {
    backgroundColor: Colors.surfaceDark, // #222222
    height: 52,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: Colors.lemon, // #FFF083
    height: 50,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  tertiaryButton: {
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.surface,
    height: 50,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tertiaryButtonText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  refinementsBox: {
    width: '100%',
    maxWidth: 520,
    marginTop: Spacing.lg,
  },
  refinementsTitle: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  refinementChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  refinementChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.textMuted,
    borderRadius: Radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  refinementChipText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});

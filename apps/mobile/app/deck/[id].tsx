import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LANGUAGE_LABELS } from '@skip-the-scroll/shared';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { CardView } from '@/components/CardView';
import ContentPager from '@/components/ContentPager';
import { Counter } from '@/components/Counter';
import { SessionTimerBar } from '@/components/SessionTimerBar';
import { getStoredSession } from '@/store/sessionStore';
import { saveCard, getSavedCardIds } from '@/store/storage';

export default function DeckScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = getStoredSession(id ?? '');
  const [currentPage, setCurrentPage] = useState(0);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [takeawaysByCard, setTakeawaysByCard] = useState<Record<string, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    getSavedCardIds().then(setSavedIds);
  }, []);

  const handleSave = useCallback(
    async (cardId: string) => {
      if (!session) return;
      const card = session.cards.find((c) => c.id === cardId);
      if (card) {
        const nowSaved = await saveCard(card, session.intent);
        setSavedIds((prev) =>
          nowSaved ? [...prev, cardId] : prev.filter((item) => item !== cardId)
        );
      }
    },
    [session]
  );

  const handleTakeawayChange = useCallback((cardId: string, checkedCount: number) => {
    setTakeawaysByCard((prev) => ({ ...prev, [cardId]: checkedCount }));
  }, []);

  // ── Error state ──────────────────────────────────────────────────────────
  if (!session) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Session not found.</Text>
        <Text style={styles.errorSubtitle}>
          It may have expired or this link may be invalid.
        </Text>
        <Pressable style={styles.backButton} onPress={() => router.replace('/')}>
          <Text style={styles.backButtonText}>Back to start</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!Array.isArray(session.cards) || session.cards.length === 0) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.emptyEmoji}>○</Text>
        <Text style={styles.errorText}>No cards found.</Text>
        <Text style={styles.errorSubtitle}>
          Try a broader intent or choose a different mode.
        </Text>
        <Pressable
          style={styles.primaryEmptyButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.primaryEmptyButtonText}>Refine intent</Text>
        </Pressable>
        <Pressable style={styles.backButton} onPress={() => router.replace('/')}>
          <Text style={styles.backButtonText}>Back to start</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const totalCards = session.cards.length;
  const isLastCard = currentPage === totalCards - 1;
  const totalCardMinutes =
    session.meta?.totalMinutes ??
    session.cards.reduce((sum, c) => sum + c.minutes, 0);

  const savedIndices = session.cards
    .map((c, idx) => (savedIds.includes(c.id) ? idx : -1))
    .filter((idx) => idx >= 0);

  const totalTakeawaysChecked = Object.values(takeawaysByCard).reduce(
    (sum, n) => sum + n,
    0
  );

  const goToEndScreen = () => {
    router.push(
      `/end/${id}?takeaways=${totalTakeawaysChecked}&elapsed=${elapsedSeconds}`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Intent & Provenance Top Bar */}
      <View style={styles.topHeader}>
        <Pressable
          onPress={() => router.back()}
          style={styles.exitBtn}
          accessibilityLabel="Back to intent screen"
        >
          <Text style={styles.exitBtnText}>←</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.intentTitle} numberOfLines={1}>
            {session.intent}
          </Text>
          <View style={styles.metaPillsRow}>
            <Text style={styles.modeTag}>{session.mode.toUpperCase()}</Text>
            {session.lang && session.lang !== 'en' && (
              <Text style={styles.langTag}>{LANGUAGE_LABELS[session.lang]}</Text>
            )}
            <Text style={styles.provenanceTag}>
              {session.meta?.isCached
                ? '⚡ Instant Cache'
                : session.meta?.isFallback
                  ? '📦 Smart Curated'
                  : '✦ Live Curated'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={goToEndScreen}
          style={styles.earlyFinishBtn}
          accessibilityLabel="Wrap up session early"
        >
          <Text style={styles.earlyFinishText}>Done ✓</Text>
        </Pressable>
      </View>

      {/* Notice banner if fewer than 3 cards or offline notice */}
      {(totalCards < 3 || session.meta?.notice) && (
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeText}>
            {session.meta?.notice ??
              `Found ${totalCards} high-signal cards (we never pad with low-quality results).`}
          </Text>
        </View>
      )}

      {/* Live Time-Box Timer & Pacing Bar */}
      <SessionTimerBar
        timeboxMin={session.timeboxMin}
        totalCardMinutes={totalCardMinutes}
        onElapsedChange={setElapsedSeconds}
      />

      {/* Counter & Segmented Progress Bar */}
      <Counter
        current={currentPage + 1}
        total={totalCards}
        savedIndices={savedIndices}
        onSelectIndex={setCurrentPage}
      />

      {/* Horizontal pager — one card per screen */}
      <ContentPager
        style={styles.pager}
        initialPage={0}
        activePage={currentPage}
        onPageSelected={setCurrentPage}
      >
        {session.cards.map((card) => (
          <View key={card.id} style={styles.page}>
            <CardView
              card={card}
              isSaved={savedIds.includes(card.id)}
              onSave={handleSave}
              onTakeawayChange={handleTakeawayChange}
            />
          </View>
        ))}
      </ContentPager>

      {/* Bottom Deck Controls + End-of-Deck Prompt */}
      <View style={styles.bottomBar}>
        {isLastCard ? (
          <Pressable style={styles.endButton} onPress={goToEndScreen}>
            <Text style={styles.endButtonText}>That's all — wrap up →</Text>
          </Pressable>
        ) : (
          <View style={styles.navRow}>
            <Pressable
              style={[styles.navBtn, currentPage === 0 && styles.navBtnDisabled]}
              disabled={currentPage === 0}
              onPress={() => setCurrentPage((p) => Math.max(0, p - 1))}
            >
              <Text style={styles.navBtnText}>← Prev</Text>
            </Pressable>

            <Text style={styles.navStatusText}>
              Swipe or tap  ·  {savedIds.length} saved
            </Text>

            <Pressable
              style={styles.navBtnPrimary}
              onPress={() => setCurrentPage((p) => Math.min(totalCards - 1, p + 1))}
            >
              <Text style={styles.navBtnPrimaryText}>Next Card →</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitBtnText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  headerCenter: {
    flex: 1,
  },
  intentTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  metaPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  modeTag: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  langTag: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  provenanceTag: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  earlyFinishBtn: {
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  earlyFinishText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  noticeBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: 4,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  noticeText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.xs,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  navBtn: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  navBtnText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  navStatusText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  navBtnPrimary: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  navBtnPrimaryText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  endButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  endButtonText: {
    color: Colors.bg,
    fontSize: FontSize.md,
    fontWeight: '800',
  },

  // Error state
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.lg,
    marginBottom: Spacing.lg,
  },
  emptyEmoji: {
    color: Colors.accent,
    fontSize: 56,
    marginBottom: Spacing.sm,
  },
  errorSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  primaryEmptyButton: {
    width: '100%',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  primaryEmptyButtonText: {
    color: Colors.bg,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  backButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  backButtonText: {
    color: Colors.text,
    fontSize: FontSize.md,
  },
});

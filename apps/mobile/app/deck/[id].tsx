import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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

  // Performance Optimization: store elapsed seconds in a ref so the 1-second
  // timer tick inside SessionTimerBar causes zero re-renders of DeckScreen or CardView.
  const elapsedSecondsRef = useRef(0);
  const handleElapsedChange = useCallback((sec: number) => {
    elapsedSecondsRef.current = sec;
  }, []);

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

  const savedIndices = useMemo(() => {
    if (!session || !Array.isArray(session.cards)) return [];
    return session.cards
      .map((c, idx) => (savedIds.includes(c.id) ? idx : -1))
      .filter((idx) => idx >= 0);
  }, [session, savedIds]);

  const totalTakeawaysChecked = useMemo(
    () => Object.values(takeawaysByCard).reduce((sum, n) => sum + n, 0),
    [takeawaysByCard]
  );

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

  const goToEndScreen = () => {
    router.push(
      `/end/${id}?takeaways=${totalTakeawaysChecked}&elapsed=${elapsedSecondsRef.current}`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Editorial Header Main (.header-main) */}
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
            <View style={styles.modePill}>
              <Text style={styles.modeTag}>{session.mode.toUpperCase()}</Text>
            </View>
            {session.lang && session.lang !== 'en' && (
              <Text style={styles.langTag}>{LANGUAGE_LABELS[session.lang]}</Text>
            )}
            <Text style={styles.provenanceTag}>
              {session.meta?.isCached
                ? '⚡ CACHED'
                : session.meta?.isFallback
                  ? '📦 SMART DECK'
                  : '✦ LIVE CURATED'}
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
        onElapsedChange={handleElapsedChange}
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

      {/* Floating Bottom Deck Dock (.menu-float style) */}
      <View style={styles.floatingDockOuter} pointerEvents="box-none">
        <View style={styles.floatingDockWrapper}>
          <Pressable
            style={[styles.dockNavBtn, currentPage === 0 && styles.dockNavBtnDisabled]}
            disabled={currentPage === 0}
            onPress={() => setCurrentPage((p) => Math.max(0, p - 1))}
          >
            <Text style={styles.dockNavBtnText}>← Prev</Text>
          </Pressable>

          <View style={styles.dockStatusCenter}>
            <Text style={styles.dockMonogram}>W.</Text>
            <Text style={styles.dockStatusText}>
              {currentPage + 1}/{totalCards} · {savedIds.length} saved
            </Text>
          </View>

          {isLastCard ? (
            <Pressable style={styles.endButton} onPress={goToEndScreen}>
              <Text style={styles.endButtonText}>That's all — wrap up →</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.dockNextBtn}
              onPress={() => setCurrentPage((p) => Math.min(totalCards - 1, p + 1))}
            >
              <Text style={styles.dockNextBtnText}>Next Card →</Text>
            </Pressable>
          )}
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  exitBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitBtnText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  headerCenter: {
    flex: 1,
  },
  intentTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  metaPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  modePill: {
    backgroundColor: Colors.lemon,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  modeTag: {
    color: Colors.text,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  langTag: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  provenanceTag: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  earlyFinishBtn: {
    backgroundColor: Colors.surfaceDark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  earlyFinishText: {
    color: Colors.textInverse,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  noticeBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.xs,
    backgroundColor: Colors.lemonSoft,
    borderLeftWidth: 3,
    borderLeftColor: Colors.surfaceDark,
  },
  noticeText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    minHeight: 0,
  },
  floatingDockOuter: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  floatingDockWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceGlass, // rgba(34,34,34,0.88)
    padding: 6,
    borderRadius: Radius.md,
    gap: 6,
  },
  dockNavBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceDarkInner,
    borderWidth: 1,
    borderColor: Colors.surfaceDarkBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockNavBtnDisabled: {
    opacity: 0.35,
  },
  dockNavBtnText: {
    color: '#DEDEDE',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  dockStatusCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 5,
  },
  dockMonogram: {
    color: Colors.textInverse,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  dockStatusText: {
    color: '#A7A7A7',
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  dockNextBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: Radius.sm,
    backgroundColor: Colors.lemon, // #FFF083
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockNextBtnText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  endButton: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: Colors.mint, // #AAEEC4
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endButtonText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '900',
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
    color: Colors.vermilion,
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: Spacing.lg,
  },
  emptyEmoji: {
    color: Colors.text,
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
    backgroundColor: Colors.surfaceDark,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  primaryEmptyButtonText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  backButton: {
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.sm,
  },
  backButtonText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});

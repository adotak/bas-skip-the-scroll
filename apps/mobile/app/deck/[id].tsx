import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { CardView } from '@/components/CardView';
import ContentPager from '@/components/ContentPager';
import { Counter } from '@/components/Counter';
import { getStoredSession } from '@/store/sessionStore';
import { saveCard } from '@/store/storage';

export default function DeckScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = getStoredSession(id ?? '');
  const [currentPage, setCurrentPage] = useState(0);

  const handleSave = useCallback(async (cardId: string) => {
    if (!session) return;
    const card = session.cards.find((c) => c.id === cardId);
    if (card) {
      await saveCard(card, session.intent);
    }
  }, [session]);

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
        <Pressable style={styles.primaryEmptyButton} onPress={() => router.replace('/')}>
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Counter */}
      <Counter current={currentPage + 1} total={totalCards} />

      {/* Horizontal pager — one card per screen */}
      <ContentPager
        style={styles.pager}
        initialPage={0}
        onPageSelected={setCurrentPage}
      >
        {session.cards.map((card) => (
          <View key={card.id} style={styles.page}>
            <CardView card={card} onSave={handleSave} />
          </View>
        ))}
      </ContentPager>

      {/* End-of-deck prompt — only visible on the last card */}
      {isLastCard && (
        <Pressable
          style={styles.endButton}
          onPress={() => router.push(`/end/${id}`)}
        >
          <Text style={styles.endButtonText}>That's all — wrap up →</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  endButton: {
    backgroundColor: Colors.accent,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  endButtonText: {
    color: Colors.bg,
    fontSize: FontSize.md,
    fontWeight: '700',
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

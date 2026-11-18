import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Linking,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { getSavedCards, removeSavedCard, type SavedCardRecord } from '@/store/storage';

const KIND_BADGES = {
  video: '▶  Video',
  article: '📄  Article',
  doc: '📖  Doc',
};

export default function LibraryScreen() {
  const [savedRecords, setSavedRecords] = useState<SavedCardRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCards = useCallback(async () => {
    const list = await getSavedCards();
    setSavedRecords(list);
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleRemove = async (cardId: string) => {
    await removeSavedCard(cardId);
    await loadCards();
  };

  const filtered = savedRecords.filter((rec) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      rec.card.title.toLowerCase().includes(q) ||
      rec.card.source.toLowerCase().includes(q) ||
      rec.intent.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Saved Library</Text>
      </View>

      {/* Search Input */}
      {savedRecords.length > 0 && (
        <TextInput
          style={styles.searchBar}
          placeholder="Filter saved cards..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      )}

      {/* Card List or Empty State */}
      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📚</Text>
          <Text style={styles.emptyTitle}>
            {savedRecords.length === 0 ? 'No saved cards yet' : 'No matching cards'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {savedRecords.length === 0
              ? 'Save cards during any deck session or on the end screen to build your intentional reference library.'
              : 'Try a different search query.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.card.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const { card, intent, savedAt } = item;
            return (
              <View style={styles.cardItem}>
                <View style={styles.cardHeader}>
                  <View style={styles.kindBadge}>
                    <Text style={styles.kindText}>
                      {KIND_BADGES[card.kind] || card.kind}
                    </Text>
                  </View>
                  <Text style={styles.intentTag}>From: {intent}</Text>
                </View>

                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSource}>
                  {card.source}  ·  {card.minutes} min
                </Text>

                {/* TL;DR Bullets */}
                <View style={styles.tldrContainer}>
                  {card.tldr.map((bullet, i) => (
                    <Text key={i} style={styles.bulletText}>
                      •  {bullet}
                    </Text>
                  ))}
                </View>

                {/* Action buttons */}
                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.openBtn}
                    onPress={() => {
                      if (card.url) {
                        Linking.openURL(card.url).catch(() => {});
                      }
                    }}
                  >
                    <Text style={styles.openBtnText}>
                      {card.kind === 'video' ? '▶  Play' : '↗  Open'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.removeBtn}
                    onPress={() => handleRemove(card.id)}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    paddingRight: Spacing.md,
  },
  backBtnText: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  searchBar: {
    backgroundColor: Colors.surface,
    color: Colors.text,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardItem: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  kindBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  kindText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  intentTag: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontStyle: 'italic',
  },
  cardTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: FontSize.lg * 1.3,
  },
  cardSource: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  tldrContainer: {
    backgroundColor: Colors.bg,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.md,
  },
  bulletText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.4,
    marginBottom: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  openBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  openBtnText: {
    color: Colors.bg,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  removeBtn: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  removeBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.4,
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Linking,
  TextInput,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import {
  getSavedCards,
  removeSavedCard,
  toggleSavedCardCompleted,
  saveCardNote,
  toggleCardTakeaway,
  exportStudyGuideMarkdown,
  type SavedCardRecord,
} from '@/store/storage';

const KIND_BADGES = {
  video: '▶  Video',
  article: '📄  Article',
  doc: '📖  Doc',
};

type FilterTab = 'all' | 'video' | 'article' | 'doc' | 'notes' | 'unreviewed';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'video', label: '▶ Videos' },
  { key: 'article', label: '📄 Articles' },
  { key: 'doc', label: '📖 Docs' },
  { key: 'notes', label: '✎ With Notes' },
  { key: 'unreviewed', label: '○ To Review' },
];

export default function LibraryScreen() {
  const [savedRecords, setSavedRecords] = useState<SavedCardRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [editingNoteCardId, setEditingNoteCardId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');

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

  const handleToggleCompleted = async (cardId: string) => {
    await toggleSavedCardCompleted(cardId);
    await loadCards();
  };

  const handleToggleTakeaway = async (cardId: string, bulletIdx: number) => {
    await toggleCardTakeaway(cardId, bulletIdx);
    await loadCards();
  };

  const handleSaveInlineNote = async (cardId: string) => {
    await saveCardNote(cardId, draftNote);
    setEditingNoteCardId(null);
    await loadCards();
  };

  const handleExportStudyGuide = async () => {
    try {
      const md = await exportStudyGuideMarkdown();
      await Share.share({
        message: md,
        title: 'SkipTheScroll_StudyGuide.md',
      });
    } catch {
      Alert.alert('Export Failed', 'Could not share your study guide.');
    }
  };

  const filtered = savedRecords.filter((rec) => {
    if (activeFilter === 'video' && rec.card.kind !== 'video') return false;
    if (activeFilter === 'article' && rec.card.kind !== 'article') return false;
    if (activeFilter === 'doc' && rec.card.kind !== 'doc') return false;
    if (activeFilter === 'notes' && !rec.note) return false;
    if (activeFilter === 'unreviewed' && rec.completed) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      rec.card.title.toLowerCase().includes(q) ||
      rec.card.source.toLowerCase().includes(q) ||
      rec.intent.toLowerCase().includes(q) ||
      (rec.note?.toLowerCase().includes(q) ?? false)
    );
  });

  const reviewedCount = savedRecords.filter((r) => r.completed).length;
  const notesCount = savedRecords.filter((r) => !!r.note).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Saved Library</Text>
        {savedRecords.length > 0 && (
          <Pressable onPress={handleExportStudyGuide} style={styles.exportHeaderBtn}>
            <Text style={styles.exportHeaderText}>📤 Study Guide</Text>
          </Pressable>
        )}
      </View>

      {/* Summary Metrics Strip */}
      {savedRecords.length > 0 && (
        <View style={styles.statsStrip}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{savedRecords.length}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{reviewedCount}</Text>
            <Text style={styles.statLabel}>Reviewed ✓</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{notesCount}</Text>
            <Text style={styles.statLabel}>With Notes ✎</Text>
          </View>
        </View>
      )}

      {/* Search Input & Filter Pills */}
      {savedRecords.length > 0 && (
        <View>
          <TextInput
            style={styles.searchBar}
            placeholder="Filter saved cards, intents, or personal notes..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <FlatList
            horizontal
            data={FILTER_TABS}
            keyExtractor={(t) => t.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsRow}
            renderItem={({ item }) => {
              const isActive = activeFilter === item.key;
              return (
                <Pressable
                  onPress={() => setActiveFilter(item.key)}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
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
              : 'Try a different search query or filter tab.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.card.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const { card, intent, note, completed, checkedBullets = [] } = item;
            const isEditingNote = editingNoteCardId === card.id;

            return (
              <View style={[styles.cardItem, completed && styles.cardItemCompleted]}>
                <View style={styles.cardHeader}>
                  <View style={styles.kindBadge}>
                    <Text style={styles.kindText}>
                      {KIND_BADGES[card.kind] || card.kind}
                    </Text>
                  </View>
                  <Text style={styles.intentTag} numberOfLines={1}>
                    From: {intent}
                  </Text>
                </View>

                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSource}>
                  {card.source}  ·  {card.minutes} min
                </Text>

                {/* Interactive TL;DR Bullets */}
                <View style={styles.tldrContainer}>
                  {card.tldr.map((bullet, i) => {
                    const isChecked = checkedBullets.includes(i);
                    return (
                      <Pressable
                        key={i}
                        onPress={() => handleToggleTakeaway(card.id, i)}
                        style={styles.bulletTouchRow}
                      >
                        <Text
                          style={[
                            styles.bulletText,
                            isChecked && styles.bulletTextChecked,
                          ]}
                        >
                          {isChecked ? '✓  ' : '•  '}
                          {bullet}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Personal Note Box */}
                {isEditingNote ? (
                  <View style={styles.inlineNoteEditor}>
                    <TextInput
                      style={styles.inlineNoteInput}
                      value={draftNote}
                      onChangeText={setDraftNote}
                      placeholder="Add your personal reflection or code snippet..."
                      placeholderTextColor={Colors.textMuted}
                      multiline
                    />
                    <View style={styles.inlineNoteActions}>
                      <Pressable
                        onPress={() => setEditingNoteCardId(null)}
                        style={styles.removeBtn}
                      >
                        <Text style={styles.removeBtnText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleSaveInlineNote(card.id)}
                        style={styles.saveNoteSmallBtn}
                      >
                        <Text style={styles.saveNoteSmallText}>Save Note</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => {
                      setDraftNote(note ?? '');
                      setEditingNoteCardId(card.id);
                    }}
                    style={styles.notePreviewBox}
                  >
                    <Text style={styles.notePreviewText}>
                      {note ? `✎  Note: ${note}` : '+ Add personal note'}
                    </Text>
                  </Pressable>
                )}

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
                    style={[
                      styles.reviewBtn,
                      completed && styles.reviewBtnActive,
                    ]}
                    onPress={() => handleToggleCompleted(card.id)}
                  >
                    <Text
                      style={[
                        styles.reviewBtnText,
                        completed && styles.reviewBtnTextActive,
                      ]}
                    >
                      {completed ? '✓ Reviewed' : 'Mark Reviewed'}
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
    flex: 1,
  },
  exportHeaderBtn: {
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  exportHeaderText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  statsStrip: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  statPill: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statValue: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  searchBar: {
    backgroundColor: Colors.surface,
    color: Colors.text,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabsRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs + 2,
  },
  filterChip: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.accent,
    fontWeight: '700',
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
  cardItemCompleted: {
    borderColor: Colors.borderAccent,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
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
    fontSize: FontSize.xs,
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
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
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.sm,
  },
  bulletTouchRow: {
    paddingVertical: 3,
  },
  bulletText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.4,
  },
  bulletTextChecked: {
    color: Colors.accent,
  },
  notePreviewBox: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 8,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  notePreviewText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontStyle: 'italic',
  },
  inlineNoteEditor: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  inlineNoteInput: {
    color: Colors.text,
    fontSize: FontSize.sm,
    minHeight: 48,
    marginBottom: Spacing.xs,
  },
  inlineNoteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
  },
  saveNoteSmallBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  saveNoteSmallText: {
    color: Colors.bg,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
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
  reviewBtn: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceLight,
  },
  reviewBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  reviewBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  reviewBtnTextActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
  removeBtn: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  removeBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
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

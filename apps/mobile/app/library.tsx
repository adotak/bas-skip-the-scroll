import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { FloatingMenuDock } from '@/components/FloatingMenuDock';
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

  const handleRemove = useCallback(
    async (cardId: string) => {
      await removeSavedCard(cardId);
      await loadCards();
    },
    [loadCards]
  );

  const handleToggleCompleted = useCallback(
    async (cardId: string) => {
      await toggleSavedCardCompleted(cardId);
      await loadCards();
    },
    [loadCards]
  );

  const handleToggleTakeaway = useCallback(
    async (cardId: string, bulletIdx: number) => {
      await toggleCardTakeaway(cardId, bulletIdx);
      await loadCards();
    },
    [loadCards]
  );

  const handleSaveInlineNote = useCallback(
    async (cardId: string) => {
      await saveCardNote(cardId, draftNote);
      setEditingNoteCardId(null);
      await loadCards();
    },
    [draftNote, loadCards]
  );

  const handleExportStudyGuide = useCallback(async () => {
    try {
      const md = await exportStudyGuideMarkdown();
      await Share.share({
        message: md,
        title: 'SkipTheScroll_StudyGuide.md',
      });
    } catch {
      Alert.alert('Export Failed', 'Could not share your study guide.');
    }
  }, []);

  const filtered = useMemo(() => {
    return savedRecords.filter((rec) => {
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
  }, [savedRecords, activeFilter, searchQuery]);

  const reviewedCount = useMemo(
    () => savedRecords.filter((r) => r.completed).length,
    [savedRecords]
  );
  const notesCount = useMemo(
    () => savedRecords.filter((r) => !!r.note).length,
    [savedRecords]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Editorial Header (.c-heading & .head-toolbar) */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>W.COLLECTIONS</Text>
          <Text style={styles.title}>Saved Library</Text>
        </View>
        {savedRecords.length > 0 && (
          <Pressable onPress={handleExportStudyGuide} style={styles.exportHeaderBtn}>
            <Text style={styles.exportHeaderText}>📤 Study Guide</Text>
          </Pressable>
        )}
      </View>

      {/* Box-Score Metrics Strip (.c-boxes-score) */}
      {savedRecords.length > 0 && (
        <View style={styles.statsStrip}>
          <View style={styles.boxScore}>
            <Text style={styles.boxScoreLabel}>COLLECTED</Text>
            <Text style={styles.boxScoreValue}>{savedRecords.length}</Text>
          </View>
          <View style={[styles.boxScore, { backgroundColor: Colors.mintSoft }]}>
            <Text style={styles.boxScoreLabel}>REVIEWED ✓</Text>
            <Text style={styles.boxScoreValue}>{reviewedCount}</Text>
          </View>
          <View style={[styles.boxScore, { backgroundColor: Colors.lemonSoft }]}>
            <Text style={styles.boxScoreLabel}>WITH NOTES ✎</Text>
            <Text style={styles.boxScoreValue}>{notesCount}</Text>
          </View>
        </View>
      )}

      {/* Search & Filter Container (.nav-filters__container) */}
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
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          renderItem={({ item }) => {
            const { card, intent, note, completed, checkedBullets = [] } = item;
            const isEditingNote = editingNoteCardId === card.id;
            const kindBg =
              card.kind === 'video'
                ? Colors.lemon
                : card.kind === 'doc'
                  ? Colors.sky
                  : Colors.mint;

            return (
              <View style={[styles.cardItem, completed && styles.cardItemCompleted]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.kindBadge, { backgroundColor: kindBg }]}>
                    <Text style={styles.kindText}>
                      {KIND_BADGES[card.kind] || card.kind}
                    </Text>
                  </View>
                  <Text style={styles.intentTag} numberOfLines={1}>
                    Intent: {intent}
                  </Text>
                </View>

                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSource}>
                  {card.source}  ·  {card.minutes} min
                </Text>

                {/* Interactive TL;DR Bullets (.tb-dotteds) */}
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
                          {isChecked ? '✓  ' : `0${i + 1} · `}
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
                      {note ? `✎  Note: ${note}` : '+ Add personal takeaway note'}
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

      <FloatingMenuDock
        activeTab="library"
        ctaLabel={savedRecords.length > 0 ? 'Export .MD' : undefined}
        onCtaPress={savedRecords.length > 0 ? handleExportStudyGuide : undefined}
      />
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
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  eyebrow: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  exportHeaderBtn: {
    backgroundColor: Colors.surfaceDark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  exportHeaderText: {
    color: Colors.textInverse,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  statsStrip: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  boxScore: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xs,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  boxScoreLabel: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  boxScoreValue: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '900',
  },
  searchBar: {
    backgroundColor: Colors.surfaceLight, // #EDEDED (.search-form)
    color: Colors.text,
    marginHorizontal: Spacing.lg,
    marginVertical: 6,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: Radius.sm,
    fontWeight: '500',
  },
  filterTabsRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 4,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.surfaceDark,
    borderColor: Colors.surfaceDark,
  },
  filterChipText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  list: {
    padding: Spacing.lg,
    paddingBottom: 110,
    gap: Spacing.md,
  },
  cardItem: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardItemCompleted: {
    borderColor: Colors.borderStrong,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  kindBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  kindText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  intentTag: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  cardTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: 4,
    lineHeight: FontSize.lg * 1.25,
  },
  cardSource: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  tldrContainer: {
    backgroundColor: Colors.bg,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bulletTouchRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    borderBottomColor: Colors.border,
  },
  bulletText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.4,
  },
  bulletTextChecked: {
    fontWeight: '700',
  },
  notePreviewBox: {
    backgroundColor: Colors.lemonSoft,
    borderRadius: Radius.xs,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: Spacing.md,
  },
  notePreviewText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  inlineNoteEditor: {
    backgroundColor: Colors.bg,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
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
    backgroundColor: Colors.surfaceDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.xs,
  },
  saveNoteSmallText: {
    color: Colors.textInverse,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  openBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceDark,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  openBtnText: {
    color: Colors.textInverse,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  reviewBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.surface,
  },
  reviewBtnActive: {
    backgroundColor: Colors.mint,
  },
  reviewBtnText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  reviewBtnTextActive: {
    color: Colors.text,
    fontWeight: '800',
  },
  removeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  removeBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.4,
  },
});

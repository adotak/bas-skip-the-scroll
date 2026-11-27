import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { Card } from '@skip-the-scroll/shared';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { getYouTubeEmbedUrl } from '@/components/youtube';
import {
  getCardTakeaways,
  toggleCardTakeaway,
  getCardNote,
  saveCardNote,
} from '@/store/storage';

const KIND_BADGES: Record<Card['kind'], string> = {
  video: '▶  Video',
  article: '📄  Article',
  doc: '📖  Doc',
};

const DIFFICULTY_LABELS: Record<NonNullable<Card['difficulty']>, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

interface CardViewProps {
  card: Card;
  isSaved?: boolean;
  onSave?: (cardId: string) => void;
  onTakeawayChange?: (cardId: string, checkedCount: number) => void;
}

export function CardView({
  card,
  isSaved = false,
  onSave,
  onTakeawayChange,
}: CardViewProps) {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [showLiveWebInReader, setShowLiveWebInReader] = useState(false);
  const [checkedBullets, setCheckedBullets] = useState<number[]>([]);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSavedToast, setNoteSavedToast] = useState(false);

  const embedUrl = getYouTubeEmbedUrl(card);

  useEffect(() => {
    let mounted = true;
    Promise.all([getCardTakeaways(card.id), getCardNote(card.id)]).then(
      ([takeaways, savedNote]) => {
        if (!mounted) return;
        setCheckedBullets(takeaways);
        setNoteText(savedNote);
      }
    );
    return () => {
      mounted = false;
    };
  }, [card.id]);

  const handleToggleBullet = async (idx: number) => {
    const updated = await toggleCardTakeaway(card.id, idx);
    setCheckedBullets(updated);
    onTakeawayChange?.(card.id, updated.length);
  };

  const handleSaveNote = async () => {
    await saveCardNote(card.id, noteText);
    setNoteSavedToast(true);
    setTimeout(() => setNoteSavedToast(false), 1800);
  };

  const openCard = () => {
    if (card.kind === 'video' && embedUrl) {
      setIsPlayerOpen(true);
      return;
    }

    if (card.url) {
      Linking.openURL(card.url).catch((err) =>
        console.warn('Failed to open URL:', err)
      );
    }
  };

  const kindColor =
    card.kind === 'video'
      ? Colors.videoAccent
      : card.kind === 'doc'
        ? Colors.docAccent
        : Colors.articleAccent;

  const kindBg =
    card.kind === 'video'
      ? Colors.videoAccentDim
      : card.kind === 'doc'
        ? Colors.docAccentDim
        : Colors.articleAccentDim;

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={styles.cardSurface}>
          {/* Thumbnail */}
          {card.thumbnail ? (
            <Pressable onPress={openCard} style={styles.thumbnailWrapper}>
              <Image source={{ uri: card.thumbnail }} style={styles.thumbnail} />
              <View style={styles.durationOverlay}>
                <Text style={styles.durationOverlayText}>{card.minutes} min</Text>
              </View>
            </Pressable>
          ) : (
            <View style={[styles.thumbnailPlaceholder, { borderColor: kindBg }]}>
              <Text style={[styles.thumbnailPlaceholderText, { color: kindColor }]}>
                {KIND_BADGES[card.kind]}
              </Text>
              <Text style={styles.thumbnailDurationText}>{card.minutes} min estimate</Text>
            </View>
          )}

          {/* Meta Badge Row: Kind + Difficulty + Signal Match */}
          <View style={styles.badgeRow}>
            <View style={[styles.kindBadge, { backgroundColor: kindBg }]}>
              <Text style={[styles.kindText, { color: kindColor }]}>
                {KIND_BADGES[card.kind]}
              </Text>
            </View>

            {card.difficulty && (
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyText}>
                  {DIFFICULTY_LABELS[card.difficulty]}
                </Text>
              </View>
            )}

            {card.qualityScore && (
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>✦ {card.qualityScore}% signal</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{card.title}</Text>

          {/* Source + duration */}
          <Text style={styles.meta}>
            {card.source}  ·  {card.minutes} min
          </Text>

          {/* Topic tags */}
          {card.tags && card.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {card.tags.map((tag) => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Interactive TL;DR Takeaways Checklist */}
          <View style={styles.tldrBox}>
            <View style={styles.tldrHeaderRow}>
              <Text style={styles.tldrLabel}>TL;DR · Key Takeaways</Text>
              <Text style={styles.tldrProgress}>
                {checkedBullets.length}/3 mastered
              </Text>
            </View>

            {card.tldr.map((bullet, i) => {
              const isChecked = checkedBullets.includes(i);
              return (
                <Pressable
                  key={i}
                  onPress={() => handleToggleBullet(i)}
                  style={[styles.bulletRow, isChecked && styles.bulletRowChecked]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked }}
                >
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    <Text style={styles.checkboxMark}>{isChecked ? '✓' : `${i + 1}`}</Text>
                  </View>
                  <Text style={[styles.bullet, isChecked && styles.bulletChecked]}>
                    {bullet}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Why this card */}
          <View style={styles.whyBox}>
            <Text style={styles.whyLabel}>WHY THIS MATCHES YOUR INTENT</Text>
            <Text style={styles.whyText}>{card.why}</Text>
          </View>

          {/* Hands-on Micro-Challenge / Action Prompt */}
          {card.actionPrompt && (
            <View style={styles.actionPromptBox}>
              <Text style={styles.actionPromptLabel}>⚡ MICRO-ACTION</Text>
              <Text style={styles.actionPromptText}>{card.actionPrompt}</Text>
            </View>
          )}

          {/* Collapsible Personal Note / Reflection Drawer */}
          <View style={styles.noteSection}>
            <Pressable
              onPress={() => setIsNoteOpen((prev) => !prev)}
              style={styles.noteToggleBtn}
            >
              <Text style={styles.noteToggleText}>
                {noteText.trim()
                  ? `✎  Your Note: "${noteText.trim().slice(0, 36)}${noteText.trim().length > 36 ? '…' : ''}"`
                  : '✎  Add a quick personal takeaway note'}
              </Text>
              <Text style={styles.noteToggleChevron}>{isNoteOpen ? '▲' : '▼'}</Text>
            </Pressable>

            {isNoteOpen && (
              <View style={styles.noteDrawer}>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Write what you learned or how you'll use this…"
                  placeholderTextColor={Colors.textMuted}
                  value={noteText}
                  onChangeText={setNoteText}
                  multiline
                />
                <View style={styles.noteFooter}>
                  {noteSavedToast ? (
                    <Text style={styles.noteSavedBadge}>✓ Saved to on-device library</Text>
                  ) : (
                    <Text style={styles.noteHint}>Stored privately on your device</Text>
                  )}
                  <Pressable onPress={handleSaveNote} style={styles.noteSaveBtn}>
                    <Text style={styles.noteSaveBtnText}>Save Note</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Primary & Secondary Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.primaryAction} onPress={openCard}>
              <Text style={styles.primaryActionText}>
                {card.kind === 'video' && embedUrl
                  ? '▶  Play Video'
                  : card.kind === 'video'
                    ? '↗  Open in YouTube'
                    : '↗  Open Source'}
              </Text>
            </Pressable>

            {card.kind !== 'video' && (
              <Pressable
                style={styles.readerAction}
                onPress={() => {
                  setShowLiveWebInReader(false);
                  setIsReaderOpen(true);
                }}
              >
                <Text style={styles.readerActionText}>📖 Focus View</Text>
              </Pressable>
            )}

            {onSave && (
              <Pressable
                style={[styles.secondaryAction, isSaved && styles.secondaryActionSaved]}
                onPress={() => onSave(card.id)}
              >
                <Text
                  style={[
                    styles.secondaryActionText,
                    isSaved && styles.secondaryActionTextSaved,
                  ]}
                >
                  {isSaved ? '★ Saved' : '☆ Save'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Official YouTube No-Cookie Player Modal */}
      {card.kind === 'video' && embedUrl && (
        <Modal
          visible={isPlayerOpen}
          animationType="slide"
          onRequestClose={() => setIsPlayerOpen(false)}
        >
          <SafeAreaView style={styles.playerContainer}>
            <View style={styles.playerHeader}>
              <Text style={styles.playerTitle} numberOfLines={1}>
                {card.title}
              </Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setIsPlayerOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close video player"
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
            <WebView
              source={{ uri: embedUrl }}
              style={styles.player}
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              setSupportMultipleWindows={false}
              onError={() => setIsPlayerOpen(false)}
            />
            <Pressable
              style={styles.externalButton}
              onPress={() => {
                Linking.openURL(card.url).catch((err) =>
                  console.warn('Failed to open YouTube URL:', err)
                );
              }}
            >
              <Text style={styles.externalButtonText}>Open in YouTube</Text>
            </Pressable>
          </SafeAreaView>
        </Modal>
      )}

      {/* Distraction-Free Focused Reader Modal for Articles & Docs */}
      <Modal
        visible={isReaderOpen}
        animationType="slide"
        onRequestClose={() => setIsReaderOpen(false)}
      >
        <SafeAreaView style={styles.readerModalContainer}>
          <View style={styles.readerModalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.readerSourceLabel}>{card.source}</Text>
              <Text style={styles.readerModalTitle} numberOfLines={1}>
                {card.title}
              </Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={() => setIsReaderOpen(false)}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </Pressable>
          </View>

          <View style={styles.readerModeTabs}>
            <Pressable
              style={[styles.readerTab, !showLiveWebInReader && styles.readerTabActive]}
              onPress={() => setShowLiveWebInReader(false)}
            >
              <Text
                style={[
                  styles.readerTabText,
                  !showLiveWebInReader && styles.readerTabTextActive,
                ]}
              >
                ✦ Focused Digest
              </Text>
            </Pressable>
            <Pressable
              style={[styles.readerTab, showLiveWebInReader && styles.readerTabActive]}
              onPress={() => setShowLiveWebInReader(true)}
            >
              <Text
                style={[
                  styles.readerTabText,
                  showLiveWebInReader && styles.readerTabTextActive,
                ]}
              >
                🌐 Embedded Source
              </Text>
            </Pressable>
          </View>

          {!showLiveWebInReader ? (
            <ScrollView contentContainerStyle={styles.readerDigestScroll}>
              <Text style={styles.readerHeadline}>{card.title}</Text>
              <Text style={styles.readerMetaLine}>
                {card.source} · {card.minutes} min estimated read
              </Text>

              <View style={styles.tldrBox}>
                <Text style={styles.tldrLabel}>EXECUTIVE SUMMARY (3 KEY POINTS)</Text>
                {card.tldr.map((bullet, idx) => (
                  <Text key={idx} style={styles.readerDigestBullet}>
                    {idx + 1}. {bullet}
                  </Text>
                ))}
              </View>

              <View style={styles.whyBox}>
                <Text style={styles.whyLabel}>RELEVANCE TO YOUR SESSION</Text>
                <Text style={styles.whyText}>{card.why}</Text>
              </View>

              {card.actionPrompt && (
                <View style={styles.actionPromptBox}>
                  <Text style={styles.actionPromptLabel}>⚡ HANDS-ON APPLICATION</Text>
                  <Text style={styles.actionPromptText}>{card.actionPrompt}</Text>
                </View>
              )}

              <Pressable
                style={styles.primaryAction}
                onPress={() => setShowLiveWebInReader(true)}
              >
                <Text style={styles.primaryActionText}>Read Full Source Inside App →</Text>
              </Pressable>
            </ScrollView>
          ) : (
            <WebView
              source={{ uri: card.url }}
              style={styles.player}
              setSupportMultipleWindows={false}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  cardSurface: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbnailWrapper: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  thumbnail: {
    width: '100%',
    height: 185,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
  },
  durationOverlay: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(7, 10, 15, 0.85)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  durationOverlayText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: 96,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  thumbnailPlaceholderText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  thumbnailDurationText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    marginBottom: Spacing.sm,
  },
  kindBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  kindText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  difficultyBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  difficultyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  scoreBadge: {
    backgroundColor: Colors.accentDim,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  scoreText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
    marginBottom: Spacing.xs,
    lineHeight: FontSize.xl * 1.28,
  },
  meta: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  tagPill: {
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  tagText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  tldrBox: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tldrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  tldrLabel: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tldrProgress: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
    marginBottom: 4,
  },
  bulletRowChecked: {
    backgroundColor: Colors.accentDim,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  checkboxMark: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  bullet: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.48,
  },
  bulletChecked: {
    color: Colors.accent,
  },
  whyBox: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    backgroundColor: Colors.bgElevated,
    padding: Spacing.sm + 4,
    borderTopRightRadius: Radius.sm,
    borderBottomRightRadius: Radius.sm,
    marginBottom: Spacing.md,
  },
  whyLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  whyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontStyle: 'italic',
    lineHeight: FontSize.sm * 1.45,
  },
  actionPromptBox: {
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.md,
    padding: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    marginBottom: Spacing.md,
  },
  actionPromptLabel: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  actionPromptText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.4,
  },
  noteSection: {
    marginBottom: Spacing.md,
  },
  noteToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteToggleText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
    flex: 1,
  },
  noteToggleChevron: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginLeft: Spacing.sm,
  },
  noteDrawer: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  noteInput: {
    color: Colors.text,
    fontSize: FontSize.sm,
    minHeight: 56,
    textAlignVertical: 'top',
    marginBottom: Spacing.sm,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  noteSavedBadge: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  noteSaveBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  noteSaveBtnText: {
    color: Colors.bg,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: Colors.bg,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  readerAction: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readerActionText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  secondaryAction: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionSaved: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  secondaryActionText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  secondaryActionTextSaved: {
    color: Colors.accent,
  },
  playerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  playerTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  closeButton: {
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.sm,
  },
  closeButtonText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  player: {
    flex: 1,
    backgroundColor: '#000',
  },
  externalButton: {
    margin: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  externalButtonText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  readerModalContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  readerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  readerSourceLabel: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  readerModalTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  readerModeTabs: {
    flexDirection: 'row',
    padding: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  readerTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  readerTabActive: {
    backgroundColor: Colors.accent,
  },
  readerTabText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  readerTabTextActive: {
    color: Colors.bg,
    fontWeight: '800',
  },
  readerDigestScroll: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  readerHeadline: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    lineHeight: FontSize.xxl * 1.25,
  },
  readerMetaLine: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  readerDigestBullet: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.55,
    marginBottom: Spacing.sm,
  },
});

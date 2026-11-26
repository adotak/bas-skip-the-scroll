import React, { useState, useEffect, memo } from 'react';
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

/**
 * Modeled directly on UI.html `.card-academy`, `.card-course`, `.box-score`, and `.box-featured`:
 * - White rounded card (`--rounded-large: 16px`, `border: 1px solid #EDEDED`)
 * - 16:9 media header with centered `.bt-play` circular white button (`rgba(255,255,255,0.88)`)
 * - Solid Awwwards `.budget-tag--solid` pills (lemon `#FFF083`, mint `#AAEEC4`, sky `#B4D7F8`)
 * - Structured `.c-boxes-score` (`SIGNAL` / `EST. TIME`) boxes
 * - Dotted-divider interactive takeaway checklist with `.input-check` square boxes
 */
export const CardView = memo(function CardView({
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

  const kindSolidBg =
    card.kind === 'video'
      ? Colors.lemon
      : card.kind === 'doc'
        ? Colors.sky
        : Colors.mint;

  const formattedScore = card.qualityScore
    ? (card.qualityScore / 10).toFixed(1)
    : '9.5';

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={styles.cardAcademy}>
          {/* Figure Rollover Media Header (.card-academy__figure) */}
          <Pressable onPress={openCard} style={styles.figureRollover}>
            {card.thumbnail ? (
              <Image source={{ uri: card.thumbnail }} style={styles.thumbnail} />
            ) : (
              <View style={[styles.thumbnailPlaceholder, { backgroundColor: Colors.surfaceDark }]}>
                <Text style={styles.placeholderMonogram}>W.</Text>
                <Text style={styles.thumbnailPlaceholderText}>
                  {KIND_BADGES[card.kind]}
                </Text>
              </View>
            )}

            {/* Top-left floating kind tag (.figure-rollover__fixed-left) */}
            <View style={styles.figureTopLeft}>
              <View style={[styles.budgetTagSolid, { backgroundColor: kindSolidBg }]}>
                <Text style={styles.budgetTagSolidText}>{KIND_BADGES[card.kind]}</Text>
              </View>
              {card.difficulty && (
                <View style={styles.budgetTagDark}>
                  <Text style={styles.budgetTagDarkText}>
                    {DIFFICULTY_LABELS[card.difficulty].toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* Center Play Button for Videos (.bt-play line 1863) */}
            {card.kind === 'video' && (
              <View style={styles.btPlayCenter}>
                <View style={styles.btPlayCircle}>
                  <Text style={styles.btPlayIcon}>▶</Text>
                </View>
              </View>
            )}

            {/* Bottom-right duration tag (.card-academy__figure .bottom-right) */}
            <View style={styles.figureBottomRight}>
              <View style={styles.durationTag}>
                <Text style={styles.durationTagText}>{card.minutes} MIN</Text>
              </View>
            </View>
          </Pressable>

          {/* Card Content Body (.card-course__content) */}
          <View style={styles.cardBody}>
            {/* Top Row: Source Byline + Awwwards Box-Score Grid (.c-boxes-score) */}
            <View style={styles.headerMetaRow}>
              <View style={styles.bylineCol}>
                <Text style={styles.bylineLabel}>SOURCE</Text>
                <Text style={styles.meta}>
                  {card.source}  ·  {card.minutes} min
                </Text>
              </View>

              <View style={styles.boxesScore}>
                <View style={styles.boxScoreLeft}>
                  <Text style={styles.boxScoreTop}>SIGNAL</Text>
                  <Text style={styles.boxScoreVal}>{formattedScore}</Text>
                </View>
                <View style={styles.boxScoreRight}>
                  <Text style={styles.boxScoreTop}>TIME</Text>
                  <Text style={styles.boxScoreVal}>{card.minutes}m</Text>
                </View>
              </View>
            </View>

            {/* Editorial Title (.card-course__title) */}
            <Text style={styles.title}>{card.title}</Text>

            {/* Pill Tags (.button--tag) */}
            {card.tags && card.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {card.tags.map((tag) => (
                  <View key={tag} style={styles.buttonTag}>
                    <Text style={styles.buttonTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Interactive 3-Bullet TL;DR Checklist (.tb-dotteds & .input-check) */}
            <View style={styles.tldrBox}>
              <View style={styles.tldrHeaderRow}>
                <Text style={styles.tldrLabel}>TL;DR · 3 KEY TAKEAWAYS</Text>
                <View style={styles.tldrCountBadge}>
                  <Text style={styles.tldrProgress}>
                    {checkedBullets.length}/3 MASTERED
                  </Text>
                </View>
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
                    <View style={[styles.inputCheck, isChecked && styles.inputCheckActive]}>
                      <Text
                        style={[
                          styles.inputCheckMark,
                          isChecked && styles.inputCheckMarkActive,
                        ]}
                      >
                        {isChecked ? '✓' : `0${i + 1}`}
                      </Text>
                    </View>
                    <Text style={[styles.bullet, isChecked && styles.bulletChecked]}>
                      {bullet}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Why This Matches (.box-featured--green line 10242) */}
            <View style={styles.boxFeaturedGreen}>
              <Text style={styles.boxFeaturedLabel}>WHY THIS MATCHES YOUR INTENT</Text>
              <Text style={styles.whyText}>{card.why}</Text>
            </View>

            {/* Hands-on Micro-Action (.box-featured--warning line 10246) */}
            {card.actionPrompt && (
              <View style={styles.boxFeaturedYellow}>
                <Text style={styles.boxFeaturedLabel}>⚡ HANDS-ON MICRO-ACTION</Text>
                <Text style={styles.actionPromptText}>{card.actionPrompt}</Text>
              </View>
            )}

            {/* Personal Note Drawer (.filter-box) */}
            <View style={styles.noteSection}>
              <Pressable
                onPress={() => setIsNoteOpen((prev) => !prev)}
                style={styles.noteToggleBtn}
              >
                <Text style={styles.noteToggleText}>
                  {noteText.trim()
                    ? `✎  Note: "${noteText.trim().slice(0, 38)}${noteText.trim().length > 38 ? '…' : ''}"`
                    : '✎  Add a private takeaway note'}
                </Text>
                <Text style={styles.noteToggleChevron}>{isNoteOpen ? '−' : '+'}</Text>
              </Pressable>

              {isNoteOpen && (
                <View style={styles.noteDrawer}>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Write what you learned or how you'll apply this…"
                    placeholderTextColor={Colors.textMuted}
                    value={noteText}
                    onChangeText={setNoteText}
                    multiline
                  />
                  <View style={styles.noteFooter}>
                    {noteSavedToast ? (
                      <Text style={styles.noteSavedBadge}>✓ Saved on-device</Text>
                    ) : (
                      <Text style={styles.noteHint}>Private · Stored locally</Text>
                    )}
                    <Pressable onPress={handleSaveNote} style={styles.noteSaveBtn}>
                      <Text style={styles.noteSaveBtnText}>Save Note</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* Card Footer Actions (.button & .button--outline) */}
            <View style={styles.actions}>
              <Pressable style={styles.primaryAction} onPress={openCard}>
                <Text style={styles.primaryActionText}>
                  {card.kind === 'video' && embedUrl
                    ? '▶  Play Video'
                    : card.kind === 'video'
                      ? '↗  Open in YouTube'
                      : '↗  Visit Source'}
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
                  <Text style={styles.readerActionText}>Focus View</Text>
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
                    {isSaved ? '★ Saved' : 'Collect'}
                  </Text>
                </Pressable>
              )}
            </View>
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

      {/* Distraction-Free Focused Reader Modal */}
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
              style={styles.closeButtonLight}
              onPress={() => setIsReaderOpen(false)}
            >
              <Text style={styles.closeButtonLightText}>Done</Text>
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
                Editorial Digest
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
                Live Web Source
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
                    0{idx + 1}. {bullet}
                  </Text>
                ))}
              </View>

              <View style={styles.boxFeaturedGreen}>
                <Text style={styles.boxFeaturedLabel}>RELEVANCE TO YOUR SESSION</Text>
                <Text style={styles.whyText}>{card.why}</Text>
              </View>

              {card.actionPrompt && (
                <View style={styles.boxFeaturedYellow}>
                  <Text style={styles.boxFeaturedLabel}>⚡ HANDS-ON APPLICATION</Text>
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
});

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: 110,
  },
  cardAcademy: {
    backgroundColor: Colors.surface, // #FFFFFF (.card-academy)
    borderRadius: Radius.lg,         // --rounded-large: 16px
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  figureRollover: {
    position: 'relative',
    width: '100%',
    height: 175,
    backgroundColor: Colors.surfaceDark,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderMonogram: {
    color: Colors.lemon,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  thumbnailPlaceholderText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  figureTopLeft: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    gap: 6,
  },
  budgetTagSolid: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  budgetTagSolidText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  budgetTagDark: {
    backgroundColor: 'rgba(34, 34, 34, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  budgetTagDarkText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btPlayCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btPlayCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btPlayIcon: {
    color: Colors.text,
    fontSize: 20,
    marginLeft: 3,
  },
  figureBottomRight: {
    position: 'absolute',
    bottom: 14,
    right: 14,
  },
  durationTag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  durationTagText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  cardBody: {
    padding: Spacing.lg,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  bylineCol: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  bylineLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  meta: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  boxesScore: {
    flexDirection: 'row',
  },
  boxScoreLeft: {
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderTopLeftRadius: Radius.xs,
    borderBottomLeftRadius: Radius.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  boxScoreRight: {
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: Colors.borderStrong,
    borderTopRightRadius: Radius.xs,
    borderBottomRightRadius: Radius.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
  },
  boxScoreTop: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  boxScoreVal: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    lineHeight: FontSize.xl * 1.22,
    letterSpacing: -0.4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  buttonTag: {
    borderWidth: 1,
    borderColor: Colors.textMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  buttonTagText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  tldrBox: {
    backgroundColor: Colors.bg, // #F8F8F8
    borderRadius: Radius.sm,
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
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tldrLabel: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tldrCountBadge: {
    backgroundColor: Colors.lemon,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  tldrProgress: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    borderBottomColor: Colors.border,
  },
  bulletRowChecked: {
    backgroundColor: Colors.mintSoft,
    paddingHorizontal: 6,
    borderRadius: Radius.xs,
  },
  inputCheck: {
    width: 24,
    height: 24,
    borderRadius: Radius.xs,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  inputCheckActive: {
    backgroundColor: Colors.surfaceDark,
    borderColor: Colors.surfaceDark,
  },
  inputCheckMark: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  inputCheckMarkActive: {
    color: Colors.textInverse,
  },
  bullet: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.45,
  },
  bulletChecked: {
    fontWeight: '600',
  },
  boxFeaturedGreen: {
    backgroundColor: Colors.mintSoft, // #E2F4E9 (.box-featured--green)
    padding: Spacing.md,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm + 2,
  },
  boxFeaturedYellow: {
    backgroundColor: Colors.lemonSoft, // #FFF9D0 (.box-featured--warning)
    padding: Spacing.md,
    borderRadius: Radius.sm,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.surfaceDark,
  },
  boxFeaturedLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  whyText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.45,
  },
  actionPromptText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
    lineHeight: FontSize.sm * 1.4,
  },
  noteSection: {
    marginBottom: Spacing.md,
  },
  noteToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteToggleText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '500',
    flex: 1,
  },
  noteToggleChevron: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
  noteDrawer: {
    marginTop: 4,
    backgroundColor: Colors.bg,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
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
    color: Colors.success,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  noteSaveBtn: {
    backgroundColor: Colors.surfaceDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.xs,
  },
  noteSaveBtnText: {
    color: Colors.textInverse,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  primaryAction: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.surfaceDark, // .button (#222222)
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: Colors.textInverse,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  readerAction: {
    height: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readerActionText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  secondaryAction: {
    height: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionSaved: {
    backgroundColor: Colors.lemon,
    borderColor: Colors.surfaceDark,
  },
  secondaryActionText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  secondaryActionTextSaved: {
    color: Colors.text,
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
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  closeButton: {
    marginLeft: Spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.surfaceDarkInner,
    borderRadius: Radius.xs,
  },
  closeButtonText: {
    color: Colors.textInverse,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  closeButtonLight: {
    marginLeft: Spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceDark,
    borderRadius: Radius.xs,
  },
  closeButtonLightText: {
    color: Colors.textInverse,
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
    borderColor: Colors.surfaceDarkBorder,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  externalButtonText: {
    color: Colors.textInverse,
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
    backgroundColor: Colors.surface,
  },
  readerSourceLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  readerModalTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  readerModeTabs: {
    flexDirection: 'row',
    padding: 6,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.sm,
  },
  readerTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  readerTabActive: {
    backgroundColor: Colors.surfaceDark,
  },
  readerTabText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  readerTabTextActive: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  readerDigestScroll: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  readerHeadline: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '900',
    lineHeight: FontSize.xxl * 1.2,
  },
  readerMetaLine: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  readerDigestBullet: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.55,
    marginBottom: Spacing.sm,
  },
});

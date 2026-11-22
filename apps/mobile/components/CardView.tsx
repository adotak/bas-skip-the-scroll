import React, { useState } from 'react';
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
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { Card } from '@skip-the-scroll/shared';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { getYouTubeEmbedUrl } from '@/components/youtube';

const KIND_BADGES: Record<Card['kind'], string> = {
  video: '▶  Video',
  article: '📄  Article',
  doc: '📖  Doc',
};

interface CardViewProps {
  card: Card;
  onSave?: (cardId: string) => void;
}

export function CardView({ card, onSave }: CardViewProps) {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const embedUrl = getYouTubeEmbedUrl(card);

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

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
      {/* Thumbnail */}
      {card.thumbnail ? (
        <Image source={{ uri: card.thumbnail }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Text style={styles.thumbnailPlaceholderText}>
            {KIND_BADGES[card.kind]}
          </Text>
        </View>
      )}

      {/* Kind badge */}
      <View style={styles.kindBadge}>
        <Text style={styles.kindText}>{KIND_BADGES[card.kind]}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{card.title}</Text>

      {/* Source + duration */}
      <Text style={styles.meta}>
        {card.source}  ·  {card.minutes} min
      </Text>

      {/* TL;DR bullets */}
      <View style={styles.tldrBox}>
        <Text style={styles.tldrLabel}>TL;DR</Text>
        {card.tldr.map((bullet, i) => (
          <Text key={i} style={styles.bullet}>
            •  {bullet}
          </Text>
        ))}
      </View>

      {/* Why this card */}
      <View style={styles.whyBox}>
        <Text style={styles.whyText}>{card.why}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.primaryAction}
          onPress={openCard}
        >
          <Text style={styles.primaryActionText}>
            {card.kind === 'video' && embedUrl ? '▶  Play' : card.kind === 'video' ? '↗  Open in YouTube' : '↗  Open'}
          </Text>
        </Pressable>

        {onSave && (
          <Pressable
            style={styles.secondaryAction}
            onPress={() => onSave(card.id)}
          >
            <Text style={styles.secondaryActionText}>Save</Text>
          </Pressable>
        )}
      </View>
      </ScrollView>

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
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPlaceholderText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
  },
  kindBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
  },
  kindText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    lineHeight: FontSize.xl * 1.3,
  },
  meta: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
  },
  tldrBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  tldrLabel: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bullet: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.6,
    marginBottom: Spacing.xs,
  },
  whyBox: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    paddingLeft: Spacing.md,
    marginBottom: Spacing.lg,
  },
  whyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontStyle: 'italic',
    lineHeight: FontSize.md * 1.5,
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
  },
  primaryActionText: {
    color: Colors.bg,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  secondaryAction: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
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
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  closeButtonText: {
    color: Colors.accent,
    fontSize: FontSize.md,
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
});

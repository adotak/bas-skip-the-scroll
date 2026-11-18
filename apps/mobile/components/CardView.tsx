import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Linking } from 'react-native';
import type { Card } from '@skip-the-scroll/shared';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';

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
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
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
          onPress={() => {
            if (card.url) {
              Linking.openURL(card.url).catch((err) =>
                console.warn('Failed to open URL:', err)
              );
            }
          }}
        >
          <Text style={styles.primaryActionText}>
            {card.kind === 'video' ? '▶  Play' : '↗  Open'}
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
});

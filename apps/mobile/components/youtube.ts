import type { Card } from '@skip-the-scroll/shared';

export function getYouTubeEmbedUrl(card: Card): string | null {
  if (card.kind !== 'video') return null;

  const embedId = card.embedId?.trim();
  if (!embedId || !/^[A-Za-z0-9_-]{11}$/.test(embedId)) return null;

  return `https://www.youtube-nocookie.com/embed/${embedId}?rel=0&modestbranding=1&playsinline=1`;
}

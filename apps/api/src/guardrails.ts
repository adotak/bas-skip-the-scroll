import type { Card, TimeBox } from '@skip-the-scroll/shared';
import { MAX_CARDS, DEFAULT_CARDS } from '@skip-the-scroll/shared';

export interface GuardrailOptions {
  timeboxMin: TimeBox;
  targetCount?: number;
}

export function validateCardSchema(card: unknown): card is Card {
  if (!card || typeof card !== 'object') return false;
  const c = card as Partial<Card>;

  if (typeof c.id !== 'string' || !c.id.trim()) return false;
  if (c.kind !== 'video' && c.kind !== 'article' && c.kind !== 'doc') return false;
  if (typeof c.title !== 'string' || !c.title.trim()) return false;
  if (typeof c.source !== 'string' || !c.source.trim()) return false;
  if (typeof c.url !== 'string' || !c.url.trim()) return false;
  if (typeof c.minutes !== 'number' || c.minutes <= 0) return false;
  if (typeof c.why !== 'string' || !c.why.trim()) return false;

  if (!Array.isArray(c.tldr) || c.tldr.length !== 3) return false;
  for (const bullet of c.tldr) {
    if (typeof bullet !== 'string' || !bullet.trim()) return false;
  }

  if (c.kind === 'video' && (!c.embedId || typeof c.embedId !== 'string')) {
    // If embedId is missing for a YouTube video, try parsing from URL
    try {
      const url = new URL(c.url);
      const v = url.searchParams.get('v');
      if (v) {
        c.embedId = v;
      }
    } catch {
      // url parse error
    }
  }

  return true;
}

export function applyGuardrails(cards: unknown[], options: GuardrailOptions): Card[] {
  // 1. Schema validation: drop malformed cards
  const validCards: Card[] = [];
  const seenUrls = new Set<string>();

  for (const raw of cards) {
    if (validateCardSchema(raw)) {
      if (!seenUrls.has(raw.url)) {
        seenUrls.add(raw.url);
        validCards.push(raw);
      }
    }
  }

  if (validCards.length === 0) {
    return [];
  }

  // 2. Diversity guardrail: if non-video cards exist, ensure at least one is in the output
  const videos = validCards.filter((c) => c.kind === 'video');
  const nonVideos = validCards.filter((c) => c.kind !== 'video');

  let curated: Card[] = [];
  if (videos.length > 0 && nonVideos.length > 0) {
    // Put at least 1 non-video first
    const firstNonVideo = nonVideos[0];
    const remaining = validCards.filter((c) => c.id !== firstNonVideo.id);
    curated = [firstNonVideo, ...remaining];
  } else {
    curated = validCards;
  }

  // 3. Card cap: default 7, hard cap 10. Never pad.
  const cap = Math.min(options.targetCount ?? DEFAULT_CARDS, MAX_CARDS);
  let capped = curated.slice(0, cap);

  // 4. Duration fit: sum of minutes should reasonably fit inside the timebox
  // If total duration exceeds timebox, prune cards while preserving diversity and at least 1 card.
  let totalMinutes = capped.reduce((sum, c) => sum + c.minutes, 0);
  while (totalMinutes > options.timeboxMin && capped.length > 1) {
    // Determine which card to prune:
    // If we have both videos and non-videos, and pruning would remove the last non-video,
    // prune a video instead.
    const nonVideoCount = capped.filter((c) => c.kind !== 'video').length;
    const candidatesForRemoval = capped.map((c, idx) => ({ c, idx })).filter(({ c }) => {
      if (c.kind !== 'video' && nonVideoCount <= 1 && capped.some((item) => item.kind === 'video')) {
        return false; // Protect the sole non-video
      }
      return true;
    });

    const pool = candidatesForRemoval.length > 0 ? candidatesForRemoval : capped.map((c, idx) => ({ c, idx }));

    // Find longest in pool
    let longestIdxInCapped = pool[0].idx;
    let maxMinutes = capped[longestIdxInCapped].minutes;
    for (const item of pool) {
      if (item.c.minutes > maxMinutes) {
        maxMinutes = item.c.minutes;
        longestIdxInCapped = item.idx;
      }
    }

    totalMinutes -= capped[longestIdxInCapped].minutes;
    capped.splice(longestIdxInCapped, 1);
  }

  return capped;
}

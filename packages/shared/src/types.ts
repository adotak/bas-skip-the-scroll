// ─── Language ────────────────────────────────────────────────────────────────

export type Language = 'en' | 'ur' | 'roman-ur';

export const LANGUAGES: readonly Language[] = ['en', 'roman-ur', 'ur'] as const;

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  'roman-ur': 'Roman Urdu',
  ur: 'اردو',
};

// ─── Card ────────────────────────────────────────────────────────────────────

export type CardKind = 'video' | 'article' | 'doc';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type Card = {
  id: string;
  kind: CardKind;
  title: string;
  source: string;                 // channel name or website
  url: string;
  embedId?: string;               // YouTube video id (when embeddable)
  minutes: number;                // estimated watch / read time
  tldr: [string, string, string]; // exactly 3 short bullets
  why: string;                    // one line — why this matches the intent
  thumbnail?: string;
  difficulty?: DifficultyLevel;   // skill tier badge
  tags?: string[];                // topic pills
  actionPrompt?: string;          // 1-line hands-on micro-challenge / reflection
  qualityScore?: number;          // signal relevance score (1-100)
};

// ─── Session ─────────────────────────────────────────────────────────────────

export type Mode = 'learn' | 'fix' | 'watch' | 'read';
export type TimeBox = 5 | 10 | 20;

export type SessionMetadata = {
  isCached?: boolean;
  isFallback?: boolean;
  unranked?: boolean;
  providersUsed?: string[];
  degradedProviders?: string[];
  normalisedQueries?: string[];
  totalMinutes?: number;
  suggestedRefinements?: string[];
  notice?: string;
};

export type Session = {
  id: string;
  intent: string;
  mode: Mode;
  timeboxMin: TimeBox;
  lang?: Language;
  cards: Card[];         // max MAX_CARDS
  createdAt: string;     // ISO 8601
  meta?: SessionMetadata;
};

// ─── On-device session log ───────────────────────────────────────────────────

export type SessionOutcome = 'done' | 'refine' | 'save';

export type SessionLogEntry = {
  sessionId: string;
  intent: string;
  mode: Mode;
  timeboxMin: TimeBox;
  lang?: Language;
  cardCount: number;
  outcome?: SessionOutcome;
  createdAt: string;
  completedAt?: string;
  checkedTakeawaysCount?: number;
  elapsedSeconds?: number;
};

// ─── Constants ───────────────────────────────────────────────────────────────

/** Hard cap — never exceed this. */
export const MAX_CARDS = 10;

/** Default number of cards per session. */
export const DEFAULT_CARDS = 7;

/** All available modes. */
export const MODES: readonly Mode[] = ['learn', 'fix', 'watch', 'read'] as const;

/** All available time-box options in minutes. */
export const TIME_BOXES: readonly TimeBox[] = [5, 10, 20] as const;

/** Language detection helper for English, Urdu script, and Roman Urdu. */
export function detectIntentLanguage(text: string): Language {
  const trimmed = text.trim();
  // Check for Arabic/Urdu script characters
  if (/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(trimmed)) {
    return 'ur';
  }
  // Check for common Roman Urdu words / particles
  const romanUrduTokens = /\b(kaise|kya|kyun|kahan|karna|karte|hain|hai|aur|mein|se|ko|ka|ki|ke|seekhein|samjhao|masla|theek|karein|batao|urdu|chahiye|asaan|tariqa)\b/i;
  if (romanUrduTokens.test(trimmed)) {
    return 'roman-ur';
  }
  return 'en';
}

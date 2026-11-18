// ─── Card ────────────────────────────────────────────────────────────────────

export type CardKind = 'video' | 'article' | 'doc';

export type Card = {
  id: string;
  kind: CardKind;
  title: string;
  source: string;        // channel name or website
  url: string;
  embedId?: string;      // YouTube video id (when embeddable)
  minutes: number;       // estimated watch / read time
  tldr: [string, string, string]; // exactly 3 short bullets
  why: string;           // one line — why this matches the intent
  thumbnail?: string;
};

// ─── Session ─────────────────────────────────────────────────────────────────

export type Mode = 'learn' | 'fix' | 'watch' | 'read';
export type TimeBox = 5 | 10 | 20;

export type Session = {
  id: string;
  intent: string;
  mode: Mode;
  timeboxMin: TimeBox;
  cards: Card[];         // max MAX_CARDS
  createdAt: string;     // ISO 8601
};

// ─── On-device session log ───────────────────────────────────────────────────

export type SessionOutcome = 'done' | 'refine' | 'save';

export type SessionLogEntry = {
  sessionId: string;
  intent: string;
  mode: Mode;
  timeboxMin: TimeBox;
  cardCount: number;
  outcome?: SessionOutcome;
  createdAt: string;
  completedAt?: string;
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

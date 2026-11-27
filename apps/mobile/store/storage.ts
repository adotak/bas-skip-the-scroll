import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  SessionLogEntry,
  SessionOutcome,
  Mode,
  TimeBox,
  Card,
  Language,
} from '@skip-the-scroll/shared';
import { AndroidGate } from '@/modules/android-gate';

const LOG_KEY = 'session_log';
const RECENT_KEY = 'recent_intents';
const SAVED_CARDS_KEY = 'saved_cards_full';
const LEGACY_SAVED_CARDS_KEY = 'saved_cards';
const TAKEAWAYS_KEY = 'card_takeaways_map';
const CARD_NOTES_KEY = 'card_notes_map';
const PREF_LANG_KEY = 'preferred_language';
const ALLOWANCE_KEY = 'active_break_allowance';
const MAX_RECENT = 10;

function parseStoredArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function parseStoredObject<T extends Record<string, unknown>>(raw: string | null): T {
  if (!raw) return {} as T;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as T)
      : ({} as T);
  } catch {
    return {} as T;
  }
}

export interface SavedCardRecord {
  card: Card;
  savedAt: string;
  intent: string;
  note?: string;
  completed?: boolean;
  checkedBullets?: number[];
}

export interface DailyActivityPoint {
  dateLabel: string; // e.g. 'Mon', 'Tue'
  isoDate: string;   // YYYY-MM-DD
  sessionsDone: number;
  sessionsStarted: number;
}

export interface InsightsData {
  timeWindowDays: number;
  sessionsStarted: number;
  sessionsFinished: number;
  doneRatePercent: number;
  gateShown: number;
  gateRedirects: number;
  continueAnyway: number;
  estimatedMinutesSaved: number; // explicitly labelled as an estimate
  modeBreakdown: Record<Mode, number>;
  dailyActivity: DailyActivityPoint[];
  topIntents: string[];
  savedCardsCount: number;
  completedCardsCount: number;
  totalTakeawaysChecked: number;
  intentionalityScore: number; // 0-100 ratio of intentional sessions & redirects vs bypasses
}

export interface ActiveAllowance {
  targetApp: string;
  expiresAt: number; // epoch ms
  minutes: number;
}

// ─── Language preference ─────────────────────────────────────────────────────

export async function getPreferredLanguage(): Promise<Language> {
  const raw = await AsyncStorage.getItem(PREF_LANG_KEY);
  if (raw === 'en' || raw === 'roman-ur' || raw === 'ur') {
    return raw;
  }
  return 'en';
}

export async function setPreferredLanguage(lang: Language): Promise<void> {
  await AsyncStorage.setItem(PREF_LANG_KEY, lang);
}

// ─── Active break allowance ──────────────────────────────────────────────────

export async function getActiveAllowance(): Promise<ActiveAllowance | null> {
  const raw = await AsyncStorage.getItem(ALLOWANCE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ActiveAllowance;
    if (parsed && typeof parsed.expiresAt === 'number') {
      if (parsed.expiresAt > Date.now()) {
        return parsed;
      }
      await AsyncStorage.removeItem(ALLOWANCE_KEY);
    }
    return null;
  } catch {
    return null;
  }
}

export async function setActiveAllowance(targetApp: string, minutes: number): Promise<ActiveAllowance> {
  const allowance: ActiveAllowance = {
    targetApp,
    minutes,
    expiresAt: Date.now() + minutes * 60 * 1000,
  };
  await AsyncStorage.setItem(ALLOWANCE_KEY, JSON.stringify(allowance));
  return allowance;
}

export async function clearActiveAllowance(): Promise<void> {
  await AsyncStorage.removeItem(ALLOWANCE_KEY);
}

// ─── Session log ─────────────────────────────────────────────────────────────

export async function getSessionLog(): Promise<SessionLogEntry[]> {
  const raw = await AsyncStorage.getItem(LOG_KEY);
  return parseStoredArray<SessionLogEntry>(raw);
}

export async function logSessionStart(params: {
  sessionId: string;
  intent: string;
  mode: Mode;
  timeboxMin: TimeBox;
  cardCount: number;
  lang?: Language;
}): Promise<void> {
  const log = await getSessionLog();
  const entry: SessionLogEntry = {
    ...params,
    createdAt: new Date().toISOString(),
  };
  log.push(entry);
  await AsyncStorage.setItem(LOG_KEY, JSON.stringify(log));
}

export async function logSessionEnd(
  sessionId: string,
  outcome: SessionOutcome,
  extra?: { checkedTakeawaysCount?: number; elapsedSeconds?: number }
): Promise<void> {
  const log = await getSessionLog();
  const entry = log.find((e) => e.sessionId === sessionId);
  if (entry) {
    entry.outcome = outcome;
    entry.completedAt = new Date().toISOString();
    if (extra?.checkedTakeawaysCount !== undefined) {
      entry.checkedTakeawaysCount = extra.checkedTakeawaysCount;
    }
    if (extra?.elapsedSeconds !== undefined) {
      entry.elapsedSeconds = extra.elapsedSeconds;
    }
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(log));
  }
}

// ─── Recent intents ──────────────────────────────────────────────────────────

export async function getRecentIntents(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(RECENT_KEY);
  return parseStoredArray<string>(raw);
}

export async function addRecentIntent(intent: string): Promise<void> {
  const intents = await getRecentIntents();
  const filtered = intents.filter((i) => i !== intent);
  filtered.unshift(intent);
  await AsyncStorage.setItem(
    RECENT_KEY,
    JSON.stringify(filtered.slice(0, MAX_RECENT)),
  );
}

export async function clearRecentIntents(): Promise<void> {
  await AsyncStorage.removeItem(RECENT_KEY);
}

// ─── Interactive Takeaways & Notes per Card ──────────────────────────────────

export async function getCardTakeawaysMap(): Promise<Record<string, number[]>> {
  const raw = await AsyncStorage.getItem(TAKEAWAYS_KEY);
  return parseStoredObject<Record<string, number[]>>(raw);
}

export async function getCardTakeaways(cardId: string): Promise<number[]> {
  const map = await getCardTakeawaysMap();
  return Array.isArray(map[cardId]) ? map[cardId] : [];
}

export async function toggleCardTakeaway(
  cardId: string,
  bulletIndex: number,
): Promise<number[]> {
  const map = await getCardTakeawaysMap();
  const current = Array.isArray(map[cardId]) ? [...map[cardId]] : [];
  const idx = current.indexOf(bulletIndex);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(bulletIndex);
    current.sort();
  }
  map[cardId] = current;
  await AsyncStorage.setItem(TAKEAWAYS_KEY, JSON.stringify(map));

  // Sync into saved card if present
  const saved = await getSavedCards();
  const record = saved.find((r) => r.card.id === cardId);
  if (record) {
    record.checkedBullets = current;
    await AsyncStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(saved));
  }

  return current;
}

export async function getCardNotesMap(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(CARD_NOTES_KEY);
  return parseStoredObject<Record<string, string>>(raw);
}

export async function getCardNote(cardId: string): Promise<string> {
  const map = await getCardNotesMap();
  return typeof map[cardId] === 'string' ? map[cardId] : '';
}

export async function saveCardNote(cardId: string, note: string): Promise<void> {
  const map = await getCardNotesMap();
  const trimmed = note.trim();
  if (trimmed) {
    map[cardId] = trimmed;
  } else {
    delete map[cardId];
  }
  await AsyncStorage.setItem(CARD_NOTES_KEY, JSON.stringify(map));

  // Sync into saved card if present
  const saved = await getSavedCards();
  const record = saved.find((r) => r.card.id === cardId);
  if (record) {
    record.note = trimmed || undefined;
    await AsyncStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(saved));
  }
}

// ─── Saved cards ─────────────────────────────────────────────────────────────

export async function getSavedCards(): Promise<SavedCardRecord[]> {
  const raw = await AsyncStorage.getItem(SAVED_CARDS_KEY);
  return parseStoredArray<SavedCardRecord>(raw);
}

export async function saveCard(card: Card, intent: string = 'General'): Promise<boolean> {
  const list = await getSavedCards();
  const existingIdx = list.findIndex((item) => item.card.id === card.id);
  if (existingIdx >= 0) {
    // Already saved, remove it (toggle)
    list.splice(existingIdx, 1);
    await AsyncStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(list));
    return false; // unsaved
  }

  const [note, checkedBullets] = await Promise.all([
    getCardNote(card.id),
    getCardTakeaways(card.id),
  ]);

  list.unshift({
    card,
    savedAt: new Date().toISOString(),
    intent,
    note: note || undefined,
    completed: checkedBullets.length === 3,
    checkedBullets: checkedBullets.length > 0 ? checkedBullets : undefined,
  });
  await AsyncStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(list));
  return true; // saved
}

export async function toggleSavedCardCompleted(cardId: string): Promise<boolean> {
  const list = await getSavedCards();
  const record = list.find((item) => item.card.id === cardId);
  if (!record) return false;
  record.completed = !record.completed;
  await AsyncStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(list));
  return record.completed;
}

export async function removeSavedCard(cardId: string): Promise<void> {
  const list = await getSavedCards();
  const filtered = list.filter((item) => item.card.id !== cardId);
  await AsyncStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(filtered));
}

export async function isCardSaved(cardId: string): Promise<boolean> {
  const list = await getSavedCards();
  return list.some((item) => item.card.id === cardId);
}

// ─── Legacy saved-card compatibility ─────────────────────────────────────

export async function getSavedCardIds(): Promise<string[]> {
  const fullCards = await getSavedCards();
  const rawLegacyIds = await AsyncStorage.getItem(LEGACY_SAVED_CARDS_KEY);
  const legacyIds = parseStoredArray<string>(rawLegacyIds);
  return Array.from(new Set([
    ...fullCards.map((item) => item.card.id),
    ...legacyIds,
  ]));
}

export async function toggleSavedCard(cardId: string): Promise<boolean> {
  const fullCards = await getSavedCards();
  const fullCard = fullCards.find((item) => item.card.id === cardId);
  if (fullCard) {
    await removeSavedCard(cardId);
    return false;
  }

  const rawLegacyIds = await AsyncStorage.getItem(LEGACY_SAVED_CARDS_KEY);
  const legacyIds = parseStoredArray<string>(rawLegacyIds);
  const legacyIndex = legacyIds.indexOf(cardId);
  if (legacyIndex >= 0) {
    legacyIds.splice(legacyIndex, 1);
    await AsyncStorage.setItem(LEGACY_SAVED_CARDS_KEY, JSON.stringify(legacyIds));
    return false;
  }

  legacyIds.push(cardId);
  await AsyncStorage.setItem(LEGACY_SAVED_CARDS_KEY, JSON.stringify(legacyIds));
  return true;
}

// ─── Insights & Stats calculation ────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function getInsightsData(days: number = 7): Promise<InsightsData> {
  const [log, savedCards, takeawaysMap] = await Promise.all([
    getSessionLog(),
    getSavedCards(),
    getCardTakeawaysMap(),
  ]);
  const now = Date.now();
  const cutoffTime = now - (days * 24 * 60 * 60 * 1000);

  const windowEntries = log.filter((entry) => {
    const time = new Date(entry.createdAt).getTime();
    return time >= cutoffTime;
  });

  const sessionsStarted = windowEntries.length;
  const finishedEntries = windowEntries.filter((entry) => !!entry.outcome);
  const sessionsFinished = finishedEntries.length;

  const doneCount = finishedEntries.filter((e) => e.outcome === 'done').length;
  const doneRatePercent = sessionsFinished > 0
    ? Math.round((doneCount / sessionsFinished) * 100)
    : 0;

  // Mode breakdown
  const modeBreakdown: Record<Mode, number> = {
    learn: 0,
    fix: 0,
    watch: 0,
    read: 0,
  };
  const intentCounts: Record<string, number> = {};
  for (const e of windowEntries) {
    if (modeBreakdown[e.mode] !== undefined) {
      modeBreakdown[e.mode] += 1;
    }
    const norm = e.intent.trim();
    if (norm) {
      intentCounts[norm] = (intentCounts[norm] ?? 0) + 1;
    }
  }

  const topIntents = Object.entries(intentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([intent]) => intent);

  // Build 7-day sparkline activity points
  const dailyActivity: DailyActivityPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const isoDate = d.toISOString().split('T')[0];
    const dateLabel = DAY_NAMES[d.getDay()];
    const dayEntries = log.filter((e) => e.createdAt.startsWith(isoDate));
    dailyActivity.push({
      dateLabel,
      isoDate,
      sessionsStarted: dayEntries.length,
      sessionsDone: dayEntries.filter((e) => e.outcome === 'done' || e.outcome === 'save').length,
    });
  }

  // Native gate metrics
  const gateStats = AndroidGate.getGateStats();
  const gateShown = days === 7
    ? gateStats.gateShownLast7Days
    : gateStats.gateShownLast30Days;
  const gateRedirects = days === 7
    ? gateStats.redirectsLast7Days
    : gateStats.redirectsLast30Days;
  const continueAnyway = days === 7
    ? gateStats.continueAnywayLast7Days
    : gateStats.continueAnywayLast30Days;

  // Estimated minutes saved:
  // Each gate redirect prevents an estimated ~15 min doomscroll session.
  // Plus, each finished intentional session saves focus time compared to mindless feeds.
  const estimatedMinutesSaved = (gateRedirects * 15) + (doneCount * 10);

  const totalTakeawaysChecked = Object.values(takeawaysMap).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0
  );

  const completedCardsCount = savedCards.filter((c) => c.completed).length;

  const positiveActions = doneCount + gateRedirects + completedCardsCount;
  const totalActions = Math.max(1, sessionsStarted + continueAnyway + gateRedirects);
  const intentionalityScore =
    sessionsStarted === 0 && gateShown === 0
      ? 100
      : Math.min(100, Math.round((positiveActions / totalActions) * 100));

  return {
    timeWindowDays: days,
    sessionsStarted,
    sessionsFinished,
    doneRatePercent,
    gateShown,
    gateRedirects,
    continueAnyway,
    estimatedMinutesSaved,
    modeBreakdown,
    dailyActivity,
    topIntents,
    savedCardsCount: savedCards.length,
    completedCardsCount,
    totalTakeawaysChecked,
    intentionalityScore,
  };
}

export async function exportDogfoodStatsJson(): Promise<string> {
  const sessionLog = await getSessionLog();
  const savedCards = await getSavedCards();
  const gateStats = AndroidGate.getGateStats();
  const weeklyInsights = await getInsightsData(7);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    summary: weeklyInsights,
    gateStats,
    sessionLog,
    savedCardsCount: savedCards.length,
  };

  return JSON.stringify(exportPayload, null, 2);
}

export async function exportStudyGuideMarkdown(): Promise<string> {
  const savedCards = await getSavedCards();
  if (savedCards.length === 0) {
    return '# Skip the Scroll — Study Guide\n\nNo saved cards yet.';
  }

  const lines: string[] = [
    '# Skip the Scroll — Intentional Study Guide',
    `Exported: ${new Date().toISOString().split('T')[0]} · ${savedCards.length} saved cards`,
    '',
  ];

  for (const item of savedCards) {
    const status = item.completed ? '[x] Reviewed' : '[ ] To Review';
    lines.push(`## ${status} — ${item.card.title}`);
    lines.push(`- **Intent:** ${item.intent}`);
    lines.push(`- **Source:** ${item.card.source} (${item.card.kind.toUpperCase()} · ${item.card.minutes} min)`);
    lines.push(`- **Link:** ${item.card.url}`);
    lines.push(`- **Why it matters:** ${item.card.why}`);
    lines.push('### Key Takeaways (TL;DR)');
    item.card.tldr.forEach((b, idx) => {
      const checked = item.checkedBullets?.includes(idx) ? '✓' : '•';
      lines.push(`  ${checked} ${b}`);
    });
    if (item.note) {
      lines.push(`### Personal Note\n> ${item.note}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

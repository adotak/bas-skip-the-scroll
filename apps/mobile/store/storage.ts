import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionLogEntry, SessionOutcome, Mode, TimeBox, Card } from '@skip-the-scroll/shared';
import { AndroidGate } from '@/modules/android-gate';

const LOG_KEY = 'session_log';
const RECENT_KEY = 'recent_intents';
const SAVED_CARDS_KEY = 'saved_cards_full';
const LEGACY_SAVED_CARDS_KEY = 'saved_cards';
const MAX_RECENT = 10;

export interface SavedCardRecord {
  card: Card;
  savedAt: string;
  intent: string;
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
}

// ─── Session log ─────────────────────────────────────────────────────────────

export async function getSessionLog(): Promise<SessionLogEntry[]> {
  const raw = await AsyncStorage.getItem(LOG_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function logSessionStart(params: {
  sessionId: string;
  intent: string;
  mode: Mode;
  timeboxMin: TimeBox;
  cardCount: number;
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
): Promise<void> {
  const log = await getSessionLog();
  const entry = log.find((e) => e.sessionId === sessionId);
  if (entry) {
    entry.outcome = outcome;
    entry.completedAt = new Date().toISOString();
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(log));
  }
}

// ─── Recent intents ──────────────────────────────────────────────────────────

export async function getRecentIntents(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(RECENT_KEY);
  return raw ? JSON.parse(raw) : [];
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

// ─── Saved cards ─────────────────────────────────────────────────────────────

export async function getSavedCards(): Promise<SavedCardRecord[]> {
  const raw = await AsyncStorage.getItem(SAVED_CARDS_KEY);
  return raw ? JSON.parse(raw) : [];
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

  list.unshift({
    card,
    savedAt: new Date().toISOString(),
    intent,
  });
  await AsyncStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(list));
  return true; // saved
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
  const legacyIds: string[] = rawLegacyIds ? JSON.parse(rawLegacyIds) : [];
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
  const legacyIds: string[] = rawLegacyIds ? JSON.parse(rawLegacyIds) : [];
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

export async function getInsightsData(days: number = 7): Promise<InsightsData> {
  const log = await getSessionLog();
  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

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

  // Native gate metrics
  const gateStats = AndroidGate.getGateStats();
  const gateShown = gateStats.gateShown;
  const gateRedirects = gateStats.redirects;
  const continueAnyway = gateStats.continueAnyway;

  // Estimated minutes saved:
  // Each gate redirect prevents an estimated ~15 min doomscroll session.
  // Plus, each finished intentional session saves focus time compared to mindless feeds.
  const estimatedMinutesSaved = (gateRedirects * 15) + (doneCount * 10);

  return {
    timeWindowDays: days,
    sessionsStarted,
    sessionsFinished,
    doneRatePercent,
    gateShown,
    gateRedirects,
    continueAnyway,
    estimatedMinutesSaved,
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

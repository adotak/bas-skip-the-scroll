import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionLogEntry, SessionOutcome, Mode, TimeBox } from '@skip-the-scroll/shared';

const LOG_KEY = 'session_log';
const RECENT_KEY = 'recent_intents';
const MAX_RECENT = 10;

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
  // Remove duplicate, prepend, cap at MAX_RECENT
  const filtered = intents.filter((i) => i !== intent);
  filtered.unshift(intent);
  await AsyncStorage.setItem(
    RECENT_KEY,
    JSON.stringify(filtered.slice(0, MAX_RECENT)),
  );
}

// ─── Saved cards ─────────────────────────────────────────────────────────────

const SAVED_KEY = 'saved_cards';

export async function getSavedCardIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(SAVED_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function toggleSavedCard(cardId: string): Promise<boolean> {
  const ids = await getSavedCardIds();
  const idx = ids.indexOf(cardId);
  if (idx >= 0) {
    ids.splice(idx, 1);
    await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(ids));
    return false; // unsaved
  }
  ids.push(cardId);
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(ids));
  return true; // saved
}

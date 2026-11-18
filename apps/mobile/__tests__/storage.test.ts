import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSessionLog,
  logSessionStart,
  logSessionEnd,
  getRecentIntents,
  addRecentIntent,
  getSavedCardIds,
  toggleSavedCard,
} from '../store/storage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('storage: session log', () => {
  test('logs session start and reads it back', async () => {
    await logSessionStart({
      sessionId: 's-123',
      intent: 'learn zustand',
      mode: 'learn',
      timeboxMin: 10,
      cardCount: 5,
    });

    const log = await getSessionLog();
    expect(log).toHaveLength(1);
    expect(log[0].sessionId).toBe('s-123');
    expect(log[0].intent).toBe('learn zustand');
    expect(log[0].createdAt).toBeDefined();
    expect(log[0].outcome).toBeUndefined();
  });

  test('logs session end with outcome', async () => {
    await logSessionStart({
      sessionId: 's-456',
      intent: 'fix bugs',
      mode: 'fix',
      timeboxMin: 5,
      cardCount: 3,
    });

    await logSessionEnd('s-456', 'done');

    const log = await getSessionLog();
    expect(log).toHaveLength(1);
    expect(log[0].outcome).toBe('done');
    expect(log[0].completedAt).toBeDefined();
  });
});

describe('storage: recent intents', () => {
  test('adds and retrieves recent intents with deduplication and unshift', async () => {
    await addRecentIntent('first intent');
    await addRecentIntent('second intent');
    await addRecentIntent('first intent');

    const recent = await getRecentIntents();
    expect(recent).toEqual(['first intent', 'second intent']);
  });

  test('caps recent intents at 10', async () => {
    for (let i = 1; i <= 15; i++) {
      await addRecentIntent(`intent ${i}`);
    }

    const recent = await getRecentIntents();
    expect(recent).toHaveLength(10);
    expect(recent[0]).toBe('intent 15');
  });
});

describe('storage: saved cards', () => {
  test('toggles saving and unsaving cards', async () => {
    const isSavedFirst = await toggleSavedCard('card-1');
    expect(isSavedFirst).toBe(true);

    let saved = await getSavedCardIds();
    expect(saved).toEqual(['card-1']);

    const isSavedSecond = await toggleSavedCard('card-1');
    expect(isSavedSecond).toBe(false);

    saved = await getSavedCardIds();
    expect(saved).toEqual([]);
  });
});

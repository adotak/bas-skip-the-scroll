import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Card } from '@skip-the-scroll/shared';
import {
  saveCard,
  getSavedCards,
  removeSavedCard,
  isCardSaved,
  getInsightsData,
  exportDogfoodStatsJson,
  logSessionStart,
  logSessionEnd,
} from '../store/storage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

const sampleCard: Card = {
  id: 'saved-card-1',
  kind: 'article',
  title: 'Learning with Intent',
  source: 'skipthescroll.app',
  url: 'https://example.com/intent',
  minutes: 6,
  tldr: ['First bullet', 'Second bullet', 'Third bullet'],
  why: 'Direct match',
};

describe('Library storage', () => {
  test('saves card and retrieves it', async () => {
    const isNowSaved = await saveCard(sampleCard, 'Test Intent');
    expect(isNowSaved).toBe(true);

    const saved = await getSavedCards();
    expect(saved).toHaveLength(1);
    expect(saved[0].card.id).toBe('saved-card-1');
    expect(saved[0].intent).toBe('Test Intent');
    expect(await isCardSaved('saved-card-1')).toBe(true);
  });

  test('toggle removes card when saved twice', async () => {
    await saveCard(sampleCard);
    const toggled = await saveCard(sampleCard);
    expect(toggled).toBe(false);

    const saved = await getSavedCards();
    expect(saved).toHaveLength(0);
    expect(await isCardSaved('saved-card-1')).toBe(false);
  });

  test('explicit removeSavedCard deletes record', async () => {
    await saveCard(sampleCard);
    await removeSavedCard('saved-card-1');
    const saved = await getSavedCards();
    expect(saved).toHaveLength(0);
  });
});

describe('Insights calculation', () => {
  test('calculates sessions, done rate and estimated minutes', async () => {
    // 2 sessions: 1 done, 1 refine
    await logSessionStart({
      sessionId: 's-1',
      intent: 'learn rust',
      mode: 'learn',
      timeboxMin: 10,
      cardCount: 5,
    });
    await logSessionEnd('s-1', 'done');

    await logSessionStart({
      sessionId: 's-2',
      intent: 'fix css',
      mode: 'fix',
      timeboxMin: 5,
      cardCount: 3,
    });
    await logSessionEnd('s-2', 'refine');

    const insights = await getInsightsData(7);
    expect(insights.sessionsStarted).toBe(2);
    expect(insights.sessionsFinished).toBe(2);
    expect(insights.doneRatePercent).toBe(50); // 1 done of 2 finished
    expect(insights.estimatedMinutesSaved).toBeGreaterThanOrEqual(10);
  });

  test('exportDogfoodStatsJson generates valid parseable JSON', async () => {
    await logSessionStart({
      sessionId: 's-export',
      intent: 'test export',
      mode: 'learn',
      timeboxMin: 10,
      cardCount: 4,
    });
    await logSessionEnd('s-export', 'done');
    await saveCard(sampleCard);

    const json = await exportDogfoodStatsJson();
    expect(typeof json).toBe('string');

    const parsed = JSON.parse(json);
    expect(parsed.exportedAt).toBeDefined();
    expect(parsed.summary).toBeDefined();
    expect(parsed.sessionLog).toHaveLength(1);
    expect(parsed.savedCardsCount).toBe(1);
  });
});

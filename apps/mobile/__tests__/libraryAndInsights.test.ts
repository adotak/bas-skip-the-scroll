import AsyncStorage from '@react-native-async-storage/async-storage';
import { detectIntentLanguage, type Card } from '@skip-the-scroll/shared';
import {
  saveCard,
  getSavedCards,
  removeSavedCard,
  isCardSaved,
  getInsightsData,
  exportDogfoodStatsJson,
  exportStudyGuideMarkdown,
  toggleCardTakeaway,
  getCardTakeaways,
  saveCardNote,
  getCardNote,
  toggleSavedCardCompleted,
  setActiveAllowance,
  getActiveAllowance,
  clearActiveAllowance,
  logSessionStart,
  logSessionEnd,
} from '../store/storage';
import { buildDynamicOfflineSession } from '../fixtures/sessions';

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

  test('supports a 30-day insights window', async () => {
    await logSessionStart({
      sessionId: 's-30',
      intent: 'learn month-long topic',
      mode: 'learn',
      timeboxMin: 20,
      cardCount: 7,
    });
    await logSessionEnd('s-30', 'done');

    const insights = await getInsightsData(30);
    expect(insights.timeWindowDays).toBe(30);
    expect(insights.sessionsStarted).toBe(1);
    expect(insights.doneRatePercent).toBe(100);
    expect(insights.dailyActivity).toHaveLength(7);
    expect(insights.modeBreakdown.learn).toBe(1);
  });

  test('tracks interactive takeaways, card notes, completion, and markdown export', async () => {
    await saveCard(sampleCard, 'Test Intent');
    const checked = await toggleCardTakeaway(sampleCard.id, 0);
    expect(checked).toEqual([0]);
    expect(await getCardTakeaways(sampleCard.id)).toEqual([0]);

    await saveCardNote(sampleCard.id, 'Use this pattern in our Express router');
    expect(await getCardNote(sampleCard.id)).toBe('Use this pattern in our Express router');

    const isCompleted = await toggleSavedCardCompleted(sampleCard.id);
    expect(isCompleted).toBe(true);

    const markdown = await exportStudyGuideMarkdown();
    expect(markdown).toContain('# Skip the Scroll — Intentional Study Guide');
    expect(markdown).toContain('[x] Reviewed — Learning with Intent');
    expect(markdown).toContain('Use this pattern in our Express router');
  });

  test('manages active break allowance and language detection + offline synthesis', async () => {
    expect(detectIntentLanguage('react hooks kaise kaam karte hain')).toBe('roman-ur');
    expect(detectIntentLanguage('ری ایکٹ ہکس')).toBe('ur');
    expect(detectIntentLanguage('learn React hooks')).toBe('en');

    await setActiveAllowance('Instagram', 5);
    const active = await getActiveAllowance();
    expect(active?.targetApp).toBe('Instagram');
    expect(active?.minutes).toBe(5);

    await clearActiveAllowance();
    expect(await getActiveAllowance()).toBeNull();

    const offlineSession = buildDynamicOfflineSession(
      'react hooks kaise kaam karte hain',
      'learn',
      10
    );
    expect(offlineSession.lang).toBe('roman-ur');
    expect(offlineSession.cards.length).toBeGreaterThan(0);
    expect(offlineSession.meta?.isFallback).toBe(true);
    expect(offlineSession.meta?.suggestedRefinements?.length).toBeGreaterThan(0);
  });
});

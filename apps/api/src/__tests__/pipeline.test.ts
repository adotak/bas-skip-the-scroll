import { ContentPipeline } from '../pipeline';
import type { Provider, Candidate } from '../types';
import type { LLMClient } from '../llm/client';
import type { Card } from '@skip-the-scroll/shared';
import { clearMemoryCache } from '../cache/mongo';

describe('ContentPipeline', () => {
  beforeEach(() => {
    clearMemoryCache();
  });

  const mockProvider: Provider = {
    name: 'mock',
    search: async (query: string): Promise<Candidate[]> => [
      {
        id: 'mock-1',
        kind: 'article',
        title: `Guide to ${query}`,
        source: 'example.com',
        url: 'https://example.com/guide',
        snippet: 'Comprehensive introduction and step by step walkthrough.',
        minutes: 5,
      },
      {
        id: 'mock-2',
        kind: 'video',
        title: `Video on ${query}`,
        source: 'YoutubeChannel',
        url: 'https://youtube.com/watch?v=123',
        embedId: '123',
        snippet: 'Visual breakdown and examples.',
        minutes: 8,
      },
    ],
  };

  const mockLLM: LLMClient = {
    normalise: async (intent: string) => [intent.toLowerCase()],
    rankAndSummarise: async (intent, _mode, _timebox, candidates): Promise<Card[]> =>
      candidates.map((c) => ({
        id: c.id,
        kind: c.kind,
        title: c.title,
        source: c.source,
        url: c.url,
        embedId: c.embedId,
        minutes: c.minutes ?? 5,
        tldr: ['First bullet point', 'Second bullet point', 'Third bullet point'],
        why: `Matches ${intent}`,
      })),
  };

  test('runs pipeline and returns valid Session with cards', async () => {
    const pipeline = new ContentPipeline({
      providers: [mockProvider],
      llmClient: mockLLM,
    });

    const session = await pipeline.run('learn rust', 'learn', 20);

    expect(session.id).toBeDefined();
    expect(session.intent).toBe('learn rust');
    expect(session.cards.length).toBe(2);
    expect(session.cards[0].tldr).toHaveLength(3);
  });

  test('returns cached session on identical subsequent call', async () => {
    let callCount = 0;
    const trackingProvider: Provider = {
      name: 'tracking',
      search: async (): Promise<Candidate[]> => {
        callCount++;
        return mockProvider.search('cached');
      },
    };

    const pipeline = new ContentPipeline({
      providers: [trackingProvider],
      llmClient: mockLLM,
    });

    await pipeline.run('learn rust', 'learn', 10);
    expect(callCount).toBe(1);

    // Second call should hit cache
    const second = await pipeline.run('learn rust', 'learn', 10);
    expect(callCount).toBe(1); // Provider was not called again!
    expect(second.intent).toBe('learn rust');
  });

  test('degrades gracefully if provider throws', async () => {
    const failingProvider: Provider = {
      name: 'failing',
      search: async () => {
        throw new Error('Network error');
      },
    };

    const pipeline = new ContentPipeline({
      providers: [failingProvider, mockProvider],
      llmClient: mockLLM,
    });

    const session = await pipeline.run('learn rust', 'learn', 10);
    expect(session.cards.length).toBeGreaterThan(0);
  });
});

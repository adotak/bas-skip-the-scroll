import type { Session, Mode, TimeBox } from '@skip-the-scroll/shared';
import type { Candidate, Provider } from './types';
import type { LLMClient } from './llm/client';
import { generateCacheKey, getCachedSession, setCachedSession } from './cache/mongo';
import { applyGuardrails } from './guardrails';
import { YouTubeProvider } from './providers/youtube';
import { GoogleSearchProvider } from './providers/googleSearch';
import { WikipediaProvider } from './providers/wikipedia';
import { GeminiLLMClient } from './llm/gemini';

export interface PipelineOptions {
  providers?: Provider[];
  llmClient?: LLMClient;
}

export class ContentPipeline {
  private providers: Provider[];
  private llmClient: LLMClient;

  constructor(options?: PipelineOptions) {
    this.providers = options?.providers ?? [
      new YouTubeProvider(),
      new GoogleSearchProvider(),
      new WikipediaProvider(),
    ];
    this.llmClient = options?.llmClient ?? new GeminiLLMClient();
  }

  async run(intent: string, mode: Mode = 'learn', timeboxMin: TimeBox = 10): Promise<Session> {
    const trimmedIntent = intent.trim();
    const cacheKey = generateCacheKey(trimmedIntent, mode, timeboxMin);

    // 1. Cache hit check (< 0.5s)
    const cached = await getCachedSession(cacheKey);
    if (cached) {
      console.log(`[Pipeline] Cache hit for "${trimmedIntent}"`);
      return cached;
    }

    console.log(`[Pipeline] Cache miss for "${trimmedIntent}"`);

    // 2. Normalise intent via LLM
    const queries = await this.llmClient.normalise(trimmedIntent, mode);
    const searchQuery = queries[0] || trimmedIntent;

    // 3. Parallel fetch across providers
    const fetchPromises = this.providers.map(async (provider) => {
      try {
        return await provider.search(searchQuery, { limit: 5, mode });
      } catch (err) {
        console.warn(`[Pipeline] Provider ${provider.name} error:`, (err as Error).message);
        return [] as Candidate[];
      }
    });

    const results = await Promise.all(fetchPromises);
    const allCandidates = results.flat();

    // 4. Merge & deduplicate candidates
    const dedupedCandidates = this.deduplicateCandidates(allCandidates);

    // 5. LLM Rank & Summarise
    const rawCards = await this.llmClient.rankAndSummarise(
      trimmedIntent,
      mode,
      timeboxMin,
      dedupedCandidates
    );

    // 6. Apply deterministic guardrails
    const finalCards = applyGuardrails(rawCards, { timeboxMin, targetCount: 7 });

    const session: Session = {
      id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      intent: trimmedIntent,
      mode,
      timeboxMin,
      cards: finalCards,
      createdAt: new Date().toISOString(),
    };

    // 7. Store in cache (24h TTL)
    if (finalCards.length > 0) {
      await setCachedSession(cacheKey, session);
    }

    return session;
  }

  private deduplicateCandidates(candidates: Candidate[]): Candidate[] {
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();
    const deduped: Candidate[] = [];

    for (const c of candidates) {
      const normalizedTitle = c.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seenUrls.has(c.url) && !seenTitles.has(normalizedTitle)) {
        seenUrls.add(c.url);
        seenTitles.add(normalizedTitle);
        deduped.push(c);
      }
    }

    return deduped;
  }
}

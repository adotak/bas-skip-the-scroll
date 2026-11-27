import {
  detectIntentLanguage,
  type Session,
  type Mode,
  type TimeBox,
  type Language,
} from '@skip-the-scroll/shared';
import type { Candidate, Provider } from './types';
import type { LLMClient } from './llm/client';
import { generateCacheKey, getCachedSession, setCachedSession } from './cache/mongo';
import { applyGuardrails } from './guardrails';
import { YouTubeProvider } from './providers/youtube';
import { GoogleSearchProvider } from './providers/googleSearch';
import { WikipediaProvider } from './providers/wikipedia';
import { DevCommunityProvider } from './providers/devCommunity';
import {
  getSuggestedRefinements,
  synthesizeCuratedCandidates,
} from './providers/curatedKnowledge';
import { GeminiLLMClient } from './llm/gemini';

export interface PipelineOptions {
  providers?: Provider[];
  llmClient?: LLMClient;
  enableKnowledgeFallback?: boolean;
}

export class ContentPipeline {
  private providers: Provider[];
  private llmClient: LLMClient;
  private enableKnowledgeFallback: boolean;

  constructor(options?: PipelineOptions) {
    this.providers = options?.providers ?? [
      new YouTubeProvider(),
      new GoogleSearchProvider(),
      new WikipediaProvider(),
      new DevCommunityProvider(),
    ];
    this.llmClient = options?.llmClient ?? new GeminiLLMClient();
    this.enableKnowledgeFallback = options?.enableKnowledgeFallback ?? !options?.providers;
  }

  async run(
    intent: string,
    mode: Mode = 'learn',
    timeboxMin: TimeBox = 10,
    explicitLang?: Language
  ): Promise<Session> {
    const trimmedIntent = intent.trim();
    const lang: Language = explicitLang ?? detectIntentLanguage(trimmedIntent);
    const cacheKey = generateCacheKey(
      lang === 'en' ? trimmedIntent : `${trimmedIntent}::${lang}`,
      mode,
      timeboxMin
    );

    // 1. Cache hit check (< 0.5s)
    const cached = await getCachedSession(cacheKey);
    if (cached) {
      console.log(`[Pipeline] Cache hit for "${trimmedIntent}"`);
      return {
        ...cached,
        meta: {
          ...cached.meta,
          isCached: true,
        },
      };
    }

    console.log(`[Pipeline] Cache miss for "${trimmedIntent}" (${lang})`);

    // 2. Normalise intent via LLM
    const queries = await this.llmClient.normalise(trimmedIntent, mode, lang);
    const searchQuery = queries[0] || trimmedIntent;

    // 3. Parallel fetch across providers
    const providersUsed: string[] = [];
    const degradedProviders: string[] = [];

    const fetchPromises = this.providers.map(async (provider) => {
      try {
        const items = await provider.search(searchQuery, { limit: 5, mode, lang });
        if (items.length > 0) {
          providersUsed.push(provider.name);
        }
        return items;
      } catch (err) {
        console.warn(`[Pipeline] Provider ${provider.name} error:`, (err as Error).message);
        degradedProviders.push(provider.name);
        return [] as Candidate[];
      }
    });

    const results = await Promise.all(fetchPromises);
    let allCandidates = results.flat();
    let isFallback = false;

    // 3b. Dynamic zero-key / offline knowledge synthesis fallback
    if (allCandidates.length === 0 && this.enableKnowledgeFallback) {
      allCandidates = synthesizeCuratedCandidates(trimmedIntent, mode);
      providersUsed.push('curated_knowledge');
      isFallback = true;
    }

    // 4. Merge & deduplicate candidates
    const dedupedCandidates = this.deduplicateCandidates(allCandidates);

    // 5. LLM Rank & Summarise
    const rawCards = await this.llmClient.rankAndSummarise(
      trimmedIntent,
      mode,
      timeboxMin,
      dedupedCandidates,
      lang
    );

    // 6. Apply deterministic guardrails
    const finalCards = applyGuardrails(rawCards, { timeboxMin, targetCount: 7 });
    const totalMinutes = finalCards.reduce((sum, c) => sum + c.minutes, 0);

    const session: Session = {
      id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      intent: trimmedIntent,
      mode,
      timeboxMin,
      lang,
      cards: finalCards,
      createdAt: new Date().toISOString(),
      meta: {
        isCached: false,
        isFallback,
        providersUsed,
        degradedProviders: degradedProviders.length > 0 ? degradedProviders : undefined,
        normalisedQueries: queries,
        totalMinutes,
        suggestedRefinements: getSuggestedRefinements(trimmedIntent, mode),
      },
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

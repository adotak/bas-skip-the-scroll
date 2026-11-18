import type { Candidate, Provider, SearchOptions } from '../types';
import { canCallProvider, recordProviderCall } from '../quota/guard';

export class GoogleSearchProvider implements Provider {
  readonly name = 'google_search';

  async search(query: string, options?: SearchOptions): Promise<Candidate[]> {
    const apiKey = process.env.GOOGLE_CSE_API_KEY || process.env.YOUTUBE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;

    if (!apiKey || !cseId) {
      console.log('[GoogleSearchProvider] GOOGLE_CSE_API_KEY or GOOGLE_CSE_ID missing; skipping search.');
      return [];
    }

    if (!canCallProvider('custom_search')) {
      console.warn('[GoogleSearchProvider] Custom Search quota exhausted; skipping search.');
      return [];
    }

    const limit = options?.limit ?? 5;
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', cseId);
    url.searchParams.set('q', query);
    url.searchParams.set('num', String(Math.min(limit, 10)));

    try {
      recordProviderCall('custom_search');
      const response = await fetch(url.toString(), { signal: AbortSignal.timeout(4000) });
      if (!response.ok) {
        console.warn(`[GoogleSearchProvider] API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json() as {
        items?: Array<{
          title: string;
          link: string;
          snippet: string;
          displayLink: string;
        }>;
      };

      if (!data.items || !Array.isArray(data.items)) {
        return [];
      }

      return data.items
        .filter((item) => !item.link.includes('youtube.com') && !item.link.includes('youtu.be'))
        .map((item, idx): Candidate => ({
          id: `gcs-${idx}-${Math.abs(item.link.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))}`,
          kind: item.link.includes('/docs') || item.link.includes('developer.') ? 'doc' : 'article',
          title: item.title,
          source: item.displayLink.replace(/^www\./, ''),
          url: item.link,
          snippet: item.snippet,
          minutes: 6,
        }));
    } catch (err) {
      console.warn('[GoogleSearchProvider] Fetch failed:', (err as Error).message);
      return [];
    }
  }
}

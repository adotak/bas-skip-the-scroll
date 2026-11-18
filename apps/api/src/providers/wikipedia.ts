import type { Candidate, Provider, SearchOptions } from '../types';

export class WikipediaProvider implements Provider {
  readonly name = 'wikipedia';

  async search(query: string, options?: SearchOptions): Promise<Candidate[]> {
    const limit = options?.limit ?? 3;
    const url = new URL('https://en.wikipedia.org/w/rest.php/v1/search/title');
    url.searchParams.set('q', query);
    url.searchParams.set('limit', String(limit));

    try {
      const response = await fetch(url.toString(), {
        headers: { 'User-Agent': 'SkipTheScroll/0.0.1 (educational bot)' },
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json() as {
        pages?: Array<{
          id: number;
          key: string;
          title: string;
          description?: string;
          thumbnail?: { url: string };
        }>;
      };

      if (!data.pages || !Array.isArray(data.pages)) {
        return [];
      }

      return data.pages.map((p): Candidate => ({
        id: `wiki-${p.id}`,
        kind: 'doc',
        title: `${p.title} (Wikipedia)`,
        source: 'wikipedia.org',
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.key)}`,
        snippet: p.description || p.title,
        minutes: 5,
      }));
    } catch (err) {
      console.warn('[WikipediaProvider] Fetch failed:', (err as Error).message);
      return [];
    }
  }
}

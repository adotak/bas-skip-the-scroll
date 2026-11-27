import type { Candidate, Provider, SearchOptions } from '../types';

/**
 * Zero-key public developer knowledge provider.
 * Queries Dev.to articles API and StackOverflow Q&A API (for 'fix' mode)
 * so the backend can fetch live community articles and troubleshooting guides
 * even when Google Custom Search / YouTube API keys are not configured.
 */
export class DevCommunityProvider implements Provider {
  readonly name = 'dev_community';

  async search(query: string, options?: SearchOptions): Promise<Candidate[]> {
    const limit = options?.limit ?? 4;
    const mode = options?.mode ?? 'learn';

    const tasks: Promise<Candidate[]>[] = [this.fetchDevTo(query, limit)];
    if (mode === 'fix' || mode === 'learn') {
      tasks.push(this.fetchStackOverflow(query, Math.max(2, Math.floor(limit / 2))));
    }

    const results = await Promise.all(tasks);
    return results.flat().slice(0, limit);
  }

  private async fetchDevTo(query: string, limit: number): Promise<Candidate[]> {
    const url = new URL('https://dev.to/api/articles');
    url.searchParams.set('per_page', String(limit));
    url.searchParams.set('tag', query.toLowerCase().split(/\s+/)[0]?.replace(/[^a-z0-9]/g, '') || 'programming');

    try {
      const response = await fetch(url.toString(), {
        headers: { 'User-Agent': 'SkipTheScroll/1.0 (intentional learning app)' },
        signal: AbortSignal.timeout(2800),
      });
      if (!response.ok) return [];

      const items = (await response.json()) as Array<{
        id: number;
        title: string;
        description: string;
        url: string;
        reading_time_minutes?: number;
        cover_image?: string | null;
        tag_list?: string[];
        user?: { name?: string };
      }>;

      if (!Array.isArray(items)) return [];

      return items.slice(0, limit).map((item): Candidate => ({
        id: `devto-${item.id}`,
        kind: 'article',
        title: item.title,
        source: item.user?.name ? `dev.to · ${item.user.name}` : 'dev.to',
        url: item.url,
        snippet: item.description || item.title,
        minutes: Math.max(2, item.reading_time_minutes ?? 5),
        thumbnail: item.cover_image ?? undefined,
        tags: Array.isArray(item.tag_list) ? item.tag_list.slice(0, 3) : undefined,
      }));
    } catch {
      return [];
    }
  }

  private async fetchStackOverflow(query: string, limit: number): Promise<Candidate[]> {
    const url = new URL('https://api.stackexchange.com/2.3/search/advanced');
    url.searchParams.set('order', 'desc');
    url.searchParams.set('sort', 'relevance');
    url.searchParams.set('q', query);
    url.searchParams.set('accepted', 'True');
    url.searchParams.set('site', 'stackoverflow');
    url.searchParams.set('pagesize', String(limit));

    try {
      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(2800),
      });
      if (!response.ok) return [];

      const data = (await response.json()) as {
        items?: Array<{
          question_id: number;
          title: string;
          link: string;
          tags?: string[];
          answer_count?: number;
          score?: number;
        }>;
      };

      if (!Array.isArray(data.items)) return [];

      return data.items.slice(0, limit).map((q): Candidate => ({
        id: `so-${q.question_id}`,
        kind: 'doc',
        title: q.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'),
        source: 'stackoverflow.com',
        url: q.link,
        snippet: `Verified community solution (${q.score ?? 1}+ votes, ${q.answer_count ?? 1} answers) covering ${(q.tags ?? []).join(', ') || query}.`,
        minutes: 4,
        difficulty: 'intermediate',
        tags: q.tags?.slice(0, 3),
      }));
    } catch {
      return [];
    }
  }
}

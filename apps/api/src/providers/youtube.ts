import type { Candidate, Provider, SearchOptions } from '../types';
import { canCallProvider, recordProviderCall } from '../quota/guard';

export class YouTubeProvider implements Provider {
  readonly name = 'youtube';

  async search(query: string, options?: SearchOptions): Promise<Candidate[]> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.log('[YouTubeProvider] YOUTUBE_API_KEY not configured; skipping YouTube search.');
      return [];
    }

    if (!canCallProvider('youtube')) {
      console.warn('[YouTubeProvider] YouTube quota exhausted; skipping YouTube search.');
      return [];
    }

    const limit = options?.limit ?? 5;
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'video');
    url.searchParams.set('videoEmbeddable', 'true');
    url.searchParams.set('videoSyndicated', 'true');
    url.searchParams.set('maxResults', String(limit));
    url.searchParams.set('key', apiKey);

    try {
      recordProviderCall('youtube');
      const response = await fetch(url.toString(), { signal: AbortSignal.timeout(4000) });
      if (!response.ok) {
        console.warn(`[YouTubeProvider] API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json() as {
        items?: Array<{
          id: { videoId: string };
          snippet: {
            title: string;
            channelTitle: string;
            description: string;
            thumbnails?: { medium?: { url: string }; default?: { url: string } };
          };
        }>;
      };

      if (!data.items || !Array.isArray(data.items)) {
        return [];
      }

      return data.items.map((item): Candidate => ({
        id: `yt-${item.id.videoId}`,
        kind: 'video',
        title: item.snippet.title,
        source: item.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        embedId: item.id.videoId,
        snippet: item.snippet.description,
        minutes: 10, // Default estimate, refined by LLM if needed
      }));
    } catch (err) {
      console.warn('[YouTubeProvider] Fetch failed:', (err as Error).message);
      return [];
    }
  }
}

import {
  generateCacheKey,
  getCachedSession,
  setCachedSession,
  clearMemoryCache,
} from '../cache/mongo';
import type { Session } from '@skip-the-scroll/shared';

describe('cache', () => {
  beforeEach(() => {
    clearMemoryCache();
  });

  const testSession: Session = {
    id: 'cache-test-1',
    intent: 'learn react hooks',
    mode: 'learn',
    timeboxMin: 10,
    cards: [],
    createdAt: new Date().toISOString(),
  };

  test('generates deterministic sha256 cache key', () => {
    const k1 = generateCacheKey('learn react hooks', 'learn', 10);
    const k2 = generateCacheKey('  LEARN REACT HOOKS  ', 'learn', 10);
    expect(k1).toBe(k2);
    expect(k1.length).toBe(64);
  });

  test('stores and retrieves cached session', async () => {
    const key = generateCacheKey('learn react hooks', 'learn', 10);
    expect(await getCachedSession(key)).toBeNull();

    await setCachedSession(key, testSession);
    const retrieved = await getCachedSession(key);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(testSession.id);
    expect(retrieved?.intent).toBe(testSession.intent);
  });
});

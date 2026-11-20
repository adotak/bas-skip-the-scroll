import { fetchSessionFromApi, SessionFetchError } from '../api/client';

describe('fetchSessionFromApi', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.clearAllMocks();
  });

  test('returns a server session with cards', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'session-1',
        intent: 'learn hooks',
        mode: 'learn',
        timeboxMin: 10,
        cards: [{ id: 'card-1' }],
        createdAt: new Date().toISOString(),
      }),
    }) as jest.Mock;

    await expect(fetchSessionFromApi('learn hooks', 'learn', 10)).resolves.toMatchObject({
      id: 'session-1',
    });
  });

  test('reports network failures as offline errors', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('timeout')) as jest.Mock;

    await expect(fetchSessionFromApi('learn hooks', 'learn', 10)).rejects.toMatchObject({
      name: 'SessionFetchError',
      kind: 'offline',
    });
  });

  test('reports empty successful responses without creating fake content', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ cards: [] }),
    }) as jest.Mock;

    await expect(fetchSessionFromApi('unknown topic', 'learn', 10)).rejects.toMatchObject({
      name: 'SessionFetchError',
      kind: 'empty',
    });
  });
});

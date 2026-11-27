import { Request, Response } from 'express';
import { healthRouter } from '../routes/health';
import { sessionsRouter } from '../routes/sessions';
import { clearMemoryCache } from '../cache/mongo';

function createMockResponse() {
  const res: Partial<Response> = {};
  res.statusCode = 200;
  res.status = jest.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockImplementation((data: unknown) => {
    (res as { body?: unknown }).body = data;
    return res;
  });
  return res as Response & { body?: unknown };
}

describe('API routes', () => {
  beforeEach(() => {
    clearMemoryCache();
  });

  test('GET /v1/health returns 200 with quota status', async () => {
    const req = {} as Request;
    const res = createMockResponse();

    // Test the health handler directly
    const handler = (healthRouter.stack.find((layer) => layer.route?.path === '/health')?.route?.stack[0] as { handle: Function })?.handle;
    expect(handler).toBeDefined();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect((res.body as { status: string }).status).toBe('ok');
    expect((res.body as { quota: unknown }).quota).toBeDefined();
  });

  test('POST /v1/sessions rejects missing intent with 400', async () => {
    const req = {
      body: { mode: 'learn', timeboxMin: 10 },
    } as Request;
    const res = createMockResponse();

    const handler = (sessionsRouter.stack.find((layer) => layer.route?.path === '/sessions')?.route?.stack[0] as { handle: Function })?.handle;
    expect(handler).toBeDefined();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect((res.body as { error: string }).error).toContain('intent');
  });

  test('POST /v1/sessions rejects overlong intent with 400', async () => {
    const req = {
      body: { intent: 'x'.repeat(501), mode: 'learn', timeboxMin: 10 },
    } as Request;
    const res = createMockResponse();

    const handler = (sessionsRouter.stack.find((layer) => layer.route?.path === '/sessions')?.route?.stack[0] as { handle: Function })?.handle;
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect((res.body as { error: string }).error).toContain('500 characters');
  });

  test('POST /v1/sessions returns session for valid intent', async () => {
    const req = {
      body: { intent: 'learn typescript', mode: 'learn', timeboxMin: 10 },
    } as Request;
    const res = createMockResponse();

    const handler = (sessionsRouter.stack.find((layer) => layer.route?.path === '/sessions')?.route?.stack[0] as { handle: Function })?.handle;
    expect(handler).toBeDefined();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const session = res.body as {
      id: string;
      intent: string;
      lang: string;
      cards: unknown[];
      meta?: { suggestedRefinements?: string[] };
    };
    expect(session.id).toBeDefined();
    expect(session.intent).toBe('learn typescript');
    expect(session.lang).toBe('en');
    expect(Array.isArray(session.cards)).toBe(true);
    expect(session.cards.length).toBeGreaterThan(0);
    expect(session.meta?.suggestedRefinements?.length).toBeGreaterThan(0);
  });

  test('POST /v1/sessions auto-detects Roman Urdu intent and localizes TL;DR', async () => {
    const req = {
      body: { intent: 'react hooks kaise kaam karte hain', mode: 'learn', timeboxMin: 10 },
    } as Request;
    const res = createMockResponse();

    const handler = (sessionsRouter.stack.find((layer) => layer.route?.path === '/sessions')?.route?.stack[0] as { handle: Function })?.handle;
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const session = res.body as { lang: string; cards: Array<{ tldr: string[] }> };
    expect(session.lang).toBe('roman-ur');
    expect(session.cards.length).toBeGreaterThan(0);
    expect(session.cards[0].tldr).toHaveLength(3);
  });

  test('GET /v1/suggestions returns starter prompts by mode and language', async () => {
    const req = {
      query: { mode: 'fix', lang: 'roman-ur' },
    } as unknown as Request;
    const res = createMockResponse();

    const handler = (sessionsRouter.stack.find((layer) => layer.route?.path === '/suggestions')?.route?.stack[0] as { handle: Function })?.handle;
    expect(handler).toBeDefined();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.body as { mode: string; lang: string; suggestions: string[] };
    expect(body.mode).toBe('fix');
    expect(body.lang).toBe('roman-ur');
    expect(Array.isArray(body.suggestions)).toBe(true);
    expect(body.suggestions.length).toBeGreaterThan(0);
  });
});

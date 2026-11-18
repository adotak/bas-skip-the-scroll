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

  test('POST /v1/sessions returns session for valid intent', async () => {
    const req = {
      body: { intent: 'learn typescript', mode: 'learn', timeboxMin: 10 },
    } as Request;
    const res = createMockResponse();

    const handler = (sessionsRouter.stack.find((layer) => layer.route?.path === '/sessions')?.route?.stack[0] as { handle: Function })?.handle;
    expect(handler).toBeDefined();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const session = res.body as { id: string; intent: string; cards: unknown[] };
    expect(session.id).toBeDefined();
    expect(session.intent).toBe('learn typescript');
    expect(Array.isArray(session.cards)).toBe(true);
  });
});

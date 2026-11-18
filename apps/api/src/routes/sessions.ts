import { Router, Request, Response } from 'express';
import type { Mode, TimeBox } from '@skip-the-scroll/shared';
import { MODES, TIME_BOXES } from '@skip-the-scroll/shared';
import { ContentPipeline } from '../pipeline';

export const sessionsRouter = Router();
const pipeline = new ContentPipeline();

sessionsRouter.post('/sessions', async (req: Request, res: Response) => {
  const { intent, mode, timeboxMin } = req.body as {
    intent?: unknown;
    mode?: unknown;
    timeboxMin?: unknown;
  };

  if (!intent || typeof intent !== 'string' || !intent.trim()) {
    return res.status(400).json({
      error: 'Invalid request: "intent" is required and must be a non-empty string.',
    });
  }

  const selectedMode: Mode = MODES.includes(mode as Mode)
    ? (mode as Mode)
    : 'learn';

  const selectedTimebox: TimeBox = TIME_BOXES.includes(timeboxMin as TimeBox)
    ? (timeboxMin as TimeBox)
    : 10;

  try {
    const session = await pipeline.run(intent, selectedMode, selectedTimebox);
    return res.status(200).json(session);
  } catch (err) {
    console.error('[SessionsRouter] Pipeline execution error:', err);
    return res.status(500).json({
      error: 'Failed to generate session deck. Please try again.',
      details: (err as Error).message,
    });
  }
});

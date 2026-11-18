import { Router, Request, Response } from 'express';
import { getQuotaStatus } from '../quota/guard';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    quota: getQuotaStatus(),
  });
});

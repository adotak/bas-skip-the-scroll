import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { healthRouter } from './routes/health';
import { sessionsRouter } from './routes/sessions';

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json());

// API v1 routes
app.use('/v1', healthRouter);
app.use('/v1', sessionsRouter);

// Root fallback / ping
app.get('/', (_req, res) => {
  res.json({ name: 'Skip the Scroll API', version: '1.0.0' });
});

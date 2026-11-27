import { Router, Request, Response } from 'express';
import type { Language, Mode, TimeBox } from '@skip-the-scroll/shared';
import { LANGUAGES, MODES, TIME_BOXES } from '@skip-the-scroll/shared';
import { ContentPipeline } from '../pipeline';

export const sessionsRouter = Router();
const pipeline = new ContentPipeline();

const STARTER_SUGGESTIONS: Record<Mode, { en: string[]; 'roman-ur': string[]; ur: string[] }> = {
  learn: {
    en: [
      'learn React hooks mental model',
      'TypeScript generics & type narrowing',
      'how PostgreSQL indexing works',
      'Git rebase vs merge workflow',
    ],
    'roman-ur': [
      'react hooks kaise kaam karte hain',
      'typescript generics asaan alfaaz mein',
      'rest api aur graphql mein kya farq hai',
    ],
    ur: [
      'ری ایکٹ ہکس کیسے کام کرتے ہیں',
      'سسٹم ڈیزائن کے بنیادی اصول',
    ],
  },
  fix: {
    en: [
      'fix CORS error in Express API',
      'resolve React hydration mismatch',
      'fix Android background service killed',
      'debug slow MongoDB query latency',
    ],
    'roman-ur': [
      'express mein cors error kaise theek karein',
      'react useeffect infinite loop masla',
    ],
    ur: [
      'ایکسپریس میں کورس ایرر کا حل',
    ],
  },
  watch: {
    en: [
      'system design interview step by step',
      'event loop & async JavaScript visualised',
      'Docker & containers in 10 minutes',
    ],
    'roman-ur': [
      'system design interview ki tayari kaise karein',
      'docker containers kya hain',
    ],
    ur: [
      'سسٹم ڈیزائن انٹرویو گائیڈ',
    ],
  },
  read: {
    en: [
      'clean architecture in Node & TypeScript',
      'designing data-intensive applications summary',
      'OWASP top 10 web security checklist',
    ],
    'roman-ur': [
      'clean code likhne ke behtareen usool',
      'web security aur authentication guide',
    ],
    ur: [
      'بہترین کوڈنگ کے اصول',
    ],
  },
};

sessionsRouter.get('/suggestions', (req: Request, res: Response) => {
  const modeParam = req.query.mode as Mode | undefined;
  const langParam = req.query.lang as Language | undefined;
  const selectedMode: Mode = MODES.includes(modeParam as Mode) ? (modeParam as Mode) : 'learn';
  const selectedLang: Language = LANGUAGES.includes(langParam as Language) ? (langParam as Language) : 'en';

  return res.status(200).json({
    mode: selectedMode,
    lang: selectedLang,
    suggestions: STARTER_SUGGESTIONS[selectedMode][selectedLang] ?? STARTER_SUGGESTIONS[selectedMode].en,
  });
});

sessionsRouter.post('/sessions', async (req: Request, res: Response) => {
  const { intent, mode, timeboxMin, lang } = req.body as {
    intent?: unknown;
    mode?: unknown;
    timeboxMin?: unknown;
    lang?: unknown;
  };

  if (!intent || typeof intent !== 'string' || !intent.trim()) {
    return res.status(400).json({
      error: 'Invalid request: "intent" is required and must be a non-empty string.',
    });
  }

  if (intent.trim().length > 500) {
    return res.status(400).json({
      error: 'Invalid request: "intent" must be 500 characters or fewer.',
    });
  }

  const selectedMode: Mode = MODES.includes(mode as Mode)
    ? (mode as Mode)
    : 'learn';

  const selectedTimebox: TimeBox = TIME_BOXES.includes(timeboxMin as TimeBox)
    ? (timeboxMin as TimeBox)
    : 10;

  const selectedLang: Language | undefined = LANGUAGES.includes(lang as Language)
    ? (lang as Language)
    : undefined;

  try {
    const session = await pipeline.run(intent, selectedMode, selectedTimebox, selectedLang);
    return res.status(200).json(session);
  } catch (err) {
    console.error('[SessionsRouter] Pipeline execution error:', err);
    return res.status(500).json({
      error: 'Failed to generate session deck. Please try again.',
      details: (err as Error).message,
    });
  }
});

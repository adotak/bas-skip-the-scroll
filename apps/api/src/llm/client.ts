import type { Card, Language, Mode, TimeBox } from '@skip-the-scroll/shared';
import type { Candidate } from '../types';

export interface LLMClient {
  normalise(intent: string, mode: Mode, lang?: Language): Promise<string[]>;
  rankAndSummarise(
    intent: string,
    mode: Mode,
    timeboxMin: TimeBox,
    candidates: Candidate[],
    lang?: Language
  ): Promise<Card[]>;
}

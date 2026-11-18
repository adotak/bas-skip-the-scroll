import type { Card, Mode, TimeBox } from '@skip-the-scroll/shared';
import type { Candidate } from '../types';

export interface LLMClient {
  normalise(intent: string, mode: Mode): Promise<string[]>;
  rankAndSummarise(
    intent: string,
    mode: Mode,
    timeboxMin: TimeBox,
    candidates: Candidate[]
  ): Promise<Card[]>;
}

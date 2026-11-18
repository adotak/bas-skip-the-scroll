import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import type { Card, Mode, TimeBox } from '@skip-the-scroll/shared';
import type { Candidate } from '../types';
import type { LLMClient } from './client';

export class GeminiLLMClient implements LLMClient {
  private client: GoogleGenAI | null = null;
  private normalisePromptTemplate: string;
  private rankSummarisePromptTemplate: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    }

    const promptsDir = path.join(__dirname, 'prompts');
    this.normalisePromptTemplate = fs.readFileSync(
      path.join(promptsDir, 'normalise.txt'),
      'utf-8'
    );
    this.rankSummarisePromptTemplate = fs.readFileSync(
      path.join(promptsDir, 'rankSummarise.txt'),
      'utf-8'
    );
  }

  async normalise(intent: string, mode: Mode): Promise<string[]> {
    if (!this.client) {
      return this.fallbackNormalise(intent);
    }

    const prompt = this.normalisePromptTemplate
      .replace('{{intent}}', intent)
      .replace('{{mode}}', mode);

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      const parsed = JSON.parse(text) as { queries?: string[] };
      if (Array.isArray(parsed.queries) && parsed.queries.length > 0) {
        return parsed.queries.slice(0, 2);
      }
    } catch (err) {
      console.warn('[GeminiLLMClient] Normalise failed, using fallback:', (err as Error).message);
    }

    return this.fallbackNormalise(intent);
  }

  async rankAndSummarise(
    intent: string,
    mode: Mode,
    timeboxMin: TimeBox,
    candidates: Candidate[]
  ): Promise<Card[]> {
    if (candidates.length === 0) {
      return [];
    }

    if (!this.client) {
      return this.fallbackRankAndSummarise(intent, candidates, timeboxMin);
    }

    const prompt = this.rankSummarisePromptTemplate
      .replace('{{intent}}', intent)
      .replace('{{mode}}', mode)
      .replace('{{timeboxMin}}', String(timeboxMin))
      .replace('{{candidatesJson}}', JSON.stringify(candidates, null, 2));

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      const parsed = JSON.parse(text) as { cards?: Card[] };
      if (Array.isArray(parsed.cards) && parsed.cards.length > 0) {
        return parsed.cards;
      }
    } catch (err) {
      console.warn('[GeminiLLMClient] Rank & summarise failed, using fallback:', (err as Error).message);
    }

    return this.fallbackRankAndSummarise(intent, candidates, timeboxMin);
  }

  private fallbackNormalise(intent: string): string[] {
    const cleaned = intent
      .replace(/^(how to|how do i|please help me|i want to|can you|explain)\s+/i, '')
      .replace(/[?!.]+$/, '')
      .trim();

    return [cleaned || intent];
  }

  private fallbackRankAndSummarise(
    intent: string,
    candidates: Candidate[],
    timeboxMin: TimeBox
  ): Card[] {
    // Deterministic fallback curation: take up to 7 candidates
    const selected = candidates.slice(0, 7);

    return selected.map((c, index): Card => {
      const snippet = c.snippet || c.title;
      const sentences = snippet.split(/[.?!]\s+/).filter(Boolean);

      const b1 = sentences[0] || `Key concepts and overview of ${c.title}.`;
      const b2 = sentences[1] || `Practical application and techniques matching ${intent}.`;
      const b3 = sentences[2] || `Direct source reference provided by ${c.source}.`;

      return {
        id: c.id,
        kind: c.kind,
        title: c.title,
        source: c.source,
        url: c.url,
        embedId: c.embedId,
        minutes: Math.min(c.minutes || (c.kind === 'video' ? 10 : 5), timeboxMin),
        tldr: [b1, b2, b3],
        why: `Direct match for "${intent}" from ${c.source}.`,
      };
    });
  }
}

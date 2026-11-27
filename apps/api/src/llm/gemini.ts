import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import type { Card, Language, Mode, TimeBox } from '@skip-the-scroll/shared';
import type { Candidate } from '../types';
import type { LLMClient } from './client';
import { buildFallbackCards } from '../providers/curatedKnowledge';

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

  async normalise(intent: string, mode: Mode, lang: Language = 'en'): Promise<string[]> {
    if (!this.client) {
      return this.fallbackNormalise(intent);
    }

    const prompt = this.normalisePromptTemplate
      .replace('{{intent}}', intent)
      .replace('{{mode}}', mode)
      .replace(/\{\{lang\}\}/g, lang);

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
    candidates: Candidate[],
    lang: Language = 'en'
  ): Promise<Card[]> {
    if (candidates.length === 0) {
      return [];
    }

    if (!this.client) {
      return buildFallbackCards(intent, mode, timeboxMin, candidates, lang);
    }

    const prompt = this.rankSummarisePromptTemplate
      .replace('{{intent}}', intent)
      .replace('{{mode}}', mode)
      .replace('{{timeboxMin}}', String(timeboxMin))
      .replace(/\{\{lang\}\}/g, lang)
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

    return buildFallbackCards(intent, mode, timeboxMin, candidates, lang);
  }

  private fallbackNormalise(intent: string): string[] {
    const cleaned = intent
      .replace(/^(how to|how do i|please help me|i want to|can you|explain)\s+/i, '')
      .replace(/\b(kaise|kya|kyun|kahan|karna|karte|hain|hai|aur|mein|se|ko|ka|ki|ke|seekhein|samjhao|masla|theek|karein|batao)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[?!.]+$/, '')
      .trim();

    const primary = cleaned || intent.trim();
    return [primary];
  }
}

import { applyGuardrails, validateCardSchema } from '../guardrails';
import type { Card } from '@skip-the-scroll/shared';

describe('validateCardSchema', () => {
  const validCard: Card = {
    id: 'test-1',
    kind: 'article',
    title: 'How Hooks Work',
    source: 'react.dev',
    url: 'https://react.dev/hooks',
    minutes: 7,
    tldr: ['First bullet', 'Second bullet', 'Third bullet'],
    why: 'Direct canonical docs',
  };

  test('accepts valid card', () => {
    expect(validateCardSchema(validCard)).toBe(true);
  });

  test('rejects card with fewer than 3 bullets', () => {
    const invalid = { ...validCard, tldr: ['One', 'Two'] };
    expect(validateCardSchema(invalid)).toBe(false);
  });

  test('rejects card with missing title or url', () => {
    expect(validateCardSchema({ ...validCard, title: '' })).toBe(false);
    expect(validateCardSchema({ ...validCard, url: '' })).toBe(false);
  });

  test('rejects card with non-positive minutes', () => {
    expect(validateCardSchema({ ...validCard, minutes: 0 })).toBe(false);
    expect(validateCardSchema({ ...validCard, minutes: -5 })).toBe(false);
  });
});

describe('applyGuardrails', () => {
  const sampleCards: Card[] = Array.from({ length: 12 }, (_, i) => ({
    id: `card-${i}`,
    kind: i === 0 ? 'article' : 'video',
    title: `Card Title ${i}`,
    source: `Source ${i}`,
    url: `https://example.com/card-${i}`,
    minutes: 3,
    tldr: ['Point 1', 'Point 2', 'Point 3'],
    why: `Reason ${i}`,
  }));

  test('caps cards at default 7 and hard max 10', () => {
    const result = applyGuardrails(sampleCards, { timeboxMin: 20 });
    expect(result.length).toBeLessThanOrEqual(7);
  });

  test('enforces diversity (at least one non-video card)', () => {
    const result = applyGuardrails(sampleCards, { timeboxMin: 20 });
    const nonVideo = result.find((c) => c.kind !== 'video');
    expect(nonVideo).toBeDefined();
  });

  test('drops malformed cards from output', () => {
    const mixed = [
      ...sampleCards.slice(0, 3),
      { id: 'bad', title: '', tldr: [] }, // invalid
    ];
    const result = applyGuardrails(mixed, { timeboxMin: 20 });
    expect(result.every(validateCardSchema)).toBe(true);
  });
});

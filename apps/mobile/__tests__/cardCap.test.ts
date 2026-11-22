import { MAX_CARDS, DEFAULT_CARDS } from '@skip-the-scroll/shared';
import { FIXTURE_SESSIONS, findFixtureSession } from '../fixtures/sessions';
import { getYouTubeEmbedUrl } from '../components/youtube';

describe('card cap enforcement', () => {
  test('MAX_CARDS is 10', () => {
    expect(MAX_CARDS).toBe(10);
  });

  test('DEFAULT_CARDS is 7', () => {
    expect(DEFAULT_CARDS).toBe(7);
  });

  test('every fixture session has at most MAX_CARDS cards', () => {
    for (const session of FIXTURE_SESSIONS) {
      expect(session.cards.length).toBeLessThanOrEqual(MAX_CARDS);
    }
  });

  test('every fixture session has at least 1 card', () => {
    for (const session of FIXTURE_SESSIONS) {
      expect(session.cards.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('no fixture session exceeds DEFAULT_CARDS (7) cards', () => {
    for (const session of FIXTURE_SESSIONS) {
      expect(session.cards.length).toBeLessThanOrEqual(DEFAULT_CARDS);
    }
  });
});

describe('fixture data validity', () => {
  test('every card has exactly 3 TL;DR bullets', () => {
    for (const session of FIXTURE_SESSIONS) {
      for (const card of session.cards) {
        expect(card.tldr).toHaveLength(3);
        card.tldr.forEach((bullet) => {
          expect(typeof bullet).toBe('string');
          expect(bullet.length).toBeGreaterThan(0);
        });
      }
    }
  });

  test('every card has a valid kind', () => {
    const validKinds = ['video', 'article', 'doc'];
    for (const session of FIXTURE_SESSIONS) {
      for (const card of session.cards) {
        expect(validKinds).toContain(card.kind);
      }
    }
  });

  test('every card has a positive minute estimate', () => {
    for (const session of FIXTURE_SESSIONS) {
      for (const card of session.cards) {
        expect(card.minutes).toBeGreaterThan(0);
      }
    }
  });

  test('video cards have an embedId', () => {
    for (const session of FIXTURE_SESSIONS) {
      for (const card of session.cards) {
        if (card.kind === 'video') {
          expect(card.embedId).toBeDefined();
          expect(card.embedId!.length).toBeGreaterThan(0);
          expect(getYouTubeEmbedUrl(card)).toContain('youtube-nocookie.com/embed/');
        }
      }
    }
  });

  test('every card has a unique id within its session', () => {
    for (const session of FIXTURE_SESSIONS) {
      const ids = session.cards.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  test('every session has a valid mode', () => {
    const validModes = ['learn', 'fix', 'watch', 'read'];
    for (const session of FIXTURE_SESSIONS) {
      expect(validModes).toContain(session.mode);
    }
  });

  test('every session has a valid timeboxMin', () => {
    const validTimeBoxes = [5, 10, 20];
    for (const session of FIXTURE_SESSIONS) {
      expect(validTimeBoxes).toContain(session.timeboxMin);
    }
  });
});

describe('findFixtureSession', () => {
  test('finds "React hooks" session for a matching intent', () => {
    const session = findFixtureSession('learn React hooks');
    expect(session.intent).toContain('React hooks');
  });

  test('finds "CORS" session for a matching intent', () => {
    const session = findFixtureSession('cors');
    expect(session.intent.toLowerCase()).toContain('cors');
  });

  test('returns a fallback session for an unknown intent', () => {
    const session = findFixtureSession('quantum tunnelling in superconductors');
    expect(session).toBeDefined();
    expect(session.cards.length).toBeGreaterThan(0);
  });
});

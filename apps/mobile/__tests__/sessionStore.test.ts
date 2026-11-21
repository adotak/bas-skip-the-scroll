import { storeSession, getStoredSession } from '../store/sessionStore';
import type { Session } from '@skip-the-scroll/shared';

const MOCK_SESSION: Session = {
  id: 'test-session-1',
  intent: 'test hooks',
  mode: 'learn',
  timeboxMin: 10,
  cards: [
    {
      id: 'tc-1',
      kind: 'article',
      title: 'Test Article',
      source: 'test.com',
      url: 'https://test.com/article',
      minutes: 5,
      tldr: ['Bullet one.', 'Bullet two.', 'Bullet three.'],
      why: 'For testing.',
    },
  ],
  createdAt: '2026-01-01T00:00:00Z',
};

describe('sessionStore', () => {
  test('storeSession + getStoredSession round-trips', () => {
    storeSession(MOCK_SESSION);
    const retrieved = getStoredSession(MOCK_SESSION.id);
    expect(retrieved).toEqual(MOCK_SESSION);
  });

  test('getStoredSession returns undefined for unknown id', () => {
    expect(getStoredSession('nonexistent-id')).toBeUndefined();
  });

  test('storing a second session does not overwrite the first', () => {
    const second: Session = {
      ...MOCK_SESSION,
      id: 'test-session-2',
      intent: 'second session',
    };
    storeSession(MOCK_SESSION);
    storeSession(second);
    expect(getStoredSession(MOCK_SESSION.id)).toEqual(MOCK_SESSION);
    expect(getStoredSession(second.id)).toEqual(second);
  });

  test('preserves an empty session defensively for an empty-state screen', () => {
    const emptySession: Session = {
      ...MOCK_SESSION,
      id: 'test-empty-session',
      cards: [],
    };

    storeSession(emptySession);

    expect(getStoredSession(emptySession.id)?.cards).toEqual([]);
  });
});

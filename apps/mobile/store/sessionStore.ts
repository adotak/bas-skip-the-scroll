import type { Session } from '@skip-the-scroll/shared';

/**
 * In-memory session store for M1 (fixture-based).
 * Replaced by API calls in M2.
 */
const sessions = new Map<string, Session>();

export function storeSession(session: Session): void {
  sessions.set(session.id, session);
}

export function getStoredSession(id: string): Session | undefined {
  return sessions.get(id);
}

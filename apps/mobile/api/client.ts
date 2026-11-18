import type { Session, Mode, TimeBox } from '@skip-the-scroll/shared';
import { findFixtureSession } from '@/fixtures/sessions';

declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
  };
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'; // 10.0.2.2 is Android emulator host loopback

export async function fetchSessionFromApi(
  intent: string,
  mode: Mode,
  timeboxMin: TimeBox
): Promise<Session> {
  const trimmed = intent.trim();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000); // 7s timeout

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: trimmed,
          mode,
          timeboxMin,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.ok) {
      const data = await response.json() as Session;
      if (data && Array.isArray(data.cards) && data.cards.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[API Client] Network fetch failed, falling back to local curation:', (err as Error).message);
  }

  // Graceful offline fallback: return matching local fixture session
  const fallback = findFixtureSession(trimmed);
  return {
    id: `fallback-${Date.now()}`,
    intent: trimmed,
    mode,
    timeboxMin,
    cards: fallback.cards,
    createdAt: new Date().toISOString(),
  };
}

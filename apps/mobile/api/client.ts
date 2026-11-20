import type { Session, Mode, TimeBox } from '@skip-the-scroll/shared';

declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
  };
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'; // 10.0.2.2 is Android emulator host loopback

export type SessionFetchErrorKind = 'offline' | 'server' | 'empty';

export class SessionFetchError extends Error {
  constructor(
    public readonly kind: SessionFetchErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'SessionFetchError';
  }
}

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

    if (!response.ok) {
      throw new SessionFetchError(
        'server',
        `The content service returned ${response.status}.`,
      );
    }

    const data = await response.json() as Session;
    if (!data || !Array.isArray(data.cards) || data.cards.length === 0) {
      throw new SessionFetchError(
        'empty',
        'No suitable content was found for that intent.',
      );
    }

    return data;
  } catch (err) {
    if (err instanceof SessionFetchError) {
      throw err;
    }

    const message = err instanceof Error ? err.message : 'Network request failed.';
    console.warn('[API Client] Network fetch failed:', message);
    throw new SessionFetchError(
      'offline',
      'The content service could not be reached. Check your connection and try again.',
    );
  }
}

export interface QuotaLimit {
  maxDaily: number;
  usedToday: number;
  lastResetDate: string; // YYYY-MM-DD
}

const DAILY_LIMITS: Record<string, number> = {
  youtube: 95, // conservative cutoff below 100 search calls
  custom_search: 95, // conservative cutoff below 100 free queries
};

const quotaStore: Record<string, QuotaLimit> = {
  youtube: { maxDaily: DAILY_LIMITS.youtube, usedToday: 0, lastResetDate: getTodayString() },
  custom_search: { maxDaily: DAILY_LIMITS.custom_search, usedToday: 0, lastResetDate: getTodayString() },
};

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function checkAndReset(provider: string): void {
  const today = getTodayString();
  const entry = quotaStore[provider];
  if (entry && entry.lastResetDate !== today) {
    entry.usedToday = 0;
    entry.lastResetDate = today;
  }
}

export function canCallProvider(provider: 'youtube' | 'custom_search'): boolean {
  checkAndReset(provider);
  const entry = quotaStore[provider];
  if (!entry) return true;
  return entry.usedToday < entry.maxDaily;
}

export function recordProviderCall(provider: 'youtube' | 'custom_search'): void {
  checkAndReset(provider);
  const entry = quotaStore[provider];
  if (!entry) return;

  entry.usedToday += 1;
  const percentage = (entry.usedToday / entry.maxDaily) * 100;

  if (percentage >= 80 && percentage < 100) {
    console.warn(`[Quota Guard] WARNING: ${provider} quota at ${percentage.toFixed(0)}% (${entry.usedToday}/${entry.maxDaily})`);
  } else if (entry.usedToday >= entry.maxDaily) {
    console.error(`[Quota Guard] EXHAUSTED: ${provider} quota reached max limit (${entry.usedToday}/${entry.maxDaily}). Falling back.`);
  }
}

export function getQuotaStatus(): Record<string, QuotaLimit> {
  checkAndReset('youtube');
  checkAndReset('custom_search');
  return { ...quotaStore };
}

export function resetQuotaForTesting(): void {
  quotaStore.youtube.usedToday = 0;
  quotaStore.custom_search.usedToday = 0;
}

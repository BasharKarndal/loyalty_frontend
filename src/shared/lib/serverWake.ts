import { API_BASE_URL } from '@/config/env';

/** Derive a cheap public URL that wakes the Railway process without auth. */
export function getBackendWakeUrl(): string {
  const base = API_BASE_URL.replace(/\/$/, '');

  if (/^https?:\/\//i.test(base)) {
    // https://app.up.railway.app/api/v1 → https://app.up.railway.app/
    return `${base.replace(/\/api\/v\d+$/i, '')}/`;
  }

  // Dev (Vite proxies /api only): any /api hit reaches the local backend.
  return `${base}/`;
}

/**
 * Ping the backend so a sleeping Railway instance starts before real API calls.
 * Resolves true if the process answered (any HTTP status counts as awake).
 */
export async function wakeBackend(timeoutMs = 45_000): Promise<boolean> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(getBackendWakeUrl(), {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
    });
    // 2xx/3xx/4xx/5xx all mean the process is up (e.g. /health may be 503).
    return response.status > 0;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

/** True when the failure looks like offline / timeout / cold start (no HTTP response). */
export function isNetworkOrColdStartError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as {
    isAxiosError?: boolean;
    response?: unknown;
    code?: string;
    message?: string;
  };
  if (maybe.isAxiosError && !maybe.response) return true;
  if (maybe.code === 'ERR_NETWORK' || maybe.code === 'ECONNABORTED') return true;
  if (typeof maybe.message === 'string') {
    const msg = maybe.message.toLowerCase();
    if (msg.includes('network error') || msg.includes('timeout')) return true;
  }
  return false;
}

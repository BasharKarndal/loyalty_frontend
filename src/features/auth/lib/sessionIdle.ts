import { indexedDb, QUERY_PERSIST_KEY, STORAGE_KEYS } from '@shared/lib/indexedDb';
import { authStorage } from '@features/auth/lib/authStorage';

/** After this much inactivity, the next visit clears the session (avoids stuck loading). */
export const IDLE_LOGOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

export function touchSessionActivity(at = Date.now()): void {
  indexedDb.setSync(STORAGE_KEYS.lastActivity, String(at));
}

export function getLastSessionActivity(): number {
  const raw = indexedDb.getSync(STORAGE_KEYS.lastActivity);
  const value = raw ? Number(raw) : NaN;
  return Number.isFinite(value) ? value : Date.now();
}

export function isSessionIdle(now = Date.now()): boolean {
  if (!authStorage.isAuthenticated()) return false;
  return now - getLastSessionActivity() >= IDLE_LOGOUT_MS;
}

/** Sync clear of token + query disk cache. Caller should also clear React Query memory. */
export function clearIdleSessionLocally(): void {
  authStorage.clearToken();
  indexedDb.delSync(STORAGE_KEYS.lastActivity);
  indexedDb.delSync(QUERY_PERSIST_KEY);
}

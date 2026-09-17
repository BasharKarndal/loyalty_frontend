import { indexedDb, QUERY_PERSIST_KEY, STORAGE_KEYS } from '@shared/lib/indexedDb';
import { authStorage } from '@features/auth/lib/authStorage';
import { isRememberAccountEnabled } from '@features/auth/lib/rememberAccount';

/** Default idle window when "remember account" is off. */
export const IDLE_LOGOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

/** Longer idle window when the user opted into "remember account". */
export const REMEMBER_IDLE_LOGOUT_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function getIdleLogoutMs(): number {
  return isRememberAccountEnabled() ? REMEMBER_IDLE_LOGOUT_MS : IDLE_LOGOUT_MS;
}

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
  return now - getLastSessionActivity() >= getIdleLogoutMs();
}

/** Sync clear of token + query disk cache. Keeps remembered username. */
export function clearIdleSessionLocally(): void {
  authStorage.clearToken();
  indexedDb.delSync(STORAGE_KEYS.lastActivity);
  indexedDb.delSync(QUERY_PERSIST_KEY);
}

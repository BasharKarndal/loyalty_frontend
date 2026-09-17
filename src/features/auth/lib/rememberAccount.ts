import { indexedDb, STORAGE_KEYS } from '@shared/lib/indexedDb';

/** Light obfuscation so the password is not stored as plain text in IndexedDB. */
function encodeSecret(value: string): string {
  try {
    return btoa(unescape(encodeURIComponent(value)));
  } catch {
    return value;
  }
}

function decodeSecret(value: string): string {
  try {
    return decodeURIComponent(escape(atob(value)));
  } catch {
    return value;
  }
}

export function isRememberAccountEnabled(): boolean {
  return indexedDb.getSync(STORAGE_KEYS.rememberAccount) === '1';
}

export function getRememberedUsername(): string {
  if (!isRememberAccountEnabled()) return '';
  return indexedDb.getSync(STORAGE_KEYS.rememberedUsername)?.trim() || '';
}

export function getRememberedPassword(): string {
  if (!isRememberAccountEnabled()) return '';
  const raw = indexedDb.getSync(STORAGE_KEYS.rememberedPassword);
  if (!raw) return '';
  return decodeSecret(raw);
}

/** Persist username + password when remember is enabled. */
export function setRememberAccount(
  enabled: boolean,
  username = '',
  password = ''
): void {
  if (!enabled) {
    indexedDb.delSync(STORAGE_KEYS.rememberAccount);
    indexedDb.delSync(STORAGE_KEYS.rememberedUsername);
    indexedDb.delSync(STORAGE_KEYS.rememberedPassword);
    return;
  }
  indexedDb.setSync(STORAGE_KEYS.rememberAccount, '1');
  const trimmedUser = username.trim();
  if (trimmedUser) {
    indexedDb.setSync(STORAGE_KEYS.rememberedUsername, trimmedUser);
  }
  if (password) {
    indexedDb.setSync(STORAGE_KEYS.rememberedPassword, encodeSecret(password));
  }
}

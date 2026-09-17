import { indexedDb, STORAGE_KEYS } from '@shared/lib/indexedDb';

export function isRememberAccountEnabled(): boolean {
  return indexedDb.getSync(STORAGE_KEYS.rememberAccount) === '1';
}

export function getRememberedUsername(): string {
  if (!isRememberAccountEnabled()) return '';
  return indexedDb.getSync(STORAGE_KEYS.rememberedUsername)?.trim() || '';
}

/** Persist username only — never store the password. */
export function setRememberAccount(enabled: boolean, username = ''): void {
  if (!enabled) {
    indexedDb.delSync(STORAGE_KEYS.rememberAccount);
    indexedDb.delSync(STORAGE_KEYS.rememberedUsername);
    return;
  }
  indexedDb.setSync(STORAGE_KEYS.rememberAccount, '1');
  const trimmed = username.trim();
  if (trimmed) {
    indexedDb.setSync(STORAGE_KEYS.rememberedUsername, trimmed);
  }
}

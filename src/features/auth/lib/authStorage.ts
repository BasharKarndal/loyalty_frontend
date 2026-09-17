import { indexedDb, STORAGE_KEYS } from '@shared/lib/indexedDb';

export const authStorage = {
  getToken(): string | null {
    return indexedDb.getSync(STORAGE_KEYS.accessToken);
  },

  setToken(token: string): void {
    indexedDb.setSync(STORAGE_KEYS.accessToken, token);
  },

  clearToken(): void {
    indexedDb.delSync(STORAGE_KEYS.accessToken);
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },
};

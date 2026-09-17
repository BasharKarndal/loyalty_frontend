import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'loyalty-app';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';
const IDB_TIMEOUT_MS = 2500;

type LoyaltyDb = IDBPDatabase<{
  keyval: {
    key: string;
    value: string;
  };
}>;

let dbPromise: Promise<LoyaltyDb> | null = null;
let idbUnavailable = false;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function getDb(): Promise<LoyaltyDb> {
  if (idbUnavailable) {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  if (!dbPromise) {
    dbPromise = withTimeout(
      openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        },
      }),
      IDB_TIMEOUT_MS,
      'IndexedDB open'
    ).catch((error) => {
      idbUnavailable = true;
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

export const indexedDb = {
  async get(key: string): Promise<string | null> {
    try {
      const db = await getDb();
      const value = await withTimeout(db.get(STORE_NAME, key), IDB_TIMEOUT_MS, 'IndexedDB get');
      return value ?? null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      const db = await getDb();
      await withTimeout(db.put(STORE_NAME, value, key), IDB_TIMEOUT_MS, 'IndexedDB set');
    } catch {
      // ignore — cache is best-effort
    }
  },

  async del(key: string): Promise<void> {
    try {
      const db = await getDb();
      await withTimeout(db.delete(STORE_NAME, key), IDB_TIMEOUT_MS, 'IndexedDB del');
    } catch {
      // ignore
    }
  },

  async clear(): Promise<void> {
    try {
      const db = await getDb();
      await withTimeout(db.clear(STORE_NAME), IDB_TIMEOUT_MS, 'IndexedDB clear');
    } catch {
      // ignore
    }
  },
};

/**
 * Async storage for TanStack Query persist.
 * Prefers IndexedDB, falls back to localStorage if IDB is slow/blocked (common on mobile).
 */
export const queryPersistStorage = {
  async getItem(key: string): Promise<string | null> {
    const fromIdb = await indexedDb.get(key);
    if (fromIdb != null) return fromIdb;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    await indexedDb.set(key, value);
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // quota / private mode
    }
  },

  async removeItem(key: string): Promise<void> {
    await indexedDb.del(key);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export const QUERY_PERSIST_KEY = 'loyalty-react-query';

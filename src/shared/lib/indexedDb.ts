import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'loyalty-app';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

type LoyaltyDb = IDBPDatabase<{
  keyval: {
    key: string;
    value: string;
  };
}>;

let dbPromise: Promise<LoyaltyDb> | null = null;

function getDb(): Promise<LoyaltyDb> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export const indexedDb = {
  async get(key: string): Promise<string | null> {
    const db = await getDb();
    const value = await db.get(STORE_NAME, key);
    return value ?? null;
  },

  async set(key: string, value: string): Promise<void> {
    const db = await getDb();
    await db.put(STORE_NAME, value, key);
  },

  async del(key: string): Promise<void> {
    const db = await getDb();
    await db.delete(STORE_NAME, key);
  },

  async clear(): Promise<void> {
    const db = await getDb();
    await db.clear(STORE_NAME);
  },
};

/** AsyncStorage-compatible adapter for TanStack Query persister. */
export const indexedDbAsyncStorage = {
  getItem: (key: string) => indexedDb.get(key),
  setItem: (key: string, value: string) => indexedDb.set(key, value),
  removeItem: (key: string) => indexedDb.del(key),
};

export const QUERY_PERSIST_KEY = 'loyalty-react-query';

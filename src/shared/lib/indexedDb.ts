import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'loyalty-app';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';
const IDB_TIMEOUT_MS = 2500;

export const STORAGE_KEYS = {
  accessToken: 'access_token',
  theme: 'gm-theme',
  workspace: 'gm-workspace-owner-id',
  queryCache: 'loyalty-react-query',
  lastActivity: 'last_activity_at',
  rememberAccount: 'remember_account',
  rememberedUsername: 'remembered_username',
} as const;


/** Legacy localStorage keys — migrated once into IndexedDB then removed. */
const LEGACY_LOCAL_KEYS = [
  STORAGE_KEYS.accessToken,
  STORAGE_KEYS.theme,
  STORAGE_KEYS.workspace,
  STORAGE_KEYS.queryCache,
] as const;

type LoyaltyDb = IDBPDatabase<{
  keyval: {
    key: string;
    value: string;
  };
}>;

let dbPromise: Promise<LoyaltyDb> | null = null;
let idbUnavailable = false;

/** In-memory mirror for sync reads (axios / first paint). */
const memory = new Map<string, string>();

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

async function idbGet(key: string): Promise<string | null> {
  const cached = memory.get(key);
  if (cached !== undefined) return cached;
  try {
    const db = await getDb();
    const value = await withTimeout(db.get(STORE_NAME, key), IDB_TIMEOUT_MS, 'IndexedDB get');
    if (value != null) memory.set(key, value);
    return value ?? null;
  } catch {
    return null;
  }
}

async function idbSet(key: string, value: string): Promise<void> {
  memory.set(key, value);
  try {
    const db = await getDb();
    await withTimeout(db.put(STORE_NAME, value, key), IDB_TIMEOUT_MS, 'IndexedDB set');
  } catch {
    // memory still holds the value for this session
  }
}

async function idbDel(key: string): Promise<void> {
  memory.delete(key);
  try {
    const db = await getDb();
    await withTimeout(db.delete(STORE_NAME, key), IDB_TIMEOUT_MS, 'IndexedDB del');
  } catch {
    // ignore
  }
}

async function idbClear(): Promise<void> {
  memory.clear();
  try {
    const db = await getDb();
    await withTimeout(db.clear(STORE_NAME), IDB_TIMEOUT_MS, 'IndexedDB clear');
  } catch {
    // ignore
  }
}

export const indexedDb = {
  getSync(key: string): string | null {
    return memory.get(key) ?? null;
  },

  get: idbGet,

  set: idbSet,

  setSync(key: string, value: string): void {
    memory.set(key, value);
    void idbSet(key, value);
  },

  del: idbDel,

  delSync(key: string): void {
    memory.delete(key);
    void idbDel(key);
  },

  clear: idbClear,
};

/** TanStack Query persist — IndexedDB only. */
export const queryPersistStorage = {
  getItem: (key: string) => idbGet(key),
  setItem: (key: string, value: string) => idbSet(key, value),
  removeItem: (key: string) => idbDel(key),
};

export const QUERY_PERSIST_KEY = STORAGE_KEYS.queryCache;

function readLegacyLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function removeLegacyLocal(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Load IndexedDB into memory before React mounts.
 * One-time: migrates leftover localStorage values into IndexedDB, then deletes them.
 */
export async function hydrateClientStorage(): Promise<void> {
  const keys = Object.values(STORAGE_KEYS);

  for (const key of keys) {
    const fromIdb = await idbGet(key);
    if (fromIdb != null) continue;

    const legacy = readLegacyLocal(key);
    if (legacy != null) {
      await idbSet(key, legacy);
    }
  }

  for (const key of LEGACY_LOCAL_KEYS) {
    removeLegacyLocal(key);
  }
}

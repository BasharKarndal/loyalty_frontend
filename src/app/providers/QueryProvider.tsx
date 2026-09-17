import { QueryClient } from '@tanstack/react-query';
import {
  PersistQueryClientProvider,
  type Persister,
  type PersistedClient,
} from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { ReactNode, useState } from 'react';
import { Toaster } from 'sonner';
import { queryPersistStorage, QUERY_PERSIST_KEY } from '@shared/lib/indexedDb';

const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours
/** Bump when persisted shape/behavior changes — clears stuck error caches once. */
const PERSIST_BUSTER = 'v3-keep-data-on-error';
const RESTORE_TIMEOUT_MS = 3000;

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: PERSIST_MAX_AGE,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

const asyncPersister = createAsyncStoragePersister({
  storage: queryPersistStorage,
  key: QUERY_PERSIST_KEY,
  throttleTime: 1000,
});

/**
 * After a failed background refetch, React Query marks the query as `error`
 * even when previous `data` is still usable. Default dehydrate only keeps
 * `success`, so the next persist *deletes* auth/me from IndexedDB. After a
 * tab kill the token remains but user cache is gone → hard connection screen
 * until the user clears site data. Normalize to success-with-data before save.
 */
function normalizeClientForPersist(client: PersistedClient): PersistedClient {
  return {
    ...client,
    clientState: {
      ...client.clientState,
      queries: client.clientState.queries
        .filter((query) => query.state.data !== undefined)
        .map((query) => ({
          ...query,
          state: {
            ...query.state,
            status: 'success' as const,
            error: null,
            fetchFailureCount: 0,
            fetchFailureReason: null,
            fetchStatus: 'idle' as const,
          },
        })),
    },
  };
}

/** Never hang the app if storage restore stalls on mobile browsers. */
const persister: Persister = {
  persistClient: (client) => asyncPersister.persistClient(normalizeClientForPersist(client)),
  removeClient: () => asyncPersister.removeClient(),
  restoreClient: async () => {
    try {
      const restored = await Promise.race([
        asyncPersister.restoreClient(),
        new Promise<PersistedClient | undefined>((resolve) => {
          window.setTimeout(() => resolve(undefined), RESTORE_TIMEOUT_MS);
        }),
      ]);
      return restored ? normalizeClientForPersist(restored) : undefined;
    } catch {
      return undefined;
    }
  },
};

function shouldDehydrateQuery(query: {
  queryKey: readonly unknown[];
  state: { data?: unknown; status: string };
}) {
  // Keep any query that still has usable data — including post-refetch errors.
  if (query.state.data === undefined) return false;
  const key = query.queryKey;
  if (Array.isArray(key) && key.includes('logo')) return false;
  return true;
}

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
  const [queryClient] = useState(createQueryClient);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE,
        buster: PERSIST_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery,
        },
      }}
    >
      {children}
      <Toaster position="top-center" richColors closeButton dir="rtl" />
    </PersistQueryClientProvider>
  );
};

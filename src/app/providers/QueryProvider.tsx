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
const PERSIST_BUSTER = 'v2-mobile';
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

/** Never hang the app if storage restore stalls on mobile browsers. */
const persister: Persister = {
  persistClient: (client) => asyncPersister.persistClient(client),
  removeClient: () => asyncPersister.removeClient(),
  restoreClient: async () => {
    try {
      return await Promise.race([
        asyncPersister.restoreClient(),
        new Promise<PersistedClient | undefined>((resolve) => {
          window.setTimeout(() => resolve(undefined), RESTORE_TIMEOUT_MS);
        }),
      ]);
    } catch {
      return undefined;
    }
  },
};

function shouldDehydrateQuery(query: {
  queryKey: readonly unknown[];
  state: { status: string };
}) {
  if (query.state.status !== 'success') return false;
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

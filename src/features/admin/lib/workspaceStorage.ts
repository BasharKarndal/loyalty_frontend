import { indexedDb, STORAGE_KEYS } from '@shared/lib/indexedDb';

const WORKSPACE_EVENT = 'gm-workspace-changed';

export const workspaceStorage = {
  get(): string | null {
    return indexedDb.getSync(STORAGE_KEYS.workspace);
  },

  set(id: string | null): void {
    if (id) indexedDb.setSync(STORAGE_KEYS.workspace, id);
    else indexedDb.delSync(STORAGE_KEYS.workspace);
    window.dispatchEvent(new Event(WORKSPACE_EVENT));
  },

  subscribe(onChange: () => void): () => void {
    window.addEventListener(WORKSPACE_EVENT, onChange);
    return () => window.removeEventListener(WORKSPACE_EVENT, onChange);
  },
};

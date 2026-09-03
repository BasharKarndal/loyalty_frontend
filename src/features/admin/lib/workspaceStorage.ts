const WORKSPACE_KEY = 'gm-workspace-owner-id';
const WORKSPACE_EVENT = 'gm-workspace-changed';

export const workspaceStorage = {
  get(): string | null {
    return localStorage.getItem(WORKSPACE_KEY);
  },

  set(id: string | null): void {
    if (id) localStorage.setItem(WORKSPACE_KEY, id);
    else localStorage.removeItem(WORKSPACE_KEY);
    window.dispatchEvent(new Event(WORKSPACE_EVENT));
  },

  subscribe(onChange: () => void): () => void {
    window.addEventListener(WORKSPACE_EVENT, onChange);
    return () => window.removeEventListener(WORKSPACE_EVENT, onChange);
  },
};

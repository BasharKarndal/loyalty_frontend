import { useEffect } from 'react';
import { wakeBackend } from '@shared/lib/serverWake';
import { authStorage } from '@features/auth/lib/authStorage';

/** Ping the API while the tab is visible to reduce Railway idle sleep. */
const KEEP_ALIVE_MS = 4 * 60 * 1000;

export function useServerKeepAlive(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      if (!authStorage.isAuthenticated()) return;
      void wakeBackend(8_000);
    };

    const timer = window.setInterval(tick, KEEP_ALIVE_MS);
    return () => window.clearInterval(timer);
  }, [enabled]);
}

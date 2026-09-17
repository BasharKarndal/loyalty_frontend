import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authStorage } from '@features/auth/lib/authStorage';
import {
  clearIdleSessionLocally,
  isSessionIdle,
  touchSessionActivity,
} from '@features/auth/lib/sessionIdle';

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;

/**
 * Logs the user out after long inactivity so the app never sits on a stuck
 * loading screen after Railway sleep / tab freeze.
 */
export function useIdleSessionLogout(enabled: boolean) {
  const queryClient = useQueryClient();
  const loggingOutRef = useRef(false);

  useEffect(() => {
    if (!enabled || !authStorage.isAuthenticated()) return;

    const logoutForIdle = () => {
      if (loggingOutRef.current) return;
      if (!authStorage.isAuthenticated()) return;
      if (!isSessionIdle()) return;

      loggingOutRef.current = true;
      clearIdleSessionLocally();
      queryClient.clear();
      toast.message('تم تسجيل الخروج بسبب عدم النشاط لفترة طويلة');
      window.location.replace('/login?reason=idle');
    };

    // Overnight / long background: expire immediately on mount.
    logoutForIdle();
    if (!authStorage.isAuthenticated()) return;

    touchSessionActivity();

    let activityTick: number | null = null;
    const onActivity = () => {
      if (activityTick != null) return;
      activityTick = window.setTimeout(() => {
        activityTick = null;
        touchSessionActivity();
      }, 1000);
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }

    const onResume = () => {
      if (document.visibilityState === 'hidden') return;
      logoutForIdle();
      if (authStorage.isAuthenticated()) touchSessionActivity();
    };

    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('focus', onResume);

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') logoutForIdle();
    }, 60_000);

    return () => {
      if (activityTick != null) window.clearTimeout(activityTick);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('focus', onResume);
      window.clearInterval(interval);
    };
  }, [enabled, queryClient]);
}

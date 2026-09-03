export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'gm-theme';

/** ولاء brand palette — matches cafe_loyalty_manager AppColors */
export const palette = {
  navy: {
    light: '#e8edf5',
    mid: '#1e7585',
    primary: '#1a3b70',
    deep: '#0f1f3d',
  },
  gold: {
    light: '#e8c87a',
    mid: '#cfa34e',
    deep: '#a67c2e',
  },
  neutral: {
    white: '#ffffff',
    surface: '#f8f9fa',
    line: '#e5eaf0',
    ink: '#2b2d42',
  },
} as const;

export function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function initTheme() {
  applyTheme(getPreferredTheme());
}

export function persistTheme(theme: Theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

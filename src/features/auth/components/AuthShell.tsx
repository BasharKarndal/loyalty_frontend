import type { ReactNode } from 'react';
import { ThemeToggle } from '@shared/components';

interface AuthShellProps {
  children: ReactNode;
}

export const AuthShell = ({ children }: AuthShellProps) => (
  <div
    className="login-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
    dir="rtl"
  >
    <div className="login-ambient" aria-hidden>
      <div className="login-ambient__mesh" />
      <div className="login-ambient__grid" />
      <div className="login-ambient__orb login-ambient__orb--a" />
      <div className="login-ambient__orb login-ambient__orb--b" />
      <div className="login-ambient__orb login-ambient__orb--c" />
      <div className="login-ambient__shine" />
    </div>

    <div className="absolute left-4 top-4 z-10 sm:left-6 sm:top-6">
      <ThemeToggle
        className="border-wheat/25 bg-black/20 text-wheat-light hover:bg-wheat/10"
        showLabel={false}
      />
    </div>

    <div className="relative z-10 w-full max-w-md">{children}</div>
  </div>
);

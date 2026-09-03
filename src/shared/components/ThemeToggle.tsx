import { Moon, Sun } from 'lucide-react';
import { Icon } from './Icon';
import { cn } from '@shared/lib/cn';
import { useTheme } from '@shared/providers/ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle = ({ className, showLabel = true }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
      title={isDark ? 'وضع نهاري' : 'وضع ليلي'}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
        isDark
          ? 'border-wheat/20 bg-charcoal-mid text-wheat-light hover:bg-umber-mid'
          : 'border-line bg-panel text-wheat-dark shadow-sm hover:bg-wheat-light/60',
        className
      )}
    >
      <Icon icon={isDark ? Sun : Moon} size="sm" />
      {showLabel && (
        <span className="hidden sm:inline">{isDark ? 'نهاري' : 'ليلي'}</span>
      )}
    </button>
  );
};

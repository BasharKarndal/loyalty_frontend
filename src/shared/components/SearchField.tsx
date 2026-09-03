import { Search, X } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { Icon } from './Icon';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchField({
  value,
  onChange,
  placeholder = 'بحث...',
  className,
  disabled = false,
}: SearchFieldProps) {
  return (
    <div className={cn('relative', className)}>
      <Icon
        icon={Search}
        size="sm"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border border-line bg-panel py-3 pr-10 pl-10 text-sm text-ink shadow-sm transition-colors placeholder:text-muted/70 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20 disabled:cursor-not-allowed disabled:opacity-60"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
          aria-label="مسح البحث"
        >
          <Icon icon={X} size="sm" />
        </button>
      )}
    </div>
  );
}

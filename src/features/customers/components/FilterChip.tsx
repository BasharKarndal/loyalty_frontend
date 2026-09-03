import { cn } from '@shared/lib/cn';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function FilterChip({ label, selected, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-2 text-sm font-bold transition-colors',
        selected
          ? 'bg-brand-500 text-white shadow-sm'
          : 'border border-line bg-panel text-muted hover:border-brand-400/40 hover:text-ink'
      )}
    >
      {label}
    </button>
  );
}

import { cn } from '@shared/lib/cn';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function PeriodChip({ label, selected, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-2 text-sm font-bold transition-colors',
        selected
          ? 'bg-wheat text-white shadow-sm'
          : 'border border-line bg-panel text-muted hover:border-wheat/40 hover:text-ink'
      )}
    >
      {label}
    </button>
  );
}

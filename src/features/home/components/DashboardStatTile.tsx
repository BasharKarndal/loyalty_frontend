import type { LucideIcon } from 'lucide-react';
import { Icon } from '@shared/components';
import { cn } from '@shared/lib/cn';

interface DashboardStatTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: 'wheat' | 'umber';
  onClick?: () => void;
}

const accentMap = {
  wheat: 'bg-wheat/12 text-wheat',
  umber: 'bg-umber/10 text-umber',
};

export function DashboardStatTile({
  label,
  value,
  icon,
  accent = 'wheat',
  onClick,
}: DashboardStatTileProps) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-line bg-panel p-4 text-right shadow-sm transition-colors',
        onClick && 'cursor-pointer hover:border-wheat/30 hover:bg-surface/80'
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl',
          accentMap[accent]
        )}
      >
        <Icon icon={icon} size="sm" />
      </span>
      <p className="mt-3 text-lg font-extrabold text-ink">{value}</p>
      <p className="mt-1 text-xs font-bold text-muted">{label}</p>
    </Tag>
  );
}

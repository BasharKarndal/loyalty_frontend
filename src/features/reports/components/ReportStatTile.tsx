import type { LucideIcon } from 'lucide-react';
import { Icon } from '@shared/components';

interface ReportStatTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: 'wheat' | 'umber';
}

const accentStyles = {
  wheat: { bg: 'rgba(207, 163, 78, 0.14)', color: '#a67c2e' },
  umber: { bg: 'rgba(30, 117, 133, 0.12)', color: '#1e7585' },
};

/** Stat tile with fixed colors — readable inside the white report card in any theme. */
export function ReportStatTile({ label, value, icon, accent = 'wheat' }: ReportStatTileProps) {
  const tone = accentStyles[accent];

  return (
    <div
      className="rounded-2xl border p-4 text-right shadow-sm"
      style={{ background: '#ffffff', borderColor: '#e5eaf0' }}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: tone.bg, color: tone.color }}
      >
        <Icon icon={icon} size="sm" />
      </span>
      <p className="mt-3 text-lg font-extrabold leading-snug" style={{ color: '#2b2d42' }}>
        {value}
      </p>
      <p className="mt-1 text-xs font-bold leading-snug" style={{ color: '#5a6278' }}>
        {label}
      </p>
    </div>
  );
}

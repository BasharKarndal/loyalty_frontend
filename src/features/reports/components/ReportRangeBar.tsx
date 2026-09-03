import { PeriodChip } from '@/features/purchases/components/PeriodChip';
import type { ReportRangeFilter } from '../types/report.types';

interface ReportRangeBarProps {
  range: ReportRangeFilter;
  onRangeChange: (range: ReportRangeFilter) => void;
  onCustomClick: () => void;
  customFrom?: string;
  customTo?: string;
}

const RANGE_OPTIONS: { key: ReportRangeFilter; label: string }[] = [
  { key: 'today', label: 'اليوم' },
  { key: 'week', label: 'هذا الأسبوع' },
  { key: 'month', label: 'هذا الشهر' },
];

export function ReportRangeBar({
  range,
  onRangeChange,
  onCustomClick,
  customFrom,
  customTo,
}: ReportRangeBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((option) => (
          <PeriodChip
            key={option.key}
            label={option.label}
            selected={range === option.key}
            onClick={() => onRangeChange(option.key)}
          />
        ))}
        <PeriodChip
          label="فترة مخصصة"
          selected={range === 'custom'}
          onClick={onCustomClick}
        />
      </div>

      {range === 'custom' && customFrom && customTo && (
        <p className="text-xs text-muted">
          من {customFrom} — إلى {customTo}
        </p>
      )}
    </div>
  );
}

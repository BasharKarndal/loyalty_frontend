import { formatNumber } from '@shared/lib/format';
import { ChartCard } from './ChartCard';

interface GiftDistributionChartProps {
  title: string;
  visitGifts: number;
  pointsGifts: number;
  pendingGifts: number;
}

const segments = [
  { key: 'visit', label: 'هدايا الزيارات', color: '#1e7585' },
  { key: 'points', label: 'هدايا النقاط', color: '#cfa34e' },
  { key: 'pending', label: 'قيد الانتظار', color: '#a67c2e' },
] as const;

export function GiftDistributionChart({
  title,
  visitGifts,
  pointsGifts,
  pendingGifts,
}: GiftDistributionChartProps) {
  const items = [
    { ...segments[0], value: visitGifts },
    { ...segments[1], value: pointsGifts },
    { ...segments[2], value: pendingGifts },
  ];
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <ChartCard title={title}>
        <div className="flex h-[160px] items-center justify-center text-sm text-muted">
          لا توجد هدايا في هذه الفترة
        </div>
      </ChartCard>
    );
  }

  let offset = 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  return (
    <ChartCard title={title}>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-around">
        <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={title}>
          <circle cx="70" cy="70" r={radius} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth="16" />
          {items.map((item) => {
            const fraction = item.value / total;
            const dash = fraction * circumference;
            const circle = (
              <circle
                key={item.key}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="16"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return circle;
          })}
          <text x="70" y="66" textAnchor="middle" className="fill-ink text-lg font-extrabold">
            {formatNumber(total)}
          </text>
          <text x="70" y="84" textAnchor="middle" className="fill-muted text-[10px] font-bold">
            إجمالي
          </text>
        </svg>

        <ul className="w-full space-y-2 sm:max-w-[220px]">
          {items.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate font-semibold text-ink">{item.label}</span>
              </span>
              <span className="shrink-0 font-extrabold text-ink">{formatNumber(item.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}

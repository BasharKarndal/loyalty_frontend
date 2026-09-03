import { formatCurrency, formatNumber } from '@shared/lib/format';
import { formatShortDate } from '@shared/lib/reportRange';
import type { DailySalesPoint } from '../types/report.types';
import { ChartCard } from './ChartCard';

interface SalesTrendChartProps {
  title: string;
  points: DailySalesPoint[];
  currency: string;
}

export function SalesTrendChart({ title, points, currency }: SalesTrendChartProps) {
  if (points.length === 0) {
    return (
      <ChartCard title={title}>
        <div className="flex h-[200px] items-center justify-center text-sm text-muted">
          لا توجد مبيعات في هذه الفترة
        </div>
      </ChartCard>
    );
  }

  const values = points.map((p) => Number(p.total));
  const maxY = Math.max(...values, 1);
  const width = 640;
  const height = 220;
  const padX = 36;
  const padY = 28;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const coords = values.map((v, i) => {
    const x = padX + (i / Math.max(values.length - 1, 1)) * chartW;
    const y = padY + chartH - (v / maxY) * chartH;
    return { x, y, v, day: points[i].day };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${padY + chartH} L ${coords[0].x} ${padY + chartH} Z`;

  const yTicks = [0, maxY * 0.25, maxY * 0.5, maxY * 0.75, maxY];

  return (
    <ChartCard title={title}>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-full" role="img" aria-label={title}>
          {yTicks.map((tick) => {
            const y = padY + chartH - (tick / maxY) * chartH;
            return (
              <g key={tick}>
                <line
                  x1={padX}
                  y1={y}
                  x2={width - padX}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.08}
                />
                <text
                  x={padX - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#5a6278"
                  className="text-[10px]"
                >
                  {formatNumber(Math.round(tick))}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="rgba(207,163,78,0.18)" />
          <path d={linePath} fill="none" stroke="#cfa34e" strokeWidth={2.5} strokeLinecap="round" />

          {coords.map((c, i) => (
            <g key={points[i].day}>
              <circle cx={c.x} cy={c.y} r={4} fill="#cfa34e" />
              {(points.length <= 7 || i % Math.ceil(points.length / 5) === 0) && (
                <text
                  x={c.x}
                  y={height - 6}
                  textAnchor="middle"
                  fill="#5a6278"
                  className="text-[10px]"
                >
                  {formatShortDate(c.day)}
                </text>
              )}
              <title>{`${formatShortDate(c.day)} — ${formatCurrency(c.v, currency)}`}</title>
            </g>
          ))}
        </svg>
      </div>
    </ChartCard>
  );
}

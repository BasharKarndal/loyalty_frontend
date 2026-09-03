export type ReportRange = 'today' | 'week' | 'month' | 'custom';

export interface DateRangeBounds {
  from: Date;
  to: Date;
}

/** UTC day boundaries — aligned with backend period filters. */
export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0)
  );
}

export function endOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)
  );
}

export function utcNow(): Date {
  return new Date();
}

export function resolveReportRange(
  range: ReportRange,
  custom?: { from: string; to: string } | null
): DateRangeBounds {
  const now = utcNow();
  const to = endOfUtcDay(now);

  switch (range) {
    case 'today':
      return { from: startOfUtcDay(now), to };
    case 'week': {
      const from = startOfUtcDay(now);
      const day = from.getUTCDay();
      const diff = day === 0 ? 6 : day - 1;
      from.setUTCDate(from.getUTCDate() - diff);
      return { from, to };
    }
    case 'month':
      return {
        from: startOfUtcDay(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))),
        to,
      };
    case 'custom': {
      if (custom?.from && custom?.to) {
        const fromParts = custom.from.split('-').map(Number);
        const toParts = custom.to.split('-').map(Number);
        return {
          from: new Date(Date.UTC(fromParts[0], fromParts[1] - 1, fromParts[2], 0, 0, 0, 0)),
          to: new Date(Date.UTC(toParts[0], toParts[1] - 1, toParts[2], 23, 59, 59, 999)),
        };
      }
      return {
        from: startOfUtcDay(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))),
        to,
      };
    }
    default:
      return { from: startOfUtcDay(now), to };
  }
}

export function formatShortDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('ar-IQ', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

export function toApiDateTime(date: Date): string {
  return date.toISOString();
}

export function toInputDateUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

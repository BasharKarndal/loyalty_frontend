import { CalendarClock } from 'lucide-react';
import { Icon } from '@shared/components';
import { formatDate, formatNumber } from '@shared/lib/format';
import { cn } from '@shared/lib/cn';
import type { AuthSubscription } from '@/features/auth/types/auth.types';

function remainingParts(endsAt: string, now = new Date()) {
  const ms = new Date(endsAt).getTime() - now.getTime();
  if (Number.isNaN(ms) || ms <= 0) {
    return { expired: true as const, days: 0, hours: 0 };
  }
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  return { expired: false as const, days, hours };
}

function remainingLabel(sub: AuthSubscription): string {
  const parts = remainingParts(sub.ends_at);
  if (parts.expired || !sub.is_active) {
    return 'انتهى الاشتراك';
  }
  if (parts.days <= 0) {
    return parts.hours <= 0
      ? 'ينتهي خلال أقل من ساعة'
      : `باقي ${formatNumber(parts.hours)} ساعة`;
  }
  if (parts.days === 1 && parts.hours > 0) {
    return `باقي يوم و${formatNumber(parts.hours)} ساعة`;
  }
  return `باقي ${formatNumber(parts.days)} يوم`;
}

interface SubscriptionExpiryCardProps {
  subscription: AuthSubscription;
  className?: string;
}

/** Shows cafe-admin subscription end date and time remaining. */
export function SubscriptionExpiryCard({
  subscription,
  className,
}: SubscriptionExpiryCardProps) {
  const parts = remainingParts(subscription.ends_at);
  const expired = parts.expired || !subscription.is_active;
  const urgent = !expired && parts.days <= 7;

  return (
    <section
      className={cn(
        'flex items-start gap-3 rounded-2xl border px-4 py-3.5',
        expired
          ? 'border-danger/25 bg-danger-soft'
          : urgent
            ? 'border-umber/30 bg-umber/8'
            : 'border-wheat/25 bg-wheat/8',
        className
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          expired
            ? 'bg-danger/15 text-danger'
            : urgent
              ? 'bg-umber/15 text-umber'
              : 'bg-wheat/20 text-wheat-dark'
        )}
      >
        <Icon icon={CalendarClock} size="sm" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-muted">مدة الاشتراك</p>
        <p
          className={cn(
            'mt-0.5 text-base font-extrabold',
            expired ? 'text-danger' : urgent ? 'text-umber' : 'text-ink'
          )}
        >
          {remainingLabel(subscription)}
        </p>
        <p className="mt-1 text-xs text-muted">
          {expired ? 'انتهى في' : 'ينتهي في'}{' '}
          <span className="font-bold text-ink" dir="ltr">
            {formatDate(subscription.ends_at)}
          </span>
          {!expired && (
            <>
              {' '}
              · بدأ في{' '}
              <span className="font-bold text-ink" dir="ltr">
                {formatDate(subscription.starts_at)}
              </span>
            </>
          )}
        </p>
      </div>
    </section>
  );
}

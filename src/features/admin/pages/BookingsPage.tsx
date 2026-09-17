import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarClock, CalendarPlus } from 'lucide-react';
import { Button, EmptyState, Icon, RouteFallback } from '@shared/components';
import { getApiErrorMessage } from '@shared/lib/apiError';
import { formatDate, formatNumber } from '@shared/lib/format';
import { cn } from '@shared/lib/cn';
import { useBookingsQuery } from '../api/admin.queries';
import { BookingStatusText } from '../components/BookingStatusText';
import { ExtendBookingModal } from '../components/ExtendBookingModal';
import {
  getBookingItemStatus,
  type BookingItem,
} from '../types/admin.types';

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'نشط' },
  { key: 'expiring', label: 'ينتهي قريباً' },
  { key: 'expired', label: 'منتهي' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

export function BookingsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [extending, setExtending] = useState<BookingItem | null>(null);
  const { data, isLoading, isError, error, refetch } = useBookingsQuery();

  const items = useMemo(() => {
    const list = data?.items ?? [];
    if (filter === 'all') return list;
    return list.filter((item) => getBookingItemStatus(item) === filter);
  }, [data?.items, filter]);

  if (isLoading) return <RouteFallback compact />;

  if (isError || !data) {
    return (
      <EmptyState
        message={getApiErrorMessage(error, 'تعذر تحميل الحجوزات')}
        icon={AlertCircle}
        actionLabel="إعادة المحاولة"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="admin-rise">
        <h2 className="text-xl font-extrabold text-ink">الحجوزات</h2>
        <p className="mt-1 text-sm text-muted">مدة عمل كل مدير على النظام — بعد انتهائها يتوقف الحساب فوراً</p>
        <span className="admin-hero-line mt-4 block h-px w-16 bg-wheat" />
      </section>

      <section className="admin-rise-2 grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-lg font-extrabold text-ink">{formatNumber(data.total)}</p>
          <p className="text-xs font-bold text-muted">كل الحجوزات</p>
        </div>
        <div>
          <p className="text-lg font-extrabold text-ink">{formatNumber(data.active_count)}</p>
          <p className="text-xs font-bold text-muted">نشطة</p>
        </div>
        <div>
          <p className="text-lg font-extrabold text-ink">{formatNumber(data.expired_count)}</p>
          <p className="text-xs font-bold text-muted">منتهية</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-4 border-b border-line">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={cn(
              'relative pb-2 text-sm font-bold transition-colors',
              filter === item.key ? 'text-wheat' : 'text-muted hover:text-ink'
            )}
          >
            {item.label}
            {filter === item.key && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-wheat" />
            )}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState message="لا توجد حجوزات في هذا التصفية" icon={CalendarClock} />
      ) : (
        <div className="admin-rise-3 divide-y divide-line">
          {items.map((item) => (
            <article
              key={item.id}
              className="admin-row cursor-pointer py-4"
              onClick={() => navigate(`/users/${item.user_id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-extrabold text-ink">{item.user_name}</h3>
                    <BookingStatusText status={getBookingItemStatus(item)} />
                  </div>
                  <p className="mt-1 text-xs text-muted">@{item.username}</p>
                  <p className="mt-1 text-xs text-muted">
                    من {formatDate(item.starts_at)} إلى {formatDate(item.ends_at)}
                    {item.is_active ? ` · باقي ${formatNumber(item.days_remaining)} يوم` : ''}
                  </p>
                  {item.notes && <p className="mt-1 text-xs text-muted">{item.notes}</p>}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(event) => {
                    event.stopPropagation();
                    setExtending(item);
                  }}
                >
                  <Icon icon={CalendarPlus} size="sm" />
                  تمديد
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {extending && (
        <ExtendBookingModal
          userId={extending.user_id}
          userName={extending.user_name}
          onClose={() => setExtending(null)}
        />
      )}
    </div>
  );
}

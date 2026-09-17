import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarClock, TimerReset, UserPlus, Users } from 'lucide-react';
import { EmptyState, Icon, RouteFallback } from '@shared/components';
import { getApiErrorMessage } from '@shared/lib/apiError';
import { formatDate, formatNumber } from '@shared/lib/format';
import { DashboardStatTile } from '@/features/home/components/DashboardStatTile';
import { useManagedUsersQuery } from '../api/admin.queries';
import { BookingStatusText } from '../components/BookingStatusText';
import { getUserBookingStatus } from '../types/admin.types';

export function PlatformHomePage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useManagedUsersQuery();

  if (isLoading) return <RouteFallback compact />;

  if (isError || !data) {
    return (
      <EmptyState
        message={getApiErrorMessage(error, 'تعذر تحميل لوحة الإدارة')}
        icon={AlertCircle}
        actionLabel="إعادة المحاولة"
        onAction={() => refetch()}
      />
    );
  }

  const expiring = data.items
    .filter((user) => getUserBookingStatus(user) === 'expiring')
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-4">
      <section className="admin-rise overflow-hidden bg-gradient-to-l from-brand-600 via-brand-500 to-wheat-dark p-5 text-white sm:p-6">
        <p className="text-sm font-semibold tracking-wide text-white/80">ولاء</p>
        <h2 className="mt-2 text-2xl font-extrabold">لوحة المشرف العام</h2>
        <p className="mt-2 max-w-xl text-sm text-white/82">
          إدارة الحسابات والحجوزات، مع رؤية كاملة لتشغيل كل مدير كما لو كنت داخل نظامه.
        </p>
        <span className="admin-hero-line mt-4 block h-px w-24 bg-white/50" />
      </section>

      <section className="admin-rise-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <DashboardStatTile
          label="الحسابات"
          value={formatNumber(data.total)}
          icon={Users}
          accent="wheat"
          onClick={() => navigate('/users')}
        />
        <DashboardStatTile
          label="حجوزات نشطة"
          value={formatNumber(data.active_subscriptions)}
          icon={CalendarClock}
          accent="wheat"
          onClick={() => navigate('/bookings')}
        />
        <DashboardStatTile
          label="منتهية"
          value={formatNumber(data.expired_subscriptions)}
          icon={TimerReset}
          accent="umber"
          onClick={() => navigate('/bookings')}
        />
        <DashboardStatTile
          label="تنتهي خلال 7 أيام"
          value={formatNumber(data.expiring_soon)}
          icon={AlertCircle}
          accent="umber"
          onClick={() => navigate('/bookings')}
        />
      </section>

      <section className="admin-rise-3 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-ink">حجوزات تحتاج متابعة</h3>
            <p className="mt-1 text-xs text-muted">الحسابات التي ينتهي حجزها خلال أسبوع</p>
          </div>
          <Link to="/users" className="text-xs font-bold text-wheat hover:underline">
            إدارة المستخدمين
          </Link>
        </div>

        {expiring.length === 0 ? (
          <p className="border-t border-line pt-4 text-sm text-muted">لا توجد حجوزات قريبة من الانتهاء</p>
        ) : (
          <div className="divide-y divide-line border-t border-line">
            {expiring.map((user) => (
              <div
                key={user.id}
                className="admin-row flex cursor-pointer items-center justify-between gap-3 py-3"
                onClick={() => navigate(`/users/${user.id}`)}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{user.full_name}</p>
                  <p className="truncate text-xs text-muted">
                    {user.cafe_name || `@${user.username}`}
                    {user.subscription ? ` · حتى ${formatDate(user.subscription.ends_at)}` : ''}
                  </p>
                </div>
                <BookingStatusText status={getUserBookingStatus(user)} />
              </div>
            ))}
          </div>
        )}
      </section>

      <Link
        to="/users"
        className="admin-rise-3 inline-flex items-center gap-2 text-sm font-bold text-wheat hover:underline"
      >
        <Icon icon={UserPlus} size="sm" />
        إنشاء حساب مدير
      </Link>
    </div>
  );
}

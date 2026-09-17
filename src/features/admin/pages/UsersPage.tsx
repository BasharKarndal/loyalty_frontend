import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarPlus, Pencil, Plus, Users } from 'lucide-react';
import {
  Button,
  EmptyState,
  Icon,
  RouteFallback,
  SearchField,
} from '@shared/components';
import { useDebouncedValue } from '@shared/hooks/useDebouncedValue';
import { getApiErrorMessage } from '@shared/lib/apiError';
import { formatDate, formatNumber } from '@shared/lib/format';
import { cn } from '@shared/lib/cn';
import { useManagedUsersQuery } from '../api/admin.queries';
import { BookingStatusText } from '../components/BookingStatusText';
import { CreateAdminModal } from '../components/CreateAdminModal';
import { EditAdminModal } from '../components/EditAdminModal';
import { ExtendBookingModal } from '../components/ExtendBookingModal';
import { SystemPassword } from '../components/SystemPassword';
import {
  getUserBookingStatus,
  type ManagedUser,
} from '../types/admin.types';

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'نشط' },
  { key: 'expiring', label: 'ينتهي قريباً' },
  { key: 'expired', label: 'منتهي' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [extending, setExtending] = useState<ManagedUser | null>(null);
  const navigate = useNavigate();
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, isLoading, isError, error, refetch } = useManagedUsersQuery(debouncedSearch);

  const items = useMemo(() => {
    const list = data?.items ?? [];
    if (filter === 'all') return list;
    return list.filter((user) => getUserBookingStatus(user) === filter);
  }, [data?.items, filter]);

  if (isLoading) return <RouteFallback compact />;

  if (isError || !data) {
    return (
      <EmptyState
        message={getApiErrorMessage(error, 'تعذر تحميل المستخدمين')}
        icon={AlertCircle}
        actionLabel="إعادة المحاولة"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="admin-rise">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-ink">المستخدمون</h2>
            <p className="mt-1 text-sm text-muted">كل بيانات المدراء وبيانات الدخول النظامية</p>
          </div>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Icon icon={Plus} size="sm" />
            مدير جديد
          </Button>
        </div>
        <span className="admin-hero-line mt-4 block h-px w-16 bg-wheat" />
      </section>

      <section className="admin-rise-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Stat label="الحسابات" value={formatNumber(data.total)} />
        <Stat label="نشط" value={formatNumber(data.active_subscriptions)} />
        <Stat label="منتهي" value={formatNumber(data.expired_subscriptions)} />
        <Stat label="خلال 7 أيام" value={formatNumber(data.expiring_soon)} />
      </section>

      <SearchField
        value={search}
        onChange={setSearch}
        placeholder="ابحث بالاسم أو المستخدم أو البريد"
      />

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
        <EmptyState
          message="لا يوجد مستخدمون في هذا التصفية"
          icon={Users}
          actionLabel="إضافة مدير"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="admin-rise-3 divide-y divide-line">
          {items.map((user) => {
            const status = getUserBookingStatus(user);
            return (
              <article
                key={user.id}
                className="admin-row cursor-pointer space-y-3 py-4"
                onClick={() => navigate(`/users/${user.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-extrabold text-ink">{user.full_name}</h3>
                      <BookingStatusText status={status} />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {user.cafe_name || 'بدون اسم مقهى'}
                      {' · '}
                      {formatNumber(user.customers_count ?? 0)} عميل
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        setExtending(user);
                      }}
                    >
                      <Icon icon={CalendarPlus} size="sm" />
                      تمديد
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditing(user);
                      }}
                    >
                      <Icon icon={Pencil} size="sm" />
                      تعديل
                    </Button>
                  </div>
                </div>

                <dl className="grid gap-2 text-xs sm:grid-cols-2">
                  <Field label="اسم المستخدم" value={`@${user.username}`} />
                  <Field label="البريد" value={user.email} />
                  <Field label="الهاتف" value={user.phone || '—'} />
                  <div>
                    <dt className="text-muted">كلمة المرور النظامية</dt>
                    <dd className="mt-0.5">
                      <SystemPassword value={user.system_password} />
                    </dd>
                  </div>
                  <Field
                    label="الحجز"
                    value={
                      user.subscription
                        ? `${formatDate(user.subscription.starts_at)} → ${formatDate(user.subscription.ends_at)}${
                            user.subscription.is_active
                              ? ` · باقي ${formatNumber(user.subscription.days_remaining)} يوم`
                              : ''
                          }`
                        : 'لا يوجد حجز'
                    }
                  />
                  <Field label="حالة الحساب" value={user.is_active ? 'فعّال' : 'معطّل'} />
                </dl>
              </article>
            );
          })}
        </div>
      )}

      <CreateAdminModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {editing && <EditAdminModal user={editing} onClose={() => setEditing(null)} />}
      {extending && (
        <ExtendBookingModal
          userId={extending.id}
          userName={extending.full_name}
          onClose={() => setExtending(null)}
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 font-bold text-ink">{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-extrabold text-ink">{value}</p>
      <p className="text-xs font-bold text-muted">{label}</p>
    </div>
  );
}

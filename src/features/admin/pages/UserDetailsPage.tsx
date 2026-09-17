import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CalendarPlus,
  Gift,
  Pencil,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react';
import {
  Button,
  EmptyState,
  Icon,
  RouteFallback,
} from '@shared/components';
import { getApiErrorMessage } from '@shared/lib/apiError';
import {
  customerInitial,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
} from '@shared/lib/format';
import { DashboardStatTile } from '@/features/home/components/DashboardStatTile';
import { useManagedUserOverviewQuery } from '../api/admin.queries';
import { BookingStatusText } from '../components/BookingStatusText';
import { EditAdminModal } from '../components/EditAdminModal';
import { ExtendBookingModal } from '../components/ExtendBookingModal';
import { SystemPassword } from '../components/SystemPassword';
import { workspaceStorage } from '../lib/workspaceStorage';
import { getUserBookingStatus } from '../types/admin.types';

export function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useManagedUserOverviewQuery(id);
  const [editing, setEditing] = useState(false);
  const [extending, setExtending] = useState(false);

  const openWorkspace = (path: string) => {
    if (!id) return;
    workspaceStorage.set(id);
    queryClient.invalidateQueries();
    navigate(path);
  };

  if (isLoading) return <RouteFallback compact />;

  if (isError || !data) {
    return (
      <EmptyState
        message={getApiErrorMessage(error, 'تعذر تحميل تفاصيل الحساب')}
        icon={AlertCircle}
        actionLabel="إعادة المحاولة"
        onAction={() => refetch()}
      />
    );
  }

  const { user, stats, settings } = data;
  const status = getUserBookingStatus(user);
  const currency = settings.currency || 'د.ع';
  const cafeName = settings.cafe_name?.trim() || user.cafe_name?.trim() || user.full_name;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-4">
      <section className="admin-rise">
        <Link
          to="/users"
          className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-wheat"
        >
          <Icon icon={ArrowRight} size="sm" />
          المستخدمون
        </Link>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold text-muted">@{user.username}</p>
            <h2 className="mt-1 truncate text-2xl font-extrabold text-ink">{cafeName}</h2>
            <p className="mt-2 text-sm text-muted">
              {user.full_name}
              {user.subscription
                ? user.subscription.is_active
                  ? ` · الحجز حتى ${formatDate(user.subscription.ends_at)} · باقي ${formatNumber(user.subscription.days_remaining)} يوم`
                  : ` · الحجز منتهٍ منذ ${formatDate(user.subscription.ends_at)}`
                : ' · لا يوجد حجز'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <BookingStatusText status={status} />
              <span className="text-xs font-bold text-muted">
                {user.is_active ? 'الحساب فعّال' : 'الحساب معطّل'}
              </span>
              {stats.last_activity_at && (
                <span className="text-xs text-muted">
                  آخر نشاط {formatDateTime(stats.last_activity_at)}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button type="button" onClick={() => openWorkspace('/customers')}>
              <Icon icon={Store} size="sm" />
              عرض تشغيله
            </Button>
            <Button type="button" variant="outline" onClick={() => setExtending(true)}>
              <Icon icon={CalendarPlus} size="sm" />
              تمديد
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(true)}>
              <Icon icon={Pencil} size="sm" />
              تعديل
            </Button>
          </div>
        </div>
        <span className="admin-hero-line mt-4 block h-px w-16 bg-wheat" />
      </section>

      <section className="admin-rise-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <DashboardStatTile
          label="العملاء"
          value={formatNumber(stats.customers_count)}
          icon={Users}
          accent="wheat"
          onClick={() => openWorkspace('/customers')}
        />
        <DashboardStatTile
          label="مبيعات اليوم"
          value={formatCurrency(stats.sales_today, currency)}
          icon={Banknote}
          accent="wheat"
          onClick={() => openWorkspace('/purchases')}
        />
        <DashboardStatTile
          label="إجمالي المبيعات"
          value={formatCurrency(stats.sales_total, currency)}
          icon={ShoppingBag}
          accent="umber"
          onClick={() => openWorkspace('/purchases')}
        />
        <DashboardStatTile
          label="هدايا معلّقة"
          value={formatNumber(stats.gifts_pending)}
          icon={Gift}
          accent="umber"
          onClick={() => openWorkspace('/gifts')}
        />
      </section>

      <section className="admin-rise-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <MiniStat label="مشتريات اليوم" value={formatNumber(stats.purchases_today)} />
        <MiniStat label="كل المشتريات" value={formatNumber(stats.purchases_count)} />
        <MiniStat
          label="الهدايا"
          value={`${formatNumber(stats.gifts_delivered)} مسلّمة / ${formatNumber(stats.gifts_count)}`}
        />
        <MiniStat
          label="عملاء غير نشطين"
          value={formatNumber(stats.customers_inactive)}
        />
      </section>

      <section className="admin-rise-3 space-y-3">
        <h3 className="text-sm font-extrabold text-ink">بيانات الحساب</h3>
        <dl className="grid gap-3 border-t border-line pt-4 text-xs sm:grid-cols-2">
          <Field label="الاسم" value={user.full_name} />
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
                ? `${formatDate(user.subscription.starts_at)} → ${formatDate(user.subscription.ends_at)}`
                : 'لا يوجد حجز'
            }
          />
          <Field label="العملة" value={currency} />
          <Field
            label="أهداف الولاء"
            value={`${formatNumber(settings.visit_reward_target)} زيارة · ${formatNumber(settings.points_reward_target)} نقطة · ${formatCurrency(settings.currency_per_point, currency)} للنقطة`}
          />
          {user.subscription?.notes && (
            <Field label="ملاحظة الحجز" value={user.subscription.notes} />
          )}
          <Field label="أنواع الهدايا" value={formatNumber(stats.gift_types_count)} />
        </dl>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="admin-rise-3 space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-ink">أعلى العملاء صرفاً</h3>
              <p className="mt-1 text-xs text-muted">من ينفق أكثر في هذا الحساب</p>
            </div>
            <button
              type="button"
              onClick={() => openWorkspace('/customers')}
              className="text-xs font-bold text-wheat hover:underline"
            >
              كل العملاء
            </button>
          </div>
          {data.top_customers.length === 0 ? (
            <p className="border-t border-line pt-4 text-sm text-muted">لا يوجد عملاء بعد</p>
          ) : (
            <div className="divide-y divide-line border-t border-line">
              {data.top_customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => openWorkspace(`/customers/${customer.id}`)}
                  className="admin-row flex w-full items-center gap-3 py-3 text-right"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wheat/15 text-sm font-extrabold text-wheat">
                    {customerInitial(customer.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{customer.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {formatNumber(customer.visit_count)} زيارة · {formatNumber(customer.points)} نقطة
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-extrabold text-ink">
                    {formatCurrency(customer.total_spent, currency)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="admin-rise-3 space-y-3">
          <div>
            <h3 className="text-sm font-extrabold text-ink">أحدث العملاء</h3>
            <p className="mt-1 text-xs text-muted">من انضم أخيراً إلى هذا الحساب</p>
          </div>
          {data.recent_customers.length === 0 ? (
            <p className="border-t border-line pt-4 text-sm text-muted">لا يوجد عملاء حديثون</p>
          ) : (
            <div className="divide-y divide-line border-t border-line">
              {data.recent_customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => openWorkspace(`/customers/${customer.id}`)}
                  className="admin-row flex w-full items-center gap-3 py-3 text-right"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{customer.name}</span>
                    <span className="block truncate text-xs text-muted">{customer.phone}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-muted">
                    {formatDate(customer.created_at)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="admin-rise-3 space-y-3">
        <div>
          <h3 className="text-sm font-extrabold text-ink">حركة النشاط</h3>
          <p className="mt-1 text-xs text-muted">آخر المشتريات والهدايا في هذا الحساب</p>
        </div>
        {data.recent_activity.length === 0 ? (
          <p className="border-t border-line pt-4 text-sm text-muted">لا توجد حركة بعد</p>
        ) : (
          <div className="divide-y divide-line border-t border-line">
            {data.recent_activity.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                onClick={() =>
                  item.customer_id ? openWorkspace(`/customers/${item.customer_id}`) : undefined
                }
                className="admin-row flex w-full items-center gap-3 py-3 text-right"
              >
                <span
                  className={
                    item.type === 'gift'
                      ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wheat/12 text-wheat'
                      : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-umber/10 text-umber'
                  }
                >
                  <Icon icon={item.type === 'gift' ? Gift : ShoppingBag} size="sm" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-ink">{item.title}</span>
                  <span className="block truncate text-xs text-muted">
                    {item.customer_name || 'عميل'} · {item.subtitle}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-muted">
                  {formatDateTime(item.occurred_at)}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {editing && <EditAdminModal user={user} onClose={() => setEditing(false)} />}
      {extending && (
        <ExtendBookingModal
          userId={user.id}
          userName={user.full_name}
          onClose={() => setExtending(false)}
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-extrabold text-ink">{value}</p>
      <p className="text-xs font-bold text-muted">{label}</p>
    </div>
  );
}

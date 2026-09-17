import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Banknote,
  Clock,
  Gift,
  Receipt,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { useIsRestoring } from '@tanstack/react-query';
import { APP_NAME } from '@/config/env';
import { useAuth, isSuperAdmin } from '@/features/auth';
import { PlatformHomePage } from '@/features/admin';
import { useLoyaltyConfig, useLogoSrc, useSettingsQuery } from '@/features/settings';
import {
  EmptyState,
  Icon,
  RouteFallback,
} from '@shared/components';
import { getApiErrorMessage } from '@shared/lib/apiError';
import { customerInitial, formatCurrency, formatDateTime, formatNumber } from '@shared/lib/format';
import { useDashboardStatsQuery } from '../api/dashboard.queries';
import { useTodayPurchasesSummaryQuery } from '@/features/purchases/api/purchases.queries';
import { DashboardStatTile } from '../components/DashboardStatTile';
import { ScanFab } from '../components/ScanFab';
import brandLogo from '@/assets/app-icon.png';

function SectionHeader({
  title,
  actionLabel,
  to,
}: {
  title: string;
  actionLabel: string;
  to: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-sm font-extrabold text-ink">{title}</h3>
      <Link to={to} className="text-xs font-bold text-wheat hover:underline">
        {actionLabel}
      </Link>
    </div>
  );
}

function EmptyHint({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel px-4 py-5 text-center text-sm text-muted">
      {message}
    </div>
  );
}

export function HomePage() {
  const { user } = useAuth();
  if (isSuperAdmin(user)) {
    return <PlatformHomePage />;
  }
  return <CafeHomePage />;
}

function CafeHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const isRestoring = useIsRestoring();
  const { data: settings } = useSettingsQuery();
  const logoSrc = useLogoSrc();
  const { config } = useLoyaltyConfig();
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useDashboardStatsQuery(config);
  const { data: todayPurchases } = useTodayPurchasesSummaryQuery();

  const cafeName = superAdmin
    ? 'كل الحسابات'
    : settings?.cafe_name?.trim() || APP_NAME;
  const currency = config.currency;

  if (isRestoring || isLoading || (isFetching && !stats)) {
    return <RouteFallback compact />;
  }

  if (isError && !stats) {
    return (
      <EmptyState
        message={getApiErrorMessage(error, 'تعذر تحميل لوحة التحكم')}
        icon={AlertCircle}
        actionLabel="إعادة المحاولة"
        onAction={() => refetch()}
      />
    );
  }

  if (!stats) {
    return <RouteFallback compact />;
  }

  const activities = [
    ...stats.recentPurchases.map((p) => ({
      id: `p-${p.id}`,
      type: 'purchase' as const,
      customerId: p.customer_id,
      title: 'مشترى',
      subtitle: formatCurrency(p.amount, currency),
      trailing: formatDateTime(p.created_at),
      sortAt: p.created_at,
    })),
    ...stats.recentGifts.map((g) => ({
      id: `g-${g.id}`,
      type: 'gift' as const,
      customerId: g.customer_id,
      title: 'هدية',
      subtitle: `${formatNumber(g.points_used)} نقطة`,
      trailing: formatDateTime(g.created_at),
      sortAt: g.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime())
    .slice(0, 5);

  return (
    <div className="relative mx-auto max-w-4xl space-y-4 pb-4">
      {/* Header */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-l from-brand-600 via-brand-500 to-wheat-dark p-4 text-white shadow-md sm:p-5">
        <p className="text-xs font-semibold text-white/85">مرحباً بك</p>
        <div className="mt-2 flex items-center gap-3">
          <img
            src={logoSrc ?? brandLogo}
            alt={cafeName}
            className="h-[52px] w-[52px] shrink-0 rounded-2xl border border-white/40 object-cover"
          />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold">{cafeName}</h2>
            <p className="mt-1 text-xs leading-relaxed text-white/82">
              {superAdmin
                ? 'نشاط كل المقاهي والحسابات في نظرة واحدة'
                : 'نظرة سريعة على نشاط عملك اليوم'}
            </p>
          </div>
        </div>
      </section>

      <p className="text-xs text-muted">
        مبيعات اليوم = مجموع مبالغ المشتريات — باقي الإحصائيات إجمالية
        {isFetching && (
          <span className="mr-2 text-wheat"> — جاري التحديث...</span>
        )}
      </p>

      {/* Action needed */}
      {(stats.pendingGiftsCount > 0 || stats.eligibleCustomersCount > 0) && (
        <section className="space-y-2">
          <h3 className="text-sm font-extrabold text-ink">يحتاج إجراء</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {stats.pendingGiftsCount > 0 && (
              <button
                type="button"
                onClick={() => navigate('/gifts')}
                className="flex items-center gap-2 rounded-xl bg-umber/10 px-3 py-3 text-right transition-colors hover:bg-umber/15"
              >
                <Icon icon={Clock} size="sm" className="shrink-0 text-umber" />
                <span className="text-sm font-bold text-ink">
                  هدايا معلّقة: {formatNumber(stats.pendingGiftsCount)}
                </span>
              </button>
            )}
            {stats.eligibleCustomersCount > 0 && (
              <button
                type="button"
                onClick={() => navigate('/gifts')}
                className="flex items-center gap-2 rounded-xl bg-wheat/12 px-3 py-3 text-right transition-colors hover:bg-wheat/18"
              >
                <Icon icon={Gift} size="sm" className="shrink-0 text-wheat-dark" />
                <span className="text-sm font-bold text-ink">
                  مؤهلون الآن: {formatNumber(stats.eligibleCustomersCount)}
                </span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* Stats grid */}
      <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <DashboardStatTile
          label="مبيعات اليوم"
          value={formatCurrency(todayPurchases?.totalAmount ?? 0, currency)}
          icon={Banknote}
          accent="wheat"
          onClick={() => navigate('/reports')}
        />
        <DashboardStatTile
          label="عدد العملاء"
          value={formatNumber(stats.customersCount)}
          icon={Users}
          accent="wheat"
          onClick={() => navigate('/customers')}
        />
        <DashboardStatTile
          label="مشتريات اليوم"
          value={formatNumber(todayPurchases?.count ?? 0)}
          icon={Receipt}
          accent="umber"
          onClick={() => navigate('/purchases')}
        />
        <DashboardStatTile
          label="عدد الهدايا"
          value={formatNumber(stats.giftsCount)}
          icon={Gift}
          accent="umber"
          onClick={() => navigate('/gifts')}
        />
      </section>

      {/* Recent customers */}
      <section className="space-y-2">
        <SectionHeader title="أحدث العملاء" actionLabel="عرض الكل" to="/customers" />
        {stats.recentCustomers.length === 0 ? (
          <EmptyHint message="لا يوجد عملاء حديثون" />
        ) : (
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {stats.recentCustomers.map((customer) => (
              <Link
                key={customer.id}
                to={`/customers/${customer.id}`}
                className="flex w-[148px] shrink-0 items-center gap-2.5 rounded-2xl border border-line bg-panel p-2.5 transition-colors hover:border-wheat/30"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wheat/15 text-sm font-extrabold text-wheat-dark">
                  {customerInitial(customer.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink">{customer.name}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {formatDateTime(customer.created_at)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent operations */}
      <section className="space-y-2">
        <SectionHeader title="آخر العمليات" actionLabel="عرض الكل" to="/purchases" />
        {activities.length === 0 ? (
          <EmptyHint message="لا توجد عمليات حديثة" />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-panel">
            {activities.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/customers/${item.customerId}`)}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-right transition-colors hover:bg-surface/60"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    item.type === 'purchase' ? 'bg-umber/10 text-umber' : 'bg-wheat/12 text-wheat'
                  }`}
                >
                  <Icon icon={item.type === 'purchase' ? ShoppingBag : Gift} size="sm" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-ink">{item.title}</span>
                  <span className="block text-xs text-muted">{item.subtitle}</span>
                </span>
                <span className="shrink-0 text-[11px] text-muted">{item.trailing}</span>
                {index < activities.length - 1 && (
                  <span className="sr-only">—</span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* QR FAB — desktop; mobile uses bottom nav center button */}
      <ScanFab className="hidden lg:flex" />
    </div>
  );
}

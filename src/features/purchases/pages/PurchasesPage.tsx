import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Plus, ShoppingBag } from 'lucide-react';
import { Button, EmptyState, Icon, RouteFallback, SearchField } from '@shared/components';
import { useDebouncedValue } from '@shared/hooks/useDebouncedValue';
import { getApiErrorMessage } from '@shared/lib/apiError';
import { formatCurrency, formatNumber } from '@shared/lib/format';
import { PurchasePermissions, usePermissions } from '@/features/auth';
import { useLoyaltyConfig } from '@/features/settings';
import { usePurchasesQuery } from '../api/purchases.queries';
import { PeriodChip } from '../components/PeriodChip';
import { PurchaseCard } from '../components/PurchaseCard';
import type { PurchasePeriod } from '../types/purchase.types';

export function PurchasesPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { config } = useLoyaltyConfig();
  const canCreate = can(PurchasePermissions.CREATE);
  const canUpdate = can(PurchasePermissions.UPDATE);

  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<PurchasePeriod>('all');
  const debouncedSearch = useDebouncedValue(search.trim());

  const queryParams = useMemo(
    () => ({
      skip: 0,
      limit: 100,
      search: debouncedSearch || undefined,
      period,
    }),
    [debouncedSearch, period]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = usePurchasesQuery(queryParams);

  return (
    <div className="page-shell mx-auto max-w-4xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-ink">المشتريات</h2>
          <p className="mt-1 text-sm text-muted">سجل مشتريات العملاء ونقاط الولاء</p>
        </div>
        {canCreate && (
          <Button type="button" onClick={() => navigate('/purchases/new')}>
            <Icon icon={Plus} size="sm" />
            إضافة مشترى
          </Button>
        )}
      </div>

      <SearchField
        value={search}
        onChange={setSearch}
        placeholder="بحث باسم العميل أو الهاتف..."
      />

      <div className="flex flex-wrap gap-2">
        <PeriodChip label="الكل" selected={period === 'all'} onClick={() => setPeriod('all')} />
        <PeriodChip label="اليوم" selected={period === 'today'} onClick={() => setPeriod('today')} />
        <PeriodChip label="هذا الأسبوع" selected={period === 'week'} onClick={() => setPeriod('week')} />
      </div>

      {data && (
        <p className="text-sm font-bold text-muted">
          عدد المشتريات: {formatNumber(data.total)}
          {period !== 'all' && (
            <span className="mr-2">
              — المجموع: {formatCurrency(data.total_amount, config.currency)}
            </span>
          )}
          {isFetching && !isLoading && (
            <span className="mr-2 text-xs font-normal text-muted/70">— جاري التحديث...</span>
          )}
        </p>
      )}

      {isLoading && <RouteFallback compact />}

      {isError && (
        <EmptyState
          message={getApiErrorMessage(error, 'تعذر تحميل المشتريات')}
          icon={AlertCircle}
          actionLabel="إعادة المحاولة"
          onAction={() => refetch()}
        />
      )}

      {!isLoading && !isError && data?.items.length === 0 && (
        <EmptyState
          message="لا توجد مشتريات"
          description={canCreate ? 'ابدأ بتسجيل أول مشترى' : undefined}
          icon={ShoppingBag}
          actionLabel={canCreate ? 'إضافة مشترى' : undefined}
          onAction={canCreate ? () => navigate('/purchases/new') : undefined}
        />
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="space-y-3">
          {data.items.map((purchase) => (
            <PurchaseCard key={purchase.id} purchase={purchase} showEdit={canUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

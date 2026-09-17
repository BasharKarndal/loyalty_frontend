import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Plus, QrCode, Users } from 'lucide-react';
import { Button, EmptyState, Icon, RouteFallback, SearchField } from '@shared/components';
import { useDebouncedValue } from '@shared/hooks/useDebouncedValue';
import { getApiErrorMessage } from '@shared/lib/apiError';
import { formatNumber } from '@shared/lib/format';
import { CustomerPermissions, usePermissions } from '@/features/auth/hooks/usePermissions';
import {
  useCustomersQuery,
  useRestoreCustomerMutation,
} from '../api/customers.queries';
import { CustomerCard, InactiveCustomerCard } from '../components/CustomerCard';
import { FilterChip } from '../components/FilterChip';

type FilterMode = 'active' | 'inactive';

export function CustomersPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canCreate = can(CustomerPermissions.CREATE);
  const canRestore = can(CustomerPermissions.RESTORE);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('active');
  const debouncedSearch = useDebouncedValue(search.trim());

  const queryParams = useMemo(
    () =>
      filter === 'inactive'
        ? {
            skip: 0,
            limit: 100,
            search: debouncedSearch || undefined,
            inactive_only: true,
          }
        : {
            skip: 0,
            limit: 100,
            search: debouncedSearch || undefined,
            active_only: true,
          },
    [debouncedSearch, filter]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useCustomersQuery(queryParams);

  const visibleCustomers = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((customer) =>
      filter === 'inactive' ? !customer.is_active : customer.is_active
    );
  }, [data?.items, filter]);

  const restoreMutation = useRestoreCustomerMutation();
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      await restoreMutation.mutateAsync(id);
    } finally {
      setRestoringId(null);
    }
  };

  const handleFilterChange = (mode: FilterMode) => {
    setFilter(mode);
  };

  return (
    <div className="page-shell mx-auto max-w-4xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-ink">العملاء</h2>
          <p className="mt-1 text-sm text-muted">إدارة عملاء برنامج الولاء</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/scan')}>
            <Icon icon={QrCode} size="sm" />
            مسح QR
          </Button>
          {canCreate && (
            <Button type="button" onClick={() => navigate('/customers/new')}>
              <Icon icon={Plus} size="sm" />
              إضافة عميل
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="بحث بالاسم أو الهاتف..."
          className="flex-1"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="العملاء النشطون"
          selected={filter === 'active'}
          onClick={() => handleFilterChange('active')}
        />
        <FilterChip
          label="المحذوفون"
          selected={filter === 'inactive'}
          onClick={() => handleFilterChange('inactive')}
        />
      </div>

      {data && (
        <p className="text-sm font-bold text-muted">
          {filter === 'inactive' ? 'عملاء محذوفون' : 'عدد العملاء'}:{' '}
          {formatNumber(visibleCustomers.length)}
          {isFetching && !isLoading && (
            <span className="mr-2 text-xs font-normal text-muted/70">— جاري التحديث...</span>
          )}
        </p>
      )}

      {isLoading && <RouteFallback compact />}

      {isError && (
        <EmptyState
          message={getApiErrorMessage(error, 'تعذر تحميل العملاء')}
          description="تحقق من الاتصال وحاول مرة أخرى"
          icon={AlertCircle}
          actionLabel="إعادة المحاولة"
          onAction={() => refetch()}
        />
      )}

      {!isLoading && !isError && visibleCustomers.length === 0 && (
        <EmptyState
          message={filter === 'inactive' ? 'لا يوجد عملاء محذوفون' : 'لا يوجد عملاء بعد'}
          description={
            filter === 'active' && canCreate
              ? 'ابدأ بإضافة أول عميل لبرنامج الولاء'
              : undefined
          }
          icon={Users}
          actionLabel={filter === 'active' && canCreate ? 'إضافة عميل' : undefined}
          onAction={
            filter === 'active' && canCreate ? () => navigate('/customers/new') : undefined
          }
        />
      )}

      {!isLoading && !isError && visibleCustomers.length > 0 && (
        <div className="space-y-3">
          {visibleCustomers.map((customer) =>
            filter === 'inactive' ? (
              <InactiveCustomerCard
                key={customer.id}
                customer={customer}
                restoring={restoringId === customer.id}
                onRestore={
                  canRestore ? () => handleRestore(customer.id) : undefined
                }
              />
            ) : (
              <CustomerCard key={customer.id} customer={customer} />
            )
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { Icon } from '@shared/components';
import { useDebouncedValue } from '@shared/hooks/useDebouncedValue';
import { useCustomerQuery, useCustomersQuery } from '@/features/customers/api/customers.queries';
import type { Customer } from '@/features/customers/types/customer.types';

interface CustomerSelectProps {
  value: string;
  onChange: (customerId: string) => void;
  disabled?: boolean;
  error?: string;
}

export function CustomerSelect({ value, onChange, disabled, error }: CustomerSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebouncedValue(search.trim());

  const { data, isLoading } = useCustomersQuery({
    skip: 0,
    limit: 100,
    search: debouncedSearch || undefined,
    active_only: true,
  });
  const { data: selectedCustomer } = useCustomerQuery(value || undefined);

  const customers = data?.items ?? [];
  const selected = useMemo(() => {
    if (!value) return undefined;
    return customers.find((c) => c.id === value) ?? selectedCustomer;
  }, [customers, selectedCustomer, value]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      searchRef.current?.focus();
    }
  }, [open]);

  const handleSelect = (customerId: string) => {
    onChange(customerId);
    setSearch('');
    setOpen(false);
  };

  const handleClear = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div className="w-full" ref={rootRef}>
      <label className="mb-1.5 block text-sm font-medium text-ink">العميل</label>

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            if (disabled) return;
            setOpen((current) => !current);
            setSearch('');
          }}
          className={cn(
            'flex w-full items-center justify-between gap-3 rounded-xl border bg-panel px-4 py-3 text-right shadow-sm transition-colors',
            error ? 'border-danger' : open ? 'border-brand-400 ring-2 ring-brand-400/20' : 'border-line',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        >
          <span className="min-w-0 flex-1">
            {selected ? (
              <>
                <span className="block truncate text-sm font-bold text-ink">{selected.name}</span>
                <span className="block truncate text-xs text-muted">{selected.phone}</span>
              </>
            ) : (
              <span className="text-sm text-muted">اختر عميلاً من القائمة</span>
            )}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {selected && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleClear(event);
                  }
                }}
                className="rounded-lg p-1 text-muted hover:bg-surface hover:text-danger"
                aria-label="إلغاء الاختيار"
              >
                <Icon icon={X} size="sm" />
              </span>
            )}
            <Icon
              icon={ChevronDown}
              size="sm"
              className={cn('text-muted transition-transform', open && 'rotate-180')}
            />
          </span>
        </button>

        {open && (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-line bg-panel shadow-lg">
            <div className="relative border-b border-line">
              <Icon
                icon={Search}
                size="sm"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الهاتف..."
                className="w-full bg-transparent py-3 pr-10 pl-3 text-sm text-ink placeholder:text-muted/70 focus:outline-none"
              />
            </div>

            <ul className="max-h-64 overflow-y-auto" role="listbox" aria-label="قائمة العملاء">
              {isLoading && (
                <li className="p-4 text-center text-sm text-muted">جاري تحميل العملاء...</li>
              )}
              {!isLoading && customers.length === 0 && (
                <li className="p-4 text-center text-sm text-muted">لا يوجد عملاء مطابقون</li>
              )}
              {!isLoading &&
                customers.map((customer: Customer) => {
                  const isSelected = customer.id === value;
                  return (
                    <li key={customer.id} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onClick={() => handleSelect(customer.id)}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 px-4 py-3 text-right hover:bg-surface',
                          isSelected && 'bg-wheat/10'
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-ink">
                            {customer.name}
                          </span>
                          <span className="block truncate text-xs text-muted">{customer.phone}</span>
                        </span>
                        {isSelected && <Icon icon={Check} size="sm" className="shrink-0 text-wheat" />}
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        )}
      </div>

      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}

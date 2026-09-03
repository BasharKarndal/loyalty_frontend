import { useMemo, useState } from 'react';
import { Check, Globe, X } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import {
  ALL_COUNTRIES,
  FAVORITE_COUNTRIES,
  FAVORITE_COUNTRY_CODES,
  type CountryOption,
  searchCountries,
} from '@shared/data/countries';
import { Icon } from './Icon';
import { SearchField } from './SearchField';

interface CountryPickerModalProps {
  open: boolean;
  currentDialCode: string;
  onSelect: (dialCode: string) => void;
  onClose: () => void;
}

function CountryRow({
  country,
  selected,
  onSelect,
}: {
  country: CountryOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const label = country.nameAr ?? country.name;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition-colors',
        selected ? 'bg-wheat/12 ring-1 ring-wheat/40' : 'hover:bg-surface'
      )}
    >
      <span className="text-xl leading-none">{country.flag}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{label}</span>
      <span className="text-sm font-semibold text-muted" dir="ltr">
        +{country.dialCode}
      </span>
      {selected && <Icon icon={Check} size="sm" className="text-wheat" />}
    </button>
  );
}

export function CountryPickerModal({
  open,
  currentDialCode,
  onSelect,
  onClose,
}: CountryPickerModalProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchCountries(query), [query]);
  const showFavorites = !query.trim();
  const otherCountries = useMemo(
    () =>
      showFavorites
        ? ALL_COUNTRIES.filter((c) => !FAVORITE_COUNTRY_CODES.includes(c.iso as (typeof FAVORITE_COUNTRY_CODES)[number]))
        : results,
    [showFavorites, results]
  );

  if (!open) return null;

  const handleSelect = (dialCode: string) => {
    onSelect(dialCode);
    setQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/55 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="إغلاق"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-line bg-panel shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-wheat/15 text-wheat">
              <Icon icon={Globe} size="sm" />
            </span>
            <h2 className="text-base font-extrabold text-ink">اختر الدولة</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
            aria-label="إغلاق"
          >
            <Icon icon={X} size="sm" />
          </button>
        </div>

        <div className="border-b border-line px-5 py-3">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="ابحث بالاسم أو رمز الدولة..."
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {showFavorites && (
            <section className="mb-4">
              <p className="mb-2 px-2 text-xs font-extrabold text-muted">الدول الأكثر استخداماً</p>
              <div className="space-y-1">
                {FAVORITE_COUNTRIES.map((country) => (
                  <CountryRow
                    key={`fav-${country.iso}`}
                    country={country}
                    selected={country.dialCode === currentDialCode}
                    onSelect={() => handleSelect(country.dialCode)}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            {showFavorites && (
              <p className="mb-2 px-2 text-xs font-extrabold text-muted">جميع الدول</p>
            )}
            {results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">لم يُعثر على دولة</p>
            ) : (
              <div className="space-y-1">
                {otherCountries.map((country) => (
                  <CountryRow
                    key={country.iso}
                    country={country}
                    selected={country.dialCode === currentDialCode}
                    onSelect={() => handleSelect(country.dialCode)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

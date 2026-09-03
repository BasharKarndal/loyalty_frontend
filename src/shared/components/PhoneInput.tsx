import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { findCountryByDialCode } from '@shared/data/countries';
import { CountryPickerModal } from './CountryPickerModal';
import { Icon } from './Icon';

interface PhoneInputProps {
  label?: string;
  dialCode: string;
  localPhone: string;
  error?: string;
  disabled?: boolean;
  onDialCodeChange: (dialCode: string) => void;
  onLocalPhoneChange: (value: string) => void;
  onBlur?: () => void;
}

export function PhoneInput({
  label = 'رقم الهاتف',
  dialCode,
  localPhone,
  error,
  disabled,
  onDialCodeChange,
  onLocalPhoneChange,
  onBlur,
}: PhoneInputProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const country = findCountryByDialCode(dialCode);

  const handleLocalChange = (value: string) => {
    onLocalPhoneChange(value.replace(/\D/g, '').slice(0, 12));
  };

  return (
    <>
      <div className="w-full">
        <div
          className={cn(
            'overflow-hidden rounded-xl border bg-panel shadow-sm transition-colors',
            error ? 'border-danger' : 'border-line focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-400/25'
          )}
        >
          <p className="px-3.5 pt-2.5 text-xs font-semibold text-muted">{label}</p>
          <div className="flex h-[52px] items-stretch">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setPickerOpen(true)}
              className="flex w-[108px] shrink-0 items-center justify-center gap-1 border-l border-line px-2 text-wheat transition-colors hover:bg-surface disabled:opacity-60"
              aria-label="اختر رمز الدولة"
            >
              <span className="text-base leading-none">{country?.flag ?? '🌐'}</span>
              <span className="text-sm font-extrabold" dir="ltr">
                +{dialCode}
              </span>
              <Icon icon={ChevronDown} size="xs" className="text-muted" />
            </button>
            <input
              type="tel"
              inputMode="numeric"
              dir="ltr"
              disabled={disabled}
              value={localPhone}
              onChange={(e) => handleLocalChange(e.target.value)}
              onBlur={onBlur}
              placeholder="7XXXXXXXX"
              autoComplete="tel-national"
              className="min-w-0 flex-1 bg-transparent px-3 text-left text-sm font-semibold text-ink placeholder:text-muted/60 focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>
        {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
      </div>

      <CountryPickerModal
        open={pickerOpen}
        currentDialCode={dialCode}
        onSelect={onDialCodeChange}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}

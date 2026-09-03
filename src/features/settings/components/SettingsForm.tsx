import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { Button, Icon, Input } from '@shared/components';
import { cn } from '@shared/lib/cn';
import brandLogo from '@/assets/app-icon.png';
import {
  useDeleteLogoMutation,
  useLogoSrc,
  useUploadLogoMutation,
} from '../api/settings.queries';

interface LogoUploaderProps {
  className?: string;
}

export function LogoUploader({ className }: LogoUploaderProps) {
  const logoSrc = useLogoSrc();
  const uploadLogo = useUploadLogoMutation();
  const deleteLogo = useDeleteLogoMutation();
  const [preview, setPreview] = useState<string | null>(null);

  const displaySrc = preview ?? logoSrc ?? brandLogo;

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    uploadLogo.mutate(file, {
      onError: () => setPreview(null),
    });
  };

  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center', className)}>
      <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
        <img src={displaySrc} alt="شعار المقهى" className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-wrap gap-2">
        <label
          className={cn(
            'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-wheat/40 px-3 py-1.5 text-sm font-semibold text-wheat transition-colors hover:bg-wheat/10',
            uploadLogo.isPending && 'pointer-events-none opacity-50'
          )}
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            disabled={uploadLogo.isPending}
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
          <Icon icon={ImagePlus} size="sm" />
          {uploadLogo.isPending ? 'جاري الرفع...' : 'رفع شعار'}
        </label>

        {logoSrc && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={deleteLogo.isPending}
            onClick={() => {
              setPreview(null);
              deleteLogo.mutate();
            }}
          >
            <Icon icon={Trash2} size="sm" />
            حذف الشعار
          </Button>
        )}
      </div>
    </div>
  );
}

interface SettingsFormFieldsProps {
  cafeName: string;
  currency: string;
  visitTarget: string;
  pointsTarget: string;
  currencyPerPoint: string;
  onCafeNameChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onVisitTargetChange: (value: string) => void;
  onPointsTargetChange: (value: string) => void;
  onCurrencyPerPointChange: (value: string) => void;
}

export function SettingsFormFields({
  cafeName,
  currency,
  visitTarget,
  pointsTarget,
  currencyPerPoint,
  onCafeNameChange,
  onCurrencyChange,
  onVisitTargetChange,
  onPointsTargetChange,
  onCurrencyPerPointChange,
}: SettingsFormFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label="اسم المقهى / المتجر"
        value={cafeName}
        onChange={(event) => onCafeNameChange(event.target.value)}
        placeholder="مثال: مقهى ولاء"
      />
      <Input
        label="رمز العملة"
        value={currency}
        onChange={(event) => onCurrencyChange(event.target.value)}
        placeholder="د.ع"
      />
      <Input
        label="عدد الزيارات للهدية"
        type="number"
        min={1}
        value={visitTarget}
        onChange={(event) => onVisitTargetChange(event.target.value)}
      />
      <Input
        label="عدد النقاط للهدية"
        type="number"
        min={1}
        value={pointsTarget}
        onChange={(event) => onPointsTargetChange(event.target.value)}
      />
      <Input
        label="مبلغ العملة لكل نقطة"
        type="number"
        min={1}
        step="any"
        value={currencyPerPoint}
        onChange={(event) => onCurrencyPerPointChange(event.target.value)}
        className="sm:col-span-2"
      />
      <p className="-mt-2 text-xs text-muted sm:col-span-2">
        كل {currencyPerPoint || '—'} {currency || '—'} = نقطة واحدة
      </p>
    </div>
  );
}

export function LoyaltyPreview({
  currency,
  currencyPerPoint,
  visitTarget,
  pointsTarget,
  sampleAmount,
  onSampleAmountChange,
}: {
  currency: string;
  currencyPerPoint: number;
  visitTarget: number;
  pointsTarget: number;
  sampleAmount: string;
  onSampleAmountChange: (value: string) => void;
}) {
  const amount = Number(sampleAmount) || 0;
  const earnedPoints = useMemo(() => {
    if (amount <= 0 || currencyPerPoint <= 0) return 0;
    return Math.max(0, Math.floor(amount / currencyPerPoint));
  }, [amount, currencyPerPoint]);

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <h3 className="mb-3 text-sm font-semibold text-header-title">معاينة سريعة</h3>
      <Input
        label={`مبلغ تجريبي (${currency})`}
        type="number"
        min={0}
        value={sampleAmount}
        onChange={(event) => onSampleAmountChange(event.target.value)}
      />
      <dl className="mt-4 grid gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">النقاط المكتسبة</dt>
          <dd className="font-semibold text-wheat">{earnedPoints}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">هدية الزيارات عند</dt>
          <dd className="font-semibold">{visitTarget} زيارة</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">هدية النقاط عند</dt>
          <dd className="font-semibold">{pointsTarget} نقطة</dd>
        </div>
      </dl>
    </div>
  );
}

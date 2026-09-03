import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button, Icon, RouteFallback } from '@shared/components';
import {
  LoyaltyPreview,
  LogoUploader,
  SettingsFormFields,
} from '../components/SettingsForm';
import { useSettingsQuery, useUpdateSettingsMutation } from '../api/settings.queries';

export function SettingsPage() {
  const { data: settings, isLoading } = useSettingsQuery();
  const updateSettings = useUpdateSettingsMutation();

  const [hydrated, setHydrated] = useState(false);
  const [cafeName, setCafeName] = useState('');
  const [currency, setCurrency] = useState('د.ع');
  const [visitTarget, setVisitTarget] = useState('10');
  const [pointsTarget, setPointsTarget] = useState('100');
  const [currencyPerPoint, setCurrencyPerPoint] = useState('1000');
  const [sampleAmount, setSampleAmount] = useState('10000');

  useEffect(() => {
    if (!settings || hydrated) return;
    setCafeName(settings.cafe_name);
    setCurrency(settings.currency);
    setVisitTarget(String(settings.visit_reward_target));
    setPointsTarget(String(settings.points_reward_target));
    setCurrencyPerPoint(String(settings.currency_per_point));
    setHydrated(true);
  }, [settings, hydrated]);

  if (isLoading || !settings) {
    return <RouteFallback label="جاري تحميل الإعدادات..." />;
  }

  const parsedVisit = Math.max(1, Number(visitTarget) || 10);
  const parsedPoints = Math.max(1, Number(pointsTarget) || 100);
  const parsedPerPoint = Math.max(1, Number(currencyPerPoint) || 1000);

  const handleSave = () => {
    updateSettings.mutate({
      cafe_name: cafeName.trim(),
      currency: currency.trim() || 'د.ع',
      visit_reward_target: parsedVisit,
      points_reward_target: parsedPoints,
      currency_per_point: parsedPerPoint,
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-2xl border border-line bg-panel p-4 sm:p-6">
        <h2 className="mb-1 text-base font-semibold text-header-title">الهوية والشعار</h2>
        <p className="mb-4 text-sm text-muted">
          خصّص اسم متجرك وشعارك — يظهران في القائمة الجانبية وتفاصيل العملاء.
        </p>
        <LogoUploader />
      </section>

      <section className="rounded-2xl border border-line bg-panel p-4 sm:p-6">
        <h2 className="mb-1 text-base font-semibold text-header-title">إعدادات الولاء</h2>
        <p className="mb-4 text-sm text-muted">
          تحكم في حساب النقاط وشروط استبدال الهدايا لحسابك.
        </p>
        <SettingsFormFields
          cafeName={cafeName}
          currency={currency}
          visitTarget={visitTarget}
          pointsTarget={pointsTarget}
          currencyPerPoint={currencyPerPoint}
          onCafeNameChange={setCafeName}
          onCurrencyChange={setCurrency}
          onVisitTargetChange={setVisitTarget}
          onPointsTargetChange={setPointsTarget}
          onCurrencyPerPointChange={setCurrencyPerPoint}
        />

        <div className="mt-6">
          <LoyaltyPreview
            currency={currency}
            currencyPerPoint={parsedPerPoint}
            visitTarget={parsedVisit}
            pointsTarget={parsedPoints}
            sampleAmount={sampleAmount}
            onSampleAmountChange={setSampleAmount}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={handleSave} disabled={updateSettings.isPending}>
            <Icon icon={Save} size="sm" />
            {updateSettings.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </section>
    </div>
  );
}

import { useRef, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Banknote,
  CheckCircle2,
  Clock,
  Download,
  Gift,
  Receipt,
  Star,
  Store,
} from 'lucide-react';
import { toast } from 'sonner';
import { APP_NAME } from '@/config/env';
import { useLoyaltyConfig, useLogoSrc, useSettingsQuery } from '@/features/settings';
import { Button, EmptyState, Icon, RouteFallback } from '@shared/components';
import { getApiErrorMessage } from '@shared/lib/apiError';
import { customerInitial, formatCurrency, formatNumber } from '@shared/lib/format';
import { formatShortDate, resolveReportRange, toInputDateUtc } from '@shared/lib/reportRange';
import { useReportStatsQuery } from '../api/reports.queries';
import { GiftDistributionChart } from '../components/GiftDistributionChart';
import { ReportRangeBar } from '../components/ReportRangeBar';
import { ReportStatTile } from '../components/ReportStatTile';
import { SalesTrendChart } from '../components/SalesTrendChart';
import { TopCustomersChart } from '../components/TopCustomersChart';
import { exportReportToPdf } from '../lib/exportReportPdf';
import type { ReportRangeFilter } from '../types/report.types';
import brandLogo from '@/assets/app-icon.png';

export function ReportsPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<ReportRangeFilter>('month');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data: settings } = useSettingsQuery();
  const logoSrc = useLogoSrc();
  const { config } = useLoyaltyConfig();
  const currency = config.currency;
  const cafeName = settings?.cafe_name?.trim() || APP_NAME;

  const { data: stats, isLoading, isError, error, refetch, isFetching } = useReportStatsQuery(
    range,
    customRange,
    range !== 'custom' || Boolean(customRange?.from && customRange?.to)
  );

  const isEmptyPeriod =
    stats &&
    Number(stats.total_sales) === 0 &&
    stats.purchases_count === 0 &&
    stats.gifts_count === 0;

  const bounds = resolveReportRange(range, customRange);
  const rangeLabel = `${formatShortDate(bounds.from)} — ${formatShortDate(bounds.to)}`;

  const openCustomPicker = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    setDraftFrom(customRange?.from ?? toInputDateUtc(monthStart));
    setDraftTo(customRange?.to ?? toInputDateUtc(now));
    setShowCustomPicker(true);
  };

  const applyCustomRange = () => {
    if (!draftFrom || !draftTo) {
      toast.error('يرجى اختيار تاريخ البداية والنهاية');
      return;
    }
    if (new Date(draftFrom) > new Date(draftTo)) {
      toast.error('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
      return;
    }
    setCustomRange({ from: draftFrom, to: draftTo });
    setRange('custom');
    setShowCustomPicker(false);
  };

  const handleExportPdf = async () => {
    if (!stats) return;
    setExporting(true);
    try {
      const fromSlug = bounds.from.toISOString().slice(0, 10);
      const toSlug = bounds.to.toISOString().slice(0, 10);
      await exportReportToPdf({
        stats,
        cafeName,
        rangeLabel,
        currency,
        filename: `report-${fromSlug}-${toSlug}.pdf`,
        fallbackLogo: brandLogo,
      });
      toast.success('تم تنزيل ملف PDF بنجاح');
    } catch (exportError) {
      console.error('PDF export failed:', exportError);
      toast.error('تعذر تصدير ملف PDF — جرّب مرة أخرى');
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) return <RouteFallback compact />;

  if (isError || !stats) {
    return (
      <EmptyState
        message={getApiErrorMessage(error, 'تعذر تحميل التقرير')}
        description="تحقق من الاتصال بالخادم وحاول مرة أخرى"
        icon={AlertCircle}
        actionLabel="إعادة المحاولة"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-extrabold text-ink">التقارير والتحليلات</h2>
          <p className="mt-1 text-xs text-muted">
            نظرة تفصيلية على المبيعات والهدايا
            {isFetching && <span className="mr-2 text-wheat"> — جاري التحديث...</span>}
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleExportPdf}
          disabled={exporting}
        >
          <Icon icon={Download} size="sm" />
          {exporting ? 'جاري التصدير...' : 'تصدير PDF'}
        </Button>
      </div>

      <div className="print:hidden">
        <ReportRangeBar
          range={range}
          onRangeChange={setRange}
          onCustomClick={openCustomPicker}
          customFrom={customRange?.from}
          customTo={customRange?.to}
        />
        <p className="mt-2 text-xs font-semibold text-muted">الفترة: {rangeLabel}</p>
        {isEmptyPeriod && (
          <p className="mt-2 rounded-xl border border-line bg-panel px-3 py-2 text-xs font-semibold text-muted">
            لا توجد مشتريات أو هدايا في هذه الفترة — جرّب «هذا الشهر» أو اختر فترة أخرى.
          </p>
        )}
      </div>

      {showCustomPicker && (
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-sm print:hidden">
          <p className="mb-3 text-sm font-extrabold text-ink">اختر فترة مخصصة</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-bold text-muted">من</span>
              <input
                type="date"
                value={draftFrom}
                max={draftTo || undefined}
                onChange={(e) => setDraftFrom(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-bold text-muted">إلى</span>
              <input
                type="date"
                value={draftTo}
                min={draftFrom || undefined}
                max={toInputDateUtc(new Date())}
                onChange={(e) => setDraftTo(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="primary" size="sm" onClick={applyCustomRange}>
              تطبيق
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCustomPicker(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      )}

      <div
        ref={reportRef}
        className="report-print-root space-y-4 rounded-2xl bg-white p-4 text-[#2b2d42] sm:p-5"
      >
        <header className="overflow-hidden rounded-2xl bg-gradient-to-l from-[#1a3b70] via-[#1e7585] to-[#a67c2e] p-4 text-white">
          <div className="flex items-center gap-3">
            <img
              src={logoSrc ?? brandLogo}
              alt={cafeName}
              crossOrigin="anonymous"
              className="h-12 w-12 shrink-0 rounded-xl border border-white/30 object-cover"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white/85">تقرير الأداء</p>
              <h1 className="truncate text-lg font-extrabold">{cafeName}</h1>
              <p className="mt-1 text-xs text-white/80">{rangeLabel}</p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <ReportStatTile
            label="مجموع المشتريات"
            value={formatCurrency(stats.total_sales, currency)}
            icon={Banknote}
            accent="wheat"
          />
          <ReportStatTile
            label="عدد المشتريات"
            value={formatNumber(stats.purchases_count)}
            icon={Receipt}
            accent="umber"
          />
          <ReportStatTile
            label="عدد الهدايا"
            value={formatNumber(stats.gifts_count)}
            icon={Gift}
            accent="umber"
          />
          <ReportStatTile
            label="متوسط المشترى"
            value={formatCurrency(stats.average_purchase, currency)}
            icon={BarChart3}
            accent="wheat"
          />
        </section>

        <SalesTrendChart
          title="اتجاه المبيعات"
          points={stats.daily_sales}
          currency={currency}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <GiftDistributionChart
            title="توزيع الهدايا"
            visitGifts={stats.visit_track_gifts_count}
            pointsGifts={stats.points_track_gifts_count}
            pendingGifts={stats.pending_gifts_count}
          />
          <TopCustomersChart
            title="أفضل العملاء"
            items={stats.top_customers}
            currency={currency}
          />
        </div>

        <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <ReportStatTile
            label="هدايا معلّقة"
            value={formatNumber(stats.pending_gifts_count)}
            icon={Clock}
            accent="umber"
          />
          <ReportStatTile
            label="هدايا مُسلّمة"
            value={formatNumber(stats.delivered_gifts_count)}
            icon={CheckCircle2}
            accent="wheat"
          />
          <ReportStatTile
            label="هدايا الزيارات"
            value={formatNumber(stats.visit_track_gifts_count)}
            icon={Store}
            accent="umber"
          />
          <ReportStatTile
            label="هدايا النقاط"
            value={formatNumber(stats.points_track_gifts_count)}
            icon={Star}
            accent="wheat"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e5eaf0] bg-white">
          <div className="border-b border-[#e5eaf0] px-4 py-3">
            <h3 className="text-sm font-extrabold">أفضل العملاء</h3>
          </div>
          {stats.top_customers.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[#5a6278]">لا يوجد عملاء في هذه الفترة</p>
          ) : (
            <ul>
              {stats.top_customers.map((item) => (
                <li
                  key={item.customer_id}
                  className="flex items-center gap-3 border-b border-[#e5eaf0] px-4 py-3 last:border-b-0"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8c87a]/25 text-sm font-extrabold text-[#a67c2e]">
                    {customerInitial(item.customer_name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{item.customer_name}</span>
                    <span className="block truncate text-xs text-[#5a6278]">{item.customer_phone}</span>
                  </span>
                  <span className="shrink-0 text-sm font-extrabold">
                    {formatCurrency(item.spent, currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="border-t border-[#e5eaf0] pt-3 text-center text-[11px] text-[#5a6278]">
          تم إنشاء التقرير بواسطة نظام ولاء — {new Intl.DateTimeFormat('ar-IQ', { dateStyle: 'full', timeStyle: 'short' }).format(new Date())}
        </footer>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, MessageCircle, Share2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Icon } from '@shared/components';
import { encodeCustomerQr, formatCurrency, formatNumber } from '@shared/lib/format';
import { buildLoyaltyCardTextMessage } from '@shared/lib/whatsappMessages';
import {
  generateQrDataUrl,
  isMobileDevice,
  openSms,
  openWhatsApp,
  saveOrShareImageBlob,
  shareImageBlob,
} from '@shared/lib/whatsapp';
import { useLogoSrc, useSettingsQuery } from '@/features/settings';
import { APP_NAME } from '@/config/env';
import type { Customer } from '../types/customer.types';
import { renderLoyaltyCardPng } from '../lib/renderLoyaltyCardPng';
import brandLogo from '@/assets/app-icon.png';

interface CustomerLoyaltyCardProps {
  customer: Customer;
}

export function CustomerLoyaltyCard({ customer }: CustomerLoyaltyCardProps) {
  const { data: settings } = useSettingsQuery();
  const logoSrc = useLogoSrc();
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const renderIdRef = useRef(0);

  const cafeName = settings?.cafe_name?.trim() || APP_NAME;
  const currency = settings?.currency || 'د.ع';
  const qrPayload = encodeCustomerQr(customer.id);
  const safeName = customer.name.replace(/[^\w\u0600-\u06FF]+/g, '_') || 'customer';
  const filename = `loyalty_card_${safeName}.png`;
  const logoForRender = logoSrc ?? brandLogo;

  const textMessage = useMemo(
    () =>
      buildLoyaltyCardTextMessage({
        customerName: customer.name,
        phone: customer.phone,
        cafeName,
        visits: formatNumber(customer.visit_count),
        points: formatNumber(customer.points),
        spent: formatCurrency(customer.total_spent, currency),
      }),
    [cafeName, currency, customer.name, customer.phone, customer.points, customer.total_spent, customer.visit_count]
  );

  useEffect(() => {
    let cancelled = false;
    void generateQrDataUrl(qrPayload, 280).then((url) => {
      if (!cancelled) setQrSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [qrPayload]);

  // Pre-render PNG with Canvas2D so mobile share keeps a fresh user-gesture path.
  useEffect(() => {
    const id = ++renderIdRef.current;
    setPreparing(true);
    setCardBlob(null);

    void renderLoyaltyCardPng({
      cafeName,
      appName: APP_NAME,
      customerName: customer.name,
      phone: customer.phone,
      visitsLabel: 'الزيارات',
      pointsLabel: 'النقاط',
      spentLabel: 'المدفوع',
      visitsValue: formatNumber(customer.visit_count),
      pointsValue: formatNumber(customer.points),
      spentValue: formatCurrency(customer.total_spent, currency),
      qrPayload,
      logoSrc: logoForRender,
    })
      .then((blob) => {
        if (renderIdRef.current !== id) return;
        setCardBlob(blob);
      })
      .catch(() => {
        if (renderIdRef.current !== id) return;
        setCardBlob(null);
      })
      .finally(() => {
        if (renderIdRef.current === id) setPreparing(false);
      });
  }, [
    cafeName,
    currency,
    customer.name,
    customer.phone,
    customer.points,
    customer.total_spent,
    customer.visit_count,
    logoForRender,
    qrPayload,
  ]);

  const ensureCardBlob = async (): Promise<Blob> => {
    if (cardBlob) return cardBlob;
    const blob = await renderLoyaltyCardPng({
      cafeName,
      appName: APP_NAME,
      customerName: customer.name,
      phone: customer.phone,
      visitsLabel: 'الزيارات',
      pointsLabel: 'النقاط',
      spentLabel: 'المدفوع',
      visitsValue: formatNumber(customer.visit_count),
      pointsValue: formatNumber(customer.points),
      spentValue: formatCurrency(customer.total_spent, currency),
      qrPayload,
      logoSrc: logoForRender,
    });
    setCardBlob(blob);
    return blob;
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await ensureCardBlob();
      const result = await saveOrShareImageBlob(blob, filename, 'بطاقة ولاء');
      toast.success(
        result === 'shared'
          ? 'اختر حفظ الصورة أو مشاركتها من القائمة'
          : isMobileDevice()
            ? 'افتح الصورة واضغط مطولاً ثم احفظها'
            : 'تم تحميل بطاقة الولاء'
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('تعذر حفظ البطاقة — جرّب إرسال رسالة البيانات');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const blob = await ensureCardBlob();
      const result = await shareImageBlob(blob, {
        filename,
        title: 'بطاقة ولاء',
        message: textMessage,
      });

      if (result === 'shared') {
        toast.success('اختر واتساب أو أي تطبيق لمشاركة صورة البطاقة');
        return;
      }
      if (result === 'clipboard') {
        if (customer.phone) {
          openWhatsApp(
            customer.phone,
            `${textMessage}\n\n📎 تم نسخ صورة البطاقة — الصقها في المحادثة.`
          );
        }
        toast.success('تم نسخ البطاقة — الصقها في واتساب');
        return;
      }

      // Mobile fallback: open image + WhatsApp text
      if (customer.phone) openWhatsApp(customer.phone, textMessage);
      toast.message(
        isMobileDevice()
          ? 'تم فتح الصورة — احفظها ثم أرفقها في واتساب'
          : 'تم تجهيز البطاقة — أرفقها يدوياً',
        { duration: 7000 }
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('تعذر مشاركة الصورة — استخدم إرسال رسالة البيانات');
    } finally {
      setSharing(false);
    }
  };

  const handleSendText = async () => {
    if (!customer.phone) {
      toast.error('لا يوجد رقم هاتف لهذا العميل');
      return;
    }

    setMessaging(true);
    try {
      const sentWa = openWhatsApp(customer.phone, textMessage);
      if (sentWa) {
        toast.success('تم فتح واتساب برسالة بيانات البطاقة');
        return;
      }

      if (isMobileDevice() && openSms(customer.phone, textMessage)) {
        toast.success('تم فتح تطبيق الرسائل');
        return;
      }

      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'بطاقة ولاء', text: textMessage });
        toast.success('اختر تطبيقاً لإرسال الرسالة');
        return;
      }

      toast.error('تعذر فتح تطبيق المراسلة');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('تعذر إرسال الرسالة');
    } finally {
      setMessaging(false);
    }
  };

  const busy = preparing && !cardBlob;
  const actionsDisabled = busy || (!cardBlob && preparing);

  return (
    <div className="space-y-4">
      <div className="mx-auto w-full max-w-[22rem]">
        <div
          dir="rtl"
          className="relative overflow-hidden rounded-[1.75rem] shadow-2xl"
          style={{
            fontFamily: '"Cairo", sans-serif',
            background:
              'linear-gradient(145deg, #0f1f3d 0%, #1a3b70 42%, #1e7585 78%, #0f1f3d 100%)',
          }}
        >
          <div
            className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, #cfa34e 0%, transparent 70%)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-10 h-64 w-64 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #e8c87a 0%, transparent 68%)' }}
          />

          <div className="relative px-5 pb-5 pt-5 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={logoForRender}
                  alt={cafeName}
                  className="h-12 w-12 rounded-2xl border border-white/25 object-cover shadow-lg"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.18em] text-[#e8c87a]">
                    LOYALTY
                  </p>
                  <h3 className="truncate text-base font-extrabold leading-tight">{cafeName}</h3>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#e8c87a]/40 bg-[#e8c87a]/15 px-2.5 py-1 text-[10px] font-bold text-[#e8c87a]">
                <Icon icon={Sparkles} size="xs" />
                عضو
              </span>
            </div>

            <div className="mt-6">
              <p className="text-[11px] font-semibold text-white/55">حامل البطاقة</p>
              <p className="mt-1 text-2xl font-extrabold leading-snug tracking-tight">
                {customer.name}
              </p>
              <p className="mt-1 font-mono text-sm tracking-wide text-white/70" dir="ltr">
                {customer.phone}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <StatBlock label="الزيارات" value={formatNumber(customer.visit_count)} />
              <StatBlock label="النقاط" value={formatNumber(customer.points)} />
              <StatBlock
                label="المدفوع"
                value={formatCurrency(customer.total_spent, currency)}
                compact
              />
            </div>

            <div className="mt-5 flex items-end justify-between gap-4">
              <div className="min-w-0 flex-1 pb-1">
                <p className="text-[11px] leading-relaxed text-white/60">
                  امسح رمز QR عند الزيارة لتسجيل المشتريات ونقاط الولاء فوراً.
                </p>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#e8c87a]/80">
                  {APP_NAME}
                </p>
              </div>
              <div className="shrink-0 rounded-2xl bg-white p-2 shadow-lg">
                {qrSrc ? (
                  <img src={qrSrc} alt="" width={96} height={96} className="block h-24 w-24" />
                ) : (
                  <div className="h-24 w-24 animate-pulse rounded-lg bg-slate-200" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {busy && (
        <p className="text-center text-xs text-muted">جاري تجهيز صورة البطاقة للمشاركة...</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          className="flex-1 bg-[#25D366] text-white hover:bg-[#20bd5a] sm:min-w-[10rem]"
          onClick={handleShare}
          disabled={sharing || actionsDisabled}
        >
          <Icon icon={Share2} size="sm" />
          {sharing ? 'جاري المشاركة...' : 'مشاركة الصورة'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 sm:min-w-[10rem]"
          onClick={handleDownload}
          disabled={downloading || actionsDisabled}
        >
          <Icon icon={Download} size="sm" />
          {downloading ? 'جاري الحفظ...' : 'حفظ الصورة'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 border-[#25D366]/40 text-[#128C7E] sm:min-w-[10rem]"
          onClick={handleSendText}
          disabled={messaging || !customer.phone}
        >
          <Icon icon={MessageCircle} size="sm" />
          {messaging ? 'جاري الفتح...' : 'إرسال رسالة البيانات'}
        </Button>
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-2.5 py-3">
      <p className="text-[10px] font-bold text-white/55">{label}</p>
      <p
        className={
          compact
            ? 'mt-1 text-xs font-extrabold leading-snug tabular-nums text-[#e8c87a]'
            : 'mt-1 text-lg font-extrabold tabular-nums text-[#e8c87a]'
        }
        dir="ltr"
      >
        {value}
      </p>
    </div>
  );
}

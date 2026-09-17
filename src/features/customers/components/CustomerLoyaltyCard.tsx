import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
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
import brandLogo from '@/assets/app-icon.png';

interface CustomerLoyaltyCardProps {
  customer: Customer;
}

async function toDataUrl(src: string): Promise<string> {
  if (src.startsWith('data:')) return src;
  const response = await fetch(src);
  if (!response.ok) throw new Error('IMAGE_FETCH_FAILED');
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function CustomerLoyaltyCard({ customer }: CustomerLoyaltyCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { data: settings } = useSettingsQuery();
  const logoSrc = useLogoSrc();
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [messaging, setMessaging] = useState(false);

  const cafeName = settings?.cafe_name?.trim() || APP_NAME;
  const currency = settings?.currency || 'د.ع';
  const qrPayload = encodeCustomerQr(customer.id);
  const safeName = customer.name.replace(/[^\w\u0600-\u06FF]+/g, '_') || 'customer';
  const filename = `loyalty_card_${safeName}.png`;

  const textMessage = buildLoyaltyCardTextMessage({
    customerName: customer.name,
    phone: customer.phone,
    cafeName,
    visits: formatNumber(customer.visit_count),
    points: formatNumber(customer.points),
    spent: formatCurrency(customer.total_spent, currency),
  });

  useEffect(() => {
    let cancelled = false;
    void generateQrDataUrl(qrPayload, 280).then((url) => {
      if (!cancelled) setQrSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [qrPayload]);

  const captureCard = async (): Promise<Blob> => {
    const node = cardRef.current;
    if (!node) throw new Error('CARD_MISSING');

    // Wait a frame so layout/QR paint before capture (important on mobile).
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const clone = node.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.zIndex = '-1';
    clone.style.width = `${node.offsetWidth || 352}px`;
    clone.style.transform = 'none';
    clone.style.pointerEvents = 'none';

    // Convert images to data URLs so html2canvas does not hit CORS / blob issues on mobile.
    const sourceImgs = Array.from(node.querySelectorAll('img'));
    const cloneImgs = Array.from(clone.querySelectorAll('img'));
    await Promise.all(
      cloneImgs.map(async (img, index) => {
        const original = sourceImgs[index];
        const src = original?.currentSrc || original?.src || img.src;
        if (!src) return;
        try {
          const dataUrl = await toDataUrl(src);
          img.setAttribute('src', dataUrl);
          img.removeAttribute('crossorigin');
        } catch {
          // Keep original src; capture may still succeed for data URLs / same-origin.
        }
      })
    );

    // backdrop-blur / filters often break html2canvas on mobile WebKit.
    clone.querySelectorAll('*').forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.backdropFilter = 'none';
      htmlEl.style.setProperty('-webkit-backdrop-filter', 'none');
      htmlEl.style.filter = 'none';
    });

    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, {
        backgroundColor: '#0f1f3d',
        scale: Math.min(2, window.devicePixelRatio || 2),
        useCORS: true,
        allowTaint: false,
        logging: false,
        foreignObjectRendering: false,
        imageTimeout: 8_000,
      });

      if (!canvas.width || !canvas.height) {
        throw new Error('CARD_CANVAS_EMPTY');
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (!result || result.size === 0) reject(new Error('CARD_BLOB_EMPTY'));
            else resolve(result);
          },
          'image/png',
          1
        );
      });

      return blob;
    } finally {
      clone.remove();
    }
  };

  const shareMessage = `بطاقة ولاء ${customer.name} — ${cafeName}`;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await captureCard();
      const result = await saveOrShareImageBlob(blob, filename, 'بطاقة ولاء');
      toast.success(
        result === 'shared'
          ? isMobileDevice()
            ? 'اختر حفظ الصورة أو مشاركتها'
            : 'تمت مشاركة البطاقة'
          : isMobileDevice()
            ? 'افتح الصورة واحفظها من المتصفح'
            : 'تم تحميل بطاقة الولاء'
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('تعذر تحميل البطاقة — جرّب مرة أخرى');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const blob = await captureCard();
      const result = await shareImageBlob(blob, {
        filename,
        title: 'بطاقة ولاء',
        message: shareMessage,
      });

      if (result === 'shared') {
        toast.success('اختر واتساب أو أي تطبيق لمشاركة البطاقة');
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

      if (customer.phone) openWhatsApp(customer.phone, textMessage);
      toast.message(
        isMobileDevice()
          ? 'تم تجهيز البطاقة — احفظ الصورة ثم أرفقها من الملفات في واتساب'
          : 'تم تحميل البطاقة — أرفقها يدوياً',
        { duration: 7000 }
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('تعذر مشاركة البطاقة — جرّب إرسال الرسالة النصية');
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
      // Prefer WhatsApp (most common for cafe customers); SMS as secondary on mobile.
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

  const cafeTitleClass = 'truncate text-base font-extrabold leading-tight';

  return (
    <div className="space-y-4">
      <div className="mx-auto w-full max-w-[22rem]">
        <div
          ref={cardRef}
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
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.12) 100%)',
            }}
          />

          <div className="relative px-5 pb-5 pt-5 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={logoSrc ?? brandLogo}
                  alt={cafeName}
                  className="h-12 w-12 rounded-2xl border border-white/25 object-cover shadow-lg"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.18em] text-[#e8c87a]">
                    LOYALTY
                  </p>
                  <h3 className={cafeTitleClass}>{cafeName}</h3>
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

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          className="flex-1 bg-[#25D366] text-white hover:bg-[#20bd5a] sm:min-w-[10rem]"
          onClick={handleShare}
          disabled={sharing || !qrSrc}
        >
          <Icon icon={Share2} size="sm" />
          {sharing ? 'جاري التحضير...' : 'مشاركة الصورة'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 sm:min-w-[10rem]"
          onClick={handleDownload}
          disabled={downloading || !qrSrc}
        >
          <Icon icon={Download} size="sm" />
          {downloading ? 'جاري التجهيز...' : 'تحميل / حفظ'}
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

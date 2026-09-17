import { useEffect, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Icon } from '@shared/components';
import { encodeCustomerQr } from '@shared/lib/format';
import { buildQrFollowUpMessage } from '@shared/lib/whatsappMessages';
import {
  downloadBlob,
  generateQrDataUrl,
  generateQrPngBlob,
  isMobileDevice,
  openWhatsApp,
  shareQrImage,
} from '@shared/lib/whatsapp';

interface CustomerQrPanelProps {
  customerId: string;
  customerName: string;
  phone?: string;
  size?: number;
  showActions?: boolean;
}

export function CustomerQrPanel({
  customerId,
  customerName,
  phone,
  size = 180,
  showActions = true,
}: CustomerQrPanelProps) {
  const qrPayload = encodeCustomerQr(customerId);
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const followUpMessage = buildQrFollowUpMessage(customerName);
  const safeFileName = `qr_${customerName.replace(/[^\w\u0600-\u06FF]+/g, '_') || 'customer'}.png`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setQrSrc(null);

    void generateQrDataUrl(qrPayload, Math.max(size * 2, 320))
      .then((url) => {
        if (!cancelled) {
          setQrSrc(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrSrc(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [qrPayload, size]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await generateQrPngBlob(qrPayload);
      downloadBlob(blob, safeFileName);
      toast.success('تم تحميل رمز QR');
    } catch {
      toast.error('تعذر تحميل رمز QR');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const blob = await generateQrPngBlob(qrPayload);
      const result = await shareQrImage(blob, followUpMessage);

      if (result === 'shared') {
        toast.success('اختر واتساب من قائمة المشاركة لإرسال الصورة');
        return;
      }

      if (result === 'clipboard') {
        if (phone) {
          openWhatsApp(
            phone,
            `${followUpMessage}\n\n📎 تم نسخ صورة QR — الصقها في المحادثة (Ctrl+V).`
          );
        }
        toast.success('تم نسخ صورة QR — الصقها في واتساب');
        return;
      }

      if (phone) openWhatsApp(phone, followUpMessage);
      toast.message(
        isMobileDevice()
          ? 'تم تحميل صورة QR — أرفقها من الملفات في واتساب'
          : 'تم تحميل صورة QR — أرفقها يدوياً في واتساب',
        { duration: 7000 }
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('تعذر مشاركة QR — جرّب التحميل ثم الإرفاق يدوياً');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex items-center justify-center rounded-2xl border border-line bg-white p-4 shadow-sm"
        style={{ minWidth: size + 32, minHeight: size + 32 }}
      >
        {loading && (
          <div
            className="animate-pulse rounded-lg bg-line/60"
            style={{ width: size, height: size }}
            aria-label="جاري تحميل رمز QR"
          />
        )}
        {!loading && qrSrc && (
          <img
            src={qrSrc}
            alt={`رمز QR لـ ${customerName}`}
            width={size}
            height={size}
            className="block h-auto max-w-full"
            style={{ width: size, height: size }}
            decoding="async"
          />
        )}
        {!loading && !qrSrc && (
          <p className="max-w-[10rem] text-center text-xs font-semibold text-umber">
            تعذر عرض رمز QR
          </p>
        )}
      </div>

      <p className="max-w-xs break-all text-center font-mono text-[10px] text-muted">{qrPayload}</p>

      {showActions && (
        <div className="flex w-full max-w-xs flex-col gap-2">
          <Button
            type="button"
            size="sm"
            className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a]"
            onClick={handleShare}
            disabled={sharing || !qrSrc}
          >
            <Icon icon={Share2} size="sm" />
            {sharing ? 'جاري التحضير...' : 'مشاركة / إرسال QR'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            onClick={handleDownload}
            disabled={downloading || !qrSrc}
          >
            <Icon icon={Download} size="sm" />
            {downloading ? 'جاري التحميل...' : 'تحميل QR'}
          </Button>
        </div>
      )}
    </div>
  );
}

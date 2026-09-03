import { useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { Check, Download, MessageCircle, Share2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Icon } from '@shared/components';
import { encodeCustomerQr } from '@shared/lib/format';
import { buildQrFollowUpMessage, buildWhatsAppWelcomeMessage } from '@shared/lib/whatsappMessages';
import {
  downloadBlob,
  generateQrPngBlob,
  isMobileDevice,
  openWhatsApp,
  shareQrImage,
} from '@shared/lib/whatsapp';

interface CustomerWelcomeSheetProps {
  open: boolean;
  customerId: string;
  customerName: string;
  phone: string;
  cafeName: string;
  onComplete: () => void;
}

export function CustomerWelcomeSheet({
  open,
  customerId,
  customerName,
  phone,
  cafeName,
  onComplete,
}: CustomerWelcomeSheetProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [welcomeSent, setWelcomeSent] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const openedRef = useRef(false);

  const qrPayload = encodeCustomerQr(customerId);
  const welcomeMessage = buildWhatsAppWelcomeMessage(customerName, cafeName, 0);
  const followUpMessage = buildQrFollowUpMessage(customerName);
  const safeFileName = `qr_${customerName.replace(/[^\w\u0600-\u06FF]+/g, '_') || 'customer'}.png`;

  useEffect(() => {
    if (!open) {
      openedRef.current = false;
      setWelcomeSent(false);
      return;
    }
    if (openedRef.current) return;
    openedRef.current = true;

    const sent = openWhatsApp(phone, welcomeMessage);
    setWelcomeSent(sent);
    if (sent) {
      toast.success('تم فتح واتساب — أرسل رسالة الترحيب ثم اضغط «إرسال QR على واتساب»');
    } else {
      toast.error('تعذر فتح واتساب — تحقق من رقم الهاتف');
    }
  }, [open, phone, welcomeMessage]);

  if (!open) return null;

  const handleDownloadQr = async () => {
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

  const handleSendQrToWhatsApp = async () => {
    setSharing(true);
    try {
      const blob = await generateQrPngBlob(qrPayload);
      const result = await shareQrImage(blob, followUpMessage);

      if (result === 'shared') {
        toast.success('اختر «واتساب» من قائمة المشاركة لإرسال الصورة مع النص');
        return;
      }

      if (result === 'clipboard') {
        openWhatsApp(
          phone,
          `${followUpMessage}\n\n📎 تم نسخ صورة QR — الصقها في المحادثة (${isMobileDevice() ? 'لمسة مطوّلة → لصق' : 'Ctrl+V'}).`
        );
        toast.success('تم نسخ صورة QR في الحافظة — الصقها في واتساب');
        return;
      }

      openWhatsApp(phone, followUpMessage);
      toast.message('تم تحميل صورة QR — أرفقها من الملفات في واتساب', { duration: 7000 });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('تعذر إرسال QR — جرّب «تحميل QR» ثم أرفقها يدوياً');
    } finally {
      setSharing(false);
    }
  };

  const handleResendWelcome = () => {
    const sent = openWhatsApp(phone, welcomeMessage);
    if (sent) toast.success('تم فتح واتساب');
    else toast.error('تعذر فتح واتساب');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/60 backdrop-blur-[2px]"
        aria-label="إغلاق"
        onClick={onComplete}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-t-3xl border border-line bg-panel shadow-2xl sm:rounded-2xl">
        <div className="border-b border-line bg-gradient-to-l from-wheat/10 to-transparent px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-wheat">تمت إضافة العميل بنجاح</p>
              <h2 className="mt-1 text-lg font-extrabold text-ink">ترحيب واتساب + رمز QR</h2>
              <p className="mt-1 text-sm text-muted">{customerName}</p>
            </div>
            <button
              type="button"
              onClick={onComplete}
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
              aria-label="إغلاق"
            >
              <Icon icon={X} size="sm" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface/50 p-3">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                welcomeSent ? 'bg-umber/15 text-umber' : 'bg-wheat/15 text-wheat'
              }`}
            >
              <Icon icon={welcomeSent ? Check : MessageCircle} size="sm" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-ink">1. رسالة الترحيب</p>
              <p className="text-xs text-muted">
                {welcomeSent ? 'تم فتح واتساب — أرسل الرسالة للعميل' : 'لم يُفتح واتساب'}
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={handleResendWelcome}>
              إعادة
            </Button>
          </div>

          <div className="rounded-2xl border border-line bg-surface/40 p-4">
            <p className="mb-1 text-sm font-extrabold text-ink">2. رمز عضوية QR</p>
            <p className="mb-3 text-xs text-muted">
              {isMobileDevice()
                ? 'اضغط الزر أدناه واختر واتساب من قائمة المشاركة'
                : 'على الكمبيوتر: تُنسخ الصورة تلقائياً — الصقها في واتساب'}
            </p>
            <div className="mx-auto flex w-fit flex-col items-center gap-3">
              <div
                ref={qrRef}
                className="rounded-2xl border border-line bg-white p-4 shadow-sm"
              >
                <QRCode value={qrPayload} size={180} level="M" />
              </div>
              <p className="max-w-xs text-center text-xs leading-relaxed text-muted">
                {followUpMessage}
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <Button
                type="button"
                size="sm"
                className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a]"
                onClick={handleSendQrToWhatsApp}
                disabled={sharing}
              >
                <Icon icon={Share2} size="sm" />
                {sharing ? 'جاري التحضير...' : 'إرسال QR على واتساب'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full"
                onClick={handleDownloadQr}
                disabled={downloading}
              >
                <Icon icon={Download} size="sm" />
                {downloading ? 'جاري التحميل...' : 'تحميل QR فقط'}
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-line px-5 py-4">
          <Button type="button" className="w-full" onClick={onComplete}>
            تم — الانتقال لصفحة العميل
          </Button>
        </div>
      </div>
    </div>
  );
}

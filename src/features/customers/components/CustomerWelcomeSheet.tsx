import { useEffect, useRef, useState } from 'react';
import { Check, MessageCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Icon } from '@shared/components';
import { buildWhatsAppWelcomeMessage } from '@shared/lib/whatsappMessages';
import { isMobileDevice, openWhatsApp } from '@shared/lib/whatsapp';
import { CustomerQrPanel } from './CustomerQrPanel';

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
  const [welcomeSent, setWelcomeSent] = useState(false);
  const openedRef = useRef(false);

  const welcomeMessage = buildWhatsAppWelcomeMessage(customerName, cafeName, 0);

  useEffect(() => {
    if (!open) {
      openedRef.current = false;
      setWelcomeSent(false);
      return;
    }
    if (openedRef.current) return;
    openedRef.current = true;

    // Desktop: open WhatsApp in a new tab. Mobile browsers often block
    // popup-without-gesture — never navigate away or the QR sheet unloads.
    if (!isMobileDevice()) {
      const sent = openWhatsApp(phone, welcomeMessage);
      setWelcomeSent(sent);
      if (sent) {
        toast.success('تم فتح واتساب — أرسل رسالة الترحيب ثم شارك رمز QR');
      } else {
        toast.error('تعذر فتح واتساب — تحقق من رقم الهاتف');
      }
      return;
    }

    toast.message('اضغط «إرسال الترحيب» لفتح واتساب، ثم شارك رمز QR من الأزرار أدناه', {
      duration: 5000,
    });
  }, [open, phone, welcomeMessage]);

  if (!open) return null;

  const handleResendWelcome = () => {
    const sent = openWhatsApp(phone, welcomeMessage);
    setWelcomeSent(sent);
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
      <div className="relative z-10 max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-3xl border border-line bg-panel shadow-2xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 border-b border-line bg-gradient-to-l from-wheat/10 to-panel px-5 py-4">
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
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                welcomeSent ? 'bg-umber/15 text-umber' : 'bg-wheat/15 text-wheat'
              }`}
            >
              <Icon icon={welcomeSent ? Check : MessageCircle} size="sm" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-ink">1. رسالة الترحيب</p>
              <p className="text-xs text-muted">
                {welcomeSent
                  ? 'تم فتح واتساب — أرسل الرسالة للعميل'
                  : isMobileDevice()
                    ? 'اضغط إرسال الترحيب لفتح واتساب'
                    : 'لم يُفتح واتساب'}
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={handleResendWelcome}>
              {isMobileDevice() && !welcomeSent ? 'إرسال الترحيب' : 'إعادة'}
            </Button>
          </div>

          <div className="rounded-2xl border border-line bg-surface/40 p-4">
            <p className="mb-1 text-sm font-extrabold text-ink">2. رمز عضوية QR</p>
            <p className="mb-3 text-xs text-muted">
              {isMobileDevice()
                ? 'اضغط مشاركة واختر واتساب من قائمة الجهاز'
                : 'على الكمبيوتر: تُنسخ الصورة أو تُحمّل — الصقها/أرفقها في واتساب'}
            </p>
            <CustomerQrPanel
              customerId={customerId}
              customerName={customerName}
              phone={phone}
              size={180}
            />
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-line bg-panel px-5 py-4">
          <Button type="button" className="w-full" onClick={onComplete}>
            تم — الانتقال لصفحة العميل
          </Button>
        </div>
      </div>
    </div>
  );
}

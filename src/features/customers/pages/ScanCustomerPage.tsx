import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Icon } from '@shared/components';
import { decodeCustomerQr } from '@shared/lib/customerQr';
import { customersApi } from '../api/customers.api';
import { CustomerQrScanner } from '../components/CustomerQrScanner';
import { ScanActionSheet } from '../components/ScanActionSheet';
import type { Customer } from '../types/customer.types';

export function ScanCustomerPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const resumeScan = useCallback(() => {
    setSheetOpen(false);
    setCustomer(null);
    setError(null);
    setLoading(false);
    setScannerActive(true);
  }, []);

  const handleScan = useCallback(async (raw: string) => {
    const customerId = decodeCustomerQr(raw);
    if (!customerId) {
      setError('رمز QR غير صالح لهذا التطبيق');
      setScannerActive(false);
      window.setTimeout(() => {
        setError(null);
        setScannerActive(true);
      }, 2800);
      return;
    }

    setScannerActive(false);
    setLoading(true);
    setError(null);

    try {
      const found = await customersApi.getById(customerId);
      if (!found.is_active) {
        setError('لم يتم العثور على عميل نشط مطابق لهذا الرمز');
        setScannerActive(true);
        return;
      }
      setCustomer(found);
      setSheetOpen(true);
    } catch {
      setError('لم يتم العثور على عميل مطابق لهذا الرمز');
      setScannerActive(true);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-black lg:min-h-[32rem] lg:rounded-2xl lg:border lg:border-line">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white lg:hidden">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-white/90"
        >
          <Icon icon={ArrowRight} size="sm" />
          رجوع
        </Link>
        <h1 className="text-sm font-extrabold">مسح رمز العميل</h1>
        <span className="w-12" aria-hidden />
      </div>

      <div className="relative min-h-0 flex-1">
        <CustomerQrScanner
          active={scannerActive}
          onScan={handleScan}
          className="absolute inset-0 min-h-0"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-16 lg:pb-6">
          <p className="text-center text-sm font-semibold leading-relaxed text-white/90">
            وجّه الكاميرا نحو رمز QR الخاص بالعميل للبحث عنه فوراً
          </p>

          {error && (
            <p className="mt-3 rounded-xl bg-umber/90 px-4 py-3 text-center text-sm font-bold text-white">
              {error}
            </p>
          )}

          {loading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-white">
              <Icon icon={Loader2} size="sm" className="animate-spin" />
              جاري التحقق من العميل...
            </div>
          )}
        </div>
      </div>

      {customer && (
        <ScanActionSheet open={sheetOpen} customer={customer} onClose={resumeScan} />
      )}
    </div>
  );
}

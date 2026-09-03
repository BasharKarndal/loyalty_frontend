import { Link } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { Icon } from '@shared/components';

interface ScanFabProps {
  className?: string;
}

/** Floating QR scanner button — matches mobile app dashboard FAB. */
export function ScanFab({ className }: ScanFabProps) {
  return (
    <Link
      to="/scan"
      aria-label="مسح رمز العميل"
      title="مسح رمز العميل"
      className={cn(
        'fixed z-30 flex h-14 w-14 items-center justify-center rounded-full',
        'bg-gradient-to-br from-wheat to-wheat-dark text-white shadow-lg shadow-wheat/30',
        'transition-transform hover:scale-105 active:scale-95',
        'bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-4 lg:bottom-8 lg:left-8',
        className
      )}
    >
      <Icon icon={QrCode} size="md" />
    </Link>
  );
}

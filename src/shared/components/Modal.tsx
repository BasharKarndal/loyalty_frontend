import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { Button } from './Button';
import { Icon } from './Icon';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  loading?: boolean;
  className?: string;
  onConfirm?: () => void;
  onClose: () => void;
}

export function Modal({
  open,
  title,
  description,
  children,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  confirmVariant = 'primary',
  loading = false,
  className,
  onConfirm,
  onClose,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/50 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="إغلاق"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-2xl',
          className
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
            aria-label="إغلاق"
          >
            <Icon icon={X} size="sm" />
          </button>
        </div>

        {children}

        {onConfirm && (
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={confirmVariant}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'جاري التنفيذ...' : confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

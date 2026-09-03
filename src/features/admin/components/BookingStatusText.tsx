import { cn } from '@shared/lib/cn';
import {
  BOOKING_STATUS_LABEL,
  type BookingStatus,
} from '../types/admin.types';

const styles: Record<BookingStatus, string> = {
  active: 'text-success',
  expiring: 'text-wheat-dark',
  expired: 'text-danger',
  inactive: 'text-muted',
};

export function BookingStatusText({ status }: { status: BookingStatus }) {
  return (
    <span className={cn('text-xs font-extrabold', styles[status])}>
      {BOOKING_STATUS_LABEL[status]}
    </span>
  );
}

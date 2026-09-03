import { useState, type FormEvent } from 'react';
import { Button, Input, Modal } from '@shared/components';
import { cn } from '@shared/lib/cn';
import { useExtendBookingMutation } from '../api/admin.queries';
import { DURATION_PRESETS } from '../types/admin.types';

interface ExtendBookingModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

export function ExtendBookingModal({ userId, userName, onClose }: ExtendBookingModalProps) {
  const extendMutation = useExtendBookingMutation();
  const [durationDays, setDurationDays] = useState(30);
  const [customDays, setCustomDays] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const days = customDays.trim() ? Number(customDays) : durationDays;
    if (!Number.isFinite(days) || days < 1) return;
    try {
      await extendMutation.mutateAsync({
        user_id: userId,
        duration_days: days,
        notes: notes.trim() || null,
      });
      onClose();
    } catch {
      // toast is shown by the mutation
    }
  };

  return (
    <Modal
      open
      title="تمديد الحجز"
      description={userName}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset.days}
              type="button"
              onClick={() => {
                setDurationDays(preset.days);
                setCustomDays('');
              }}
              className={cn(
                'px-3 py-1.5 text-sm font-bold transition-colors',
                !customDays && durationDays === preset.days
                  ? 'border-b-2 border-wheat text-wheat'
                  : 'text-muted hover:text-ink'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <Input
          label="مدة مخصصة بالأيام"
          type="number"
          min={1}
          max={3650}
          value={customDays}
          onChange={(event) => setCustomDays(event.target.value)}
          placeholder="اختياري"
        />
        <Input
          label="ملاحظة"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={extendMutation.isPending}>
            إلغاء
          </Button>
          <Button type="submit" disabled={extendMutation.isPending}>
            {extendMutation.isPending ? 'جاري التمديد...' : 'تمديد الحجز'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

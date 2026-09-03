import { useState, type FormEvent } from 'react';
import { Button, Input, Modal } from '@shared/components';
import { cn } from '@shared/lib/cn';
import { useCreateAdminMutation } from '../api/admin.queries';
import { DURATION_PRESETS } from '../types/admin.types';

interface CreateAdminModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateAdminModal({ open, onClose }: CreateAdminModalProps) {
  const createMutation = useCreateAdminMutation();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [customDays, setCustomDays] = useState('');
  const [notes, setNotes] = useState('');

  const reset = () => {
    setUsername('');
    setFullName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setDurationDays(30);
    setCustomDays('');
    setNotes('');
  };

  const handleClose = () => {
    if (createMutation.isPending) return;
    reset();
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const days = customDays.trim() ? Number(customDays) : durationDays;
    if (!Number.isFinite(days) || days < 1) return;

    try {
      await createMutation.mutateAsync({
        username: username.trim().toLowerCase(),
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || null,
        duration_days: days,
        notes: notes.trim() || null,
      });
      reset();
      onClose();
    } catch {
      // toast is shown by the mutation
    }
  };

  return (
    <Modal
      open={open}
      title="حساب مدير جديد"
      description="ينشأ للمدير نسخة مستقلة من النظام مع حجز يحدد مدة العمل."
      className="max-w-lg"
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="الاسم الكامل"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          minLength={2}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="اسم المستخدم"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="off"
            required
            minLength={3}
          />
          <Input
            label="البريد"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="كلمة المرور"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
          <Input
            label="الهاتف"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">مدة الحجز</p>
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
          <div className="mt-3">
            <Input
              label="مدة مخصصة بالأيام"
              type="number"
              min={1}
              max={3650}
              value={customDays}
              onChange={(event) => setCustomDays(event.target.value)}
              placeholder="اختياري"
            />
          </div>
        </div>

        <Input
          label="ملاحظة"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="مثال: حجز تجريبي للمقهى"
        />

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={handleClose} disabled={createMutation.isPending}>
            إلغاء
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

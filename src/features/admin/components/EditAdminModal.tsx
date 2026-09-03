import { useState, type FormEvent } from 'react';
import { Button, Input, Modal } from '@shared/components';
import { useUpdateAdminMutation } from '../api/admin.queries';
import { SystemPassword } from './SystemPassword';
import type { ManagedUser } from '../types/admin.types';

interface EditAdminModalProps {
  user: ManagedUser | null;
  onClose: () => void;
}

export function EditAdminModal({ user, onClose }: EditAdminModalProps) {
  const updateMutation = useUpdateAdminMutation();
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(user?.is_active ?? true);

  if (!user) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await updateMutation.mutateAsync({
        id: user.id,
        payload: {
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          is_active: isActive,
          password: password.trim() || null,
        },
      });
      onClose();
    } catch {
      // toast is shown by the mutation
    }
  };

  return (
    <Modal
      open
      title={`تعديل ${user.full_name}`}
      description={`@${user.username}`}
      className="max-w-lg"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="الاسم الكامل"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
        <Input
          label="البريد"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          label="الهاتف"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">كلمة المرور الحالية</p>
          <SystemPassword value={user.system_password} />
        </div>
        <Input
          label="كلمة مرور جديدة"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="اتركه فارغاً للإبقاء على الحالية"
          minLength={8}
        />
        <label className="flex items-center gap-2 text-sm font-bold text-ink">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-4 w-4 accent-wheat"
          />
          الحساب فعّال
        </label>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
            إلغاء
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

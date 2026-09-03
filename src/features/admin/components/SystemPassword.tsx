import { useState } from 'react';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Icon } from '@shared/components';

export function SystemPassword({ value }: { value?: string | null }) {
  const [visible, setVisible] = useState(false);

  if (!value) {
    return <span className="text-xs text-muted">عيّن كلمة مرور لعرضها هنا</span>;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('تم نسخ كلمة المرور');
    } catch {
      toast.error('تعذر النسخ');
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
      <span className="font-mono text-xs font-bold tracking-wide text-ink">
        {visible ? value : '••••••••'}
      </span>
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="p-1 text-muted transition-colors hover:text-wheat"
        aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
      >
        <Icon icon={visible ? EyeOff : Eye} size="sm" />
      </button>
      <button
        type="button"
        onClick={copy}
        className="p-1 text-muted transition-colors hover:text-wheat"
        aria-label="نسخ كلمة المرور"
      >
        <Icon icon={Copy} size="sm" />
      </button>
    </span>
  );
}
